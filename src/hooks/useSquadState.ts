import { useState, useEffect } from 'react'
import { MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

import type { Character } from '../types'
import { MOCK_CHARACTERS, getMaxDeployment, getAssignedSquadIndices, checkCharacterMaxedOut } from '../utils/character'
import { generateExportText, parseImportText } from '../utils/squadCode'

export function useSquadState() {
  const [squads, setSquads] = useState<(Character | null)[][]>(() => {
    const saved = localStorage.getItem('wuwa-squads')
    if (saved) {
      try {
        const parsedIds = JSON.parse(saved) as (string | null)[][]
        return parsedIds.map(row =>
          row.map(id => {
            if (!id) return null
            return MOCK_CHARACTERS.find(c => c.id === id) || null
          })
        )
      } catch (e) {
        // empty
      }
    }
    return [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]
  })

  // squads 상태가 바뀔 때마다 localStorage에 ID 형태로 영구 보존
  useEffect(() => {
    const ids = squads.map(row => row.map(slot => slot ? slot.id : null))
    localStorage.setItem('wuwa-squads', JSON.stringify(ids))
  }, [squads])
  
  const [selectedElement, setSelectedElement] = useState<string>('All')
  const [toast, setToast] = useState<string | null>(null)
  const [activeSquadIdxForMobile, setActiveSquadIdxForMobile] = useState<number | null>(null)
  const [activeDragChar, setActiveDragChar] = useState<Character | null>(null)

  const [ownedResonatorIds, setOwnedResonatorIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('owned-resonators')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        // empty
      }
    }
    return MOCK_CHARACTERS.map(c => c.id)
  })
  const [showOnlyOwned, setShowOnlyOwned] = useState<boolean>(false)
  const [ownedModalOpen, setOwnedModalOpen] = useState<boolean>(false)

  const [showLeakInfo, setShowLeakInfo] = useState<boolean>(() => {
    const saved = localStorage.getItem('show-leak-info')
    return saved === 'true'
  })

  const handleSetShowLeakInfo = (val: boolean) => {
    setShowLeakInfo(val)
    localStorage.setItem('show-leak-info', String(val))
  }

  // 훅 내부 간소화 헬퍼 정의
  const limitOf = (charId: string) => getMaxDeployment(charId, showLeakInfo)
  const isMaxed = (charId: string) => checkCharacterMaxedOut(charId, squads, showLeakInfo)

  // 제거 확인 모달 상태
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false)
  const [confirmAction, setConfirmAction] = useState<{
    message: string
    subMessage?: string
    confirmText?: string
    onConfirm: () => void
  } | null>(null)

  const requestRemoveConfirm = (
    message: string,
    onConfirm: () => void,
    subMessage?: string,
    confirmText?: string
  ) => {
    setConfirmAction({ message, onConfirm, subMessage, confirmText })
    setConfirmModalOpen(true)
  }

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
    requestRemoveConfirm(
      `정말 ${squadIdx + 1}번 파티를 삭제하시겠습니까?`,
      () => {
        setSquads((prev) => prev.filter((_, idx) => idx !== squadIdx))
        showToast(`${squadIdx + 1}번 파티가 삭제되었습니다.`)
      },
      '해당 파티의 모든 캐릭터 배치 내용이 사라집니다.',
      '삭제하기'
    )
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

      const maxAllowed = limitOf(char.id)

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
    const char = squads[squadIdx]?.[slotIdx]
    if (!char) return

    requestRemoveConfirm(
      `"${char.name}" 공명자를 파티에서 제외하시겠습니까?`,
      () => {
        setSquads((prevSquads) => {
          const newSquads = prevSquads.map(squad => [...squad])
          if (newSquads[squadIdx]) {
            newSquads[squadIdx][slotIdx] = null
          }
          return newSquads
        })
        showToast(`${char.name} 편성을 해제했습니다.`)
      },
      '제외된 캐릭터는 파티 목록에서 즉시 제거됩니다.',
      '제외하기'
    )
  }

  // 파티 데이터 내보내기 (Export) — 하스스톤 스타일 Base64 코드
  const handleExport = () => {
    try {
      const exportText = generateExportText(squads)
      navigator.clipboard.writeText(exportText)
      showToast('편성 코드가 클립보드에 복사되었습니다!')
    } catch (err) {
      showToast('코드 복사에 실패했습니다.')
    }
  }

  // 불러오기 모달 상태
  const [importModalOpen, setImportModalOpen] = useState(false)

  // 파티 데이터 불러오기 (Import) — Base64 코드 디코딩
  const handleImport = (text: string) => {
    if (!text.trim()) {
      setImportModalOpen(false)
      showToast('코드가 비어있습니다.')
      return
    }
    const decoded = parseImportText(text)
    if (!decoded) {
      setImportModalOpen(false)
      showToast('유효하지 않은 편성 코드입니다. 코드를 다시 확인해 주세요.')
      return
    }
    setSquads(decoded)
    setImportModalOpen(false)
    showToast('파티 구성을 성공적으로 불러왔습니다!')
  }

  // html-to-image 기반 파티 상태 이미지 저장
  const handleCapture = async () => {
    const container = document.getElementById('squads-container')
    if (!container) {
      showToast('파티 리스트 영역을 찾을 수 없습니다.')
      return
    }
    showToast('파티 캡처 이미지 생성 중...')
    
    // 1. 실제 화면(UI)의 덜컥거림을 원천 방지하기 위해 컨테이너를 메모리 상에 임시 복제(Clone)
    const clone = container.cloneNode(true) as HTMLElement
    
    // 2. 복제본을 화면에서 완전히 숨겨진 임시 Wrapper에 담아 배치 (absolute 좌표 오프셋 문제를 피함)
    const wrapper = document.createElement('div')
    wrapper.style.position = 'fixed'
    wrapper.style.top = '0'
    wrapper.style.left = '0'
    wrapper.style.width = '0'
    wrapper.style.height = '0'
    wrapper.style.overflow = 'hidden'
    wrapper.style.opacity = '0'
    wrapper.style.pointerEvents = 'none'
    
    clone.style.height = 'auto'
    clone.style.maxHeight = 'none'
    clone.style.overflow = 'visible'
    clone.style.width = container.offsetWidth + 'px' // 원래 요소와 동일한 너비 유지
    
    // 3. 복제본 내에서 제외할 컴포넌트([data-capture-exclude="true"])들을 완전히 물리적으로 삭제
    const excludeElements = clone.querySelectorAll('[data-capture-exclude="true"]')
    excludeElements.forEach((el) => el.remove())

    // 4. 렌더링을 위해 document body에 wrapper와 복제본을 임시 주입
    wrapper.appendChild(clone)
    document.body.appendChild(wrapper)

    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(clone, {
        backgroundColor: '#020617', // slate-950
        pixelRatio: 2,
        cacheBust: true
      })
      const link = document.createElement('a')
      link.download = `wuwa-matrix-squad-${new Date().toISOString().slice(0, 10)}.png`
      link.href = dataUrl
      link.click()
      showToast('파티 배치도가 이미지(PNG)로 저장되었습니다!')
    } catch (err) {
      console.error(err)
      showToast('이미지 변환 중 오류가 발생했습니다.')
    } finally {
      // 5. 사용이 끝난 임시 Wrapper 노드를 깔끔하게 제거(메모리 정리)
      wrapper.remove()
    }
  }

  // 0) 파티 행 드래그 정렬 처리
  const handleSortSquadRows = (activeId: string, overId: string) => {
    const oldIndex = parseInt(activeId.replace('squad-row-', ''), 10)
    const newIndex = parseInt(overId.replace('squad-row-', ''), 10)
    if (oldIndex !== newIndex) {
      setSquads((prev) => arrayMove(prev, oldIndex, newIndex))
      showToast('파티 순서가 변경되었습니다.')
    }
  }

  // 1) 도감에서 끌어오는 경우 (도감 카드 드래그)
  const handleDropFromPool = (char: Character, overId: string) => {
    const isMaxedOut = isMaxed(char.id)

    if (isMaxedOut) return

    const match = overId.match(/^party-(\d+)-slot-(\d+)$/)
    if (match) {
      const squadIdx = parseInt(match[1], 10)
      const slotIdx = parseInt(match[2], 10)
      handleSelectCharacter(char, squadIdx, slotIdx)
    }
  }

  // 2) 이미 스쿼드 슬롯에 들어있는 캐릭터를 드래그하는 경우
  const handleSwapOrMoveSlot = (sourceSquadIdx: number, sourceSlotIdx: number, overId: string) => {
    const targetMatch = overId.match(/^party-(\d+)-slot-(\d+)$/)
    if (!targetMatch) return
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

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeId = active.id as string
    // 도감 카드 드래그 시작 시에만 오버레이 활성화 (squad-row, squad-char 제외)
    if (!activeId.startsWith('squad-row-') && !activeId.startsWith('squad-char-')) {
      setActiveDragChar(active.data.current as Character)
    }
  }

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragChar(null)
    const { active, over } = event
    const activeId = active.id as string

    // 0) 파티 행 드래그 정렬
    if (activeId.startsWith('squad-row-')) {
      if (!over) return
      const overId = over.id as string
      if (!overId.startsWith('squad-row-')) return
      handleSortSquadRows(activeId, overId)
      return
    }

    // 1) 도감에서 끌어오는 경우 (도감 카드 드래그)
    if (!activeId.startsWith('squad-char-')) {
      if (!over) return
      const overId = over.id as string
      const char = active.data.current as Character
      handleDropFromPool(char, overId)
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

      const overId = over.id as string
      handleSwapOrMoveSlot(sourceSquadIdx, sourceSlotIdx, overId)
    }
  }



  const elements = ['All', 'Spectro', 'Aero', 'Electro', 'Fusion', 'Glacio', 'Havoc']

  const sortedCharacters = [...MOCK_CHARACTERS].sort((a, b) => {
    // 유출 토글이 켜져 있으면 3.6 버전 캐릭터는 정식 출시군(최신순)에 포함 (한도 3.65)
    // 유출 토글이 꺼져 있으면 3.55 초과 버전(3.61, 3.62 등)은 미출시군(맨 뒤)에 포함 (한도 3.55)
    const versionLimit = showLeakInfo ? 3.65 : 3.55
    const aIsFutureOrUnknown = a.releaseVersion > versionLimit
    const bIsFutureOrUnknown = b.releaseVersion > versionLimit

    if (aIsFutureOrUnknown && bIsFutureOrUnknown) {
      // 미출시/미래 캐릭터들 사이에서는 버전 오름차순 (예: 3.61 -> 3.62 -> 9.9)
      if (a.releaseVersion !== b.releaseVersion) {
        return a.releaseVersion - b.releaseVersion
      }
      if (a.rarity !== b.rarity) return b.rarity - a.rarity
      return a.enName.localeCompare(b.enName)
    }
    if (aIsFutureOrUnknown) return 1
    if (bIsFutureOrUnknown) return -1

    // 정식 출시 캐릭터들 사이에서는 등급 내림차순 -> 출시 버전 내림차순 -> 이름 알파벳순
    if (a.rarity !== b.rarity) return b.rarity - a.rarity
    if (a.releaseVersion !== b.releaseVersion) return b.releaseVersion - a.releaseVersion
    return a.enName.localeCompare(b.enName)
  })

  const filteredCharacters = sortedCharacters.filter(c => {
    if (selectedElement !== 'All' && c.element !== selectedElement) return false
    if (showOnlyOwned && !ownedResonatorIds.includes(c.id)) return false
    return true
  })

  const handleResetSquads = () => {
    requestRemoveConfirm(
      '모든 파티 편성을 초기화하시겠습니까?',
      () => {
        setSquads([
          [null, null, null],
          [null, null, null],
          [null, null, null]
        ])
        showToast('모든 파티 편성이 초기화되었습니다.')
      },
      '모든 파티 슬롯이 즉시 비워지며 되돌릴 수 없습니다.',
      '초기화하기'
    )
  }

  const handleSaveOwnedResonators = (ids: string[]) => {
    setOwnedResonatorIds(ids)
    localStorage.setItem('owned-resonators', JSON.stringify(ids))
    showToast('보유 공명자 현황이 저장되었습니다.')
  }

  const handleToggleCharacter = (char: Character) => {
    const assigned = getAssignedSquadIndices(char.id, squads)
    const maxAllowed = limitOf(char.id)

    // 만약 배치된 횟수가 최대 허용 개수보다 미만일 경우 ➔ 새로운 슬롯에 추가로 배치함
    if (assigned.length < maxAllowed) {
      let targetSquadIdx = -1
      let targetSlotIdx = -1
      // 첫 번째 파티부터 시작하여 빈 슬롯을 찾아 배치함
      for (let s = 0; s < squads.length; s++) {
        const emptySlot = squads[s].findIndex(slot => slot === null)
        // 2회 배치 캐릭터는 이미 같은 파티에 있는 상태에서는 중복 추가 방지 (한 파티에는 1개만 가능)
        const isAlreadyInThisSquad = squads[s].some(slot => slot && slot.id === char.id)
        if (emptySlot !== -1 && !isAlreadyInThisSquad) {
          targetSquadIdx = s
          targetSlotIdx = emptySlot
          break
        }
      }
      if (targetSquadIdx !== -1 && targetSlotIdx !== -1) {
        handleSelectCharacter(char, targetSquadIdx, targetSlotIdx)
      } else {
        setConfirmAction({
          message: '편성할 빈 슬롯이 없습니다.',
          subMessage: `새로운 파티를 추가하고 [${char.name}] 공명자를 배치하시겠습니까?`,
          confirmText: '파티 추가 및 배치',
          onConfirm: () => {
            setSquads((prev) => [...prev, [char, null, null]])
            showToast(`새 파티가 추가되고 ${char.name}이 배치되었습니다.`)
          }
        })
        setConfirmModalOpen(true)
      }
    } 
    // 이미 최대 배치 허용 개수만큼 가득 차 있는 상태에서 다시 누를 경우 ➔ 토글 오프 (가장 아래 파티에서 제거)
    else {
      const lastAssignedSquadIdx = assigned[assigned.length - 1]
      
      requestRemoveConfirm(
        `"${char.name}" 공명자를 파티에서 제외하시겠습니까?`,
        () => {
          setSquads((prev) => prev.map((squad, sIdx) => {
            if (sIdx === lastAssignedSquadIdx) {
              let removed = false
              return squad.map(slot => {
                if (slot && slot.id === char.id && !removed) {
                  removed = true
                  return null
                }
                return slot
              })
            }
            return squad
          }))
          showToast(`${char.name} 편성을 해제했습니다.`)
        },
        '제외된 캐릭터는 파티 목록에서 즉시 제거됩니다.',
        '제외하기'
      )
    }
  }

  // 파티 행 고유 ID 배열 (SortableContext에 전달)
  const squadIds = squads.map((_, idx) => `squad-row-${idx}`)

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
    handleDragStart,
    handleDragEnd,
    getAssignedSquadIndices: (charId: string) => getAssignedSquadIndices(charId, squads),
    elements,
    filteredCharacters,
    isCharacterMaxedOut: isMaxed,
    getMaxDeployment: limitOf,
    squadIds,
    importModalOpen,
    setImportModalOpen,
    activeSquadIdxForMobile,
    setActiveSquadIdxForMobile,
    ownedResonatorIds,
    showOnlyOwned,
    setShowOnlyOwned,
    ownedModalOpen,
    setOwnedModalOpen,
    handleResetSquads,
    handleSaveOwnedResonators,
    confirmModalOpen,
    setConfirmModalOpen,
    confirmAction,
    activeDragChar,
    showLeakInfo,
    setShowLeakInfo: handleSetShowLeakInfo
  }
}
