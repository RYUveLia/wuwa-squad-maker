import { useState } from 'react'
import { MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import html2canvas from 'html2canvas'
import type { Character } from '../types'
import { ROVER_IDS } from '../constants'
import { MOCK_CHARACTERS, getMaxDeployment } from '../utils/character'

export function useSquadState() {
  const [squads, setSquads] = useState<(Character | null)[][]>([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ])
  
  const [selectedElement, setSelectedElement] = useState<string>('All')
  const [toast, setToast] = useState<string | null>(null)

  // 드래그 앤 드롭 마우스 & 터치 센서 구성
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8,
    },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5,
    },
  })
  const sensors = useSensors(mouseSensor, touchSensor)

  // 토스트 메시지 출력 유틸
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => {
      setToast(null)
    }, 2500)
  }

  // 1) 스쿼드 동적 추가
  const handleAddSquad = () => {
    setSquads((prev) => [...prev, [null, null, null]])
  }

  // 2) 스쿼드 동적 삭제 (최소 1개 스쿼드는 강제 보존)
  const handleDeleteSquad = (squadIdx: number) => {
    if (squads.length <= 1) return
    setSquads((prev) => prev.filter((_, idx) => idx !== squadIdx))
  }

  // 3) 캐릭터 할당 및 스마트 이동 처리
  const handleSelectCharacter = (char: Character, targetSquadIdx: number, targetSlotIdx: number) => {
    setSquads((prevSquads) => {
      const cleanedSquads = prevSquads.map(s => [...s])

      // [규칙 1] 동일 스쿼드 내 중복 배치 금지
      if (cleanedSquads[targetSquadIdx]) {
        const dupSlotIdx = cleanedSquads[targetSquadIdx].findIndex(slot => slot && slot.id === char.id)
        if (dupSlotIdx !== -1 && dupSlotIdx !== targetSlotIdx) {
          cleanedSquads[targetSquadIdx][dupSlotIdx] = null
        }
      }

      // [규칙 2] 전체 스쿼드 합산 한도 초과 시 스마트 재배치 (FIFO)
      const currentDeployments: { squadIdx: number; slotIdx: number }[] = []
      cleanedSquads.forEach((squad, sIdx) => {
        squad.forEach((slot, slIdx) => {
          if (sIdx === targetSquadIdx && slIdx === targetSlotIdx) return
          if (slot && slot.id === char.id) {
            currentDeployments.push({ squadIdx: sIdx, slotIdx: slIdx })
          }
        })
      })

      const maxAllowed = getMaxDeployment(char.id)

      if (currentDeployments.length >= maxAllowed) {
        const removeCount = currentDeployments.length - maxAllowed + 1
        for (let i = 0; i < removeCount; i++) {
          const deploy = currentDeployments[i]
          if (cleanedSquads[deploy.squadIdx]) {
            cleanedSquads[deploy.squadIdx][deploy.slotIdx] = null
          }
        }
      }
      
      if (cleanedSquads[targetSquadIdx]) {
        cleanedSquads[targetSquadIdx][targetSlotIdx] = char
      }
      return cleanedSquads
    })
  }

  // 4) 슬롯에서 캐릭터 제거
  const handleRemoveCharacter = (squadIdx: number, slotIdx: number) => {
    setSquads((prevSquads) => {
      const newSquads = prevSquads.map(squad => [...squad])
      if (newSquads[squadIdx]) {
        newSquads[squadIdx][slotIdx] = null
      }
      return newSquads
    })
  }

  // 파티 데이터 내보내기 (Export)
  const handleExport = () => {
    try {
      const serialized = JSON.stringify(squads.map(s => s.map(char => char ? char.id : null)))
      navigator.clipboard.writeText(serialized)
      showToast('파티 복사 코드가 클립보드에 저장되었습니다!')
    } catch (err) {
      showToast('코드 복사에 실패했습니다.')
    }
  }

  // 파티 데이터 불러오기 (Import)
  const handleImport = () => {
    const code = prompt('복사해두신 파티 코드를 입력해주세요:')
    if (!code) return
    try {
      const parsed = JSON.parse(code.trim())
      if (!Array.isArray(parsed)) {
        showToast('유효하지 않은 파티 코드 형식입니다.')
        return
      }

      const newSquads = parsed.map((squadData) => {
        if (!Array.isArray(squadData)) return [null, null, null]
        const mapped = squadData.map((id) => {
          if (!id) return null
          const found = MOCK_CHARACTERS.find(c => c.id === id)
          return found || null
        })
        while (mapped.length < 3) mapped.push(null)
        return mapped.slice(0, 3)
      })

      setSquads(newSquads)
      showToast('파티 구성을 성공적으로 불러왔습니다!')
    } catch (err) {
      showToast('코드 분석에 실패했습니다. 코드를 다시 확인해 주세요.')
    }
  }

  // html2canvas 기반 파티 상태 이미지 저장
  const handleCapture = async () => {
    const container = document.getElementById('squads-container')
    if (!container) {
      showToast('파티 리스트 영역을 찾을 수 없습니다.')
      return
    }
    showToast('파티 캡처 이미지 생성 중...')
    try {
      const canvas = await html2canvas(container, {
        useCORS: true,
        backgroundColor: '#020617', // slate-950
        scale: 2, // 2배 선명도 출력
        logging: false
      })
      const link = document.createElement('a')
      link.download = `wuwa-matrix-squad-${new Date().toISOString().slice(0, 10)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      showToast('파티 배치도가 이미지(PNG)로 저장되었습니다!')
    } catch (err) {
      console.error(err)
      showToast('이미지 변환 중 오류가 발생했습니다.')
    }
  }

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const activeId = active.id as string

    // 1) 도감에서 끌어오는 경우 (도감 카드 드래그)
    if (!activeId.startsWith('squad-char-')) {
      if (!over) return
      const overId = over.id as string
      const char = active.data.current as Character

      // 드래그 대상 카드가 비활성화되어 배치될 수 없는 상태라면 차단
      const assignedSquadIndices = getAssignedSquadIndices(char.id)
      const isRover = ROVER_IDS.includes(char.id)
      const isThisRoverDeployed = assignedSquadIndices.length > 0
      const isAnyOtherRoverDeployed = MOCK_CHARACTERS.some(c => 
        ROVER_IDS.includes(c.id) && 
        c.id !== char.id && 
        getAssignedSquadIndices(c.id).length > 0
      )
      const maxAllowed = getMaxDeployment(char.id)
      const isMaxedOut = isRover 
        ? (isThisRoverDeployed || isAnyOtherRoverDeployed)
        : (assignedSquadIndices.length >= maxAllowed)

      if (isMaxedOut) return

      const match = overId.match(/^party-(\d+)-slot-(\d+)$/)
      if (match) {
        const squadIdx = parseInt(match[1], 10)
        const slotIdx = parseInt(match[2], 10)
        handleSelectCharacter(char, squadIdx, slotIdx)
      }
    } 
    // 2) 이미 스쿼드 슬롯에 들어있는 캐릭터를 드래그하는 경우
    else {
      const match = activeId.match(/^squad-char-(\d+)-(\d+)$/)
      if (!match) return
      const sourceSquadIdx = parseInt(match[1], 10)
      const sourceSlotIdx = parseInt(match[2], 10)

      // 바깥 빈 곳(over 없음) 또는 도감 탭(character-pool-droppable)으로 드롭 ➔ 삭제
      if (!over || over.id === 'character-pool-droppable') {
        handleRemoveCharacter(sourceSquadIdx, sourceSlotIdx)
        showToast('슬롯에서 해제되었습니다.')
        return
      }

      // 다른 스쿼드 슬롯으로 드롭 ➔ 스와프(Swap) 또는 이동
      const overId = over.id as string
      const targetMatch = overId.match(/^party-(\d+)-slot-(\d+)$/)
      if (targetMatch) {
        const targetSquadIdx = parseInt(targetMatch[1], 10)
        const targetSlotIdx = parseInt(targetMatch[2], 10)

        if (sourceSquadIdx === targetSquadIdx && sourceSlotIdx === targetSlotIdx) return

        setSquads((prevSquads) => {
          const nextSquads = prevSquads.map(s => [...s])
          const sourceChar = nextSquads[sourceSquadIdx][sourceSlotIdx]
          const targetChar = nextSquads[targetSquadIdx][targetSlotIdx]

          // 목적지 스쿼드 내 중복 편성 체크
          if (sourceChar) {
            const dupIdx = nextSquads[targetSquadIdx].findIndex(slot => slot && slot.id === sourceChar.id)
            if (dupIdx !== -1 && dupIdx !== targetSlotIdx) {
              nextSquads[targetSquadIdx][dupIdx] = null
            }
          }

          // 출발지 스쿼드 내 중복 편성 체크
          if (targetChar) {
            const dupIdx = nextSquads[sourceSquadIdx].findIndex(slot => slot && slot.id === targetChar.id)
            if (dupIdx !== -1 && dupIdx !== sourceSlotIdx) {
              nextSquads[sourceSquadIdx][dupIdx] = null
            }
          }

          // Swap 실행
          nextSquads[sourceSquadIdx][sourceSlotIdx] = targetChar
          nextSquads[targetSquadIdx][targetSlotIdx] = sourceChar

          return nextSquads
        })
        showToast('파티원 배치가 이동되었습니다.')
      }
    }
  }

  // 특정 공명자가 편성된 모든 스쿼드 인덱스 목록
  const getAssignedSquadIndices = (charId: string): number[] => {
    const indices: number[] = []
    for (let i = 0; i < squads.length; i++) {
      if (squads[i].some(slot => slot && slot.id === charId)) {
        indices.push(i)
      }
    }
    return indices
  }

  const elements = ['All', 'Spectro', 'Aero', 'Electro', 'Fusion', 'Glacio', 'Havoc']

  const filteredCharacters = selectedElement === 'All' 
    ? MOCK_CHARACTERS 
    : MOCK_CHARACTERS.filter(c => c.element === selectedElement)

  const isCharacterMaxedOut = (charId: string): boolean => {
    const assignedSquadIndices = getAssignedSquadIndices(charId)
    const isRover = ROVER_IDS.includes(charId)
    const isThisRoverDeployed = assignedSquadIndices.length > 0
    const isAnyOtherRoverDeployed = MOCK_CHARACTERS.some(c => 
      ROVER_IDS.includes(c.id) && 
      c.id !== charId && 
      getAssignedSquadIndices(c.id).length > 0
    )
    const maxAllowed = getMaxDeployment(charId)
    return isRover 
      ? (isThisRoverDeployed || isAnyOtherRoverDeployed)
      : (assignedSquadIndices.length >= maxAllowed)
  }

  const handleToggleCharacter = (char: Character) => {
    const assigned = getAssignedSquadIndices(char.id)
    if (assigned.length > 0) {
      setSquads((prev) => prev.map(squad => squad.map(slot => slot && slot.id === char.id ? null : slot)))
      showToast(`${char.name} 편성을 해제했습니다.`)
    } else {
      let targetSquadIdx = -1
      let targetSlotIdx = -1
      for (let s = 0; s < squads.length; s++) {
        const emptySlot = squads[s].findIndex(slot => slot === null)
        if (emptySlot !== -1) {
          targetSquadIdx = s
          targetSlotIdx = emptySlot
          break
        }
      }
      if (targetSquadIdx !== -1 && targetSlotIdx !== -1) {
        handleSelectCharacter(char, targetSquadIdx, targetSlotIdx)
      } else {
        handleSelectCharacter(char, 0, 0)
      }
    }
  }

  const handleMoveSquad = (squadIdx: number, direction: 'up' | 'down') => {
    setSquads((prev) => {
      const next = [...prev]
      const targetIdx = direction === 'up' ? squadIdx - 1 : squadIdx + 1
      if (targetIdx < 0 || targetIdx >= next.length) return prev
      
      const temp = next[squadIdx]
      next[squadIdx] = next[targetIdx]
      next[targetIdx] = temp
      return next
    })
    showToast('파티 순서가 변경되었습니다.')
  }

  return {
    squads,
    selectedElement,
    setSelectedElement,
    toast,
    sensors,
    handleAddSquad,
    handleDeleteSquad,
    handleSelectCharacter,
    handleToggleCharacter,
    handleRemoveCharacter,
    handleExport,
    handleImport,
    handleCapture,
    handleDragEnd,
    getAssignedSquadIndices,
    elements,
    filteredCharacters,
    isCharacterMaxedOut,
    getMaxDeployment,
    handleMoveSquad
  }
}
