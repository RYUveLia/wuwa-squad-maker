import { useState, useEffect } from 'react'
import { MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

import type { Character } from '../types'
import { MOCK_CHARACTERS, getSortedCharacters, getMaxDeployment, getAssignedSquadIndices, checkCharacterMaxedOut } from '../utils/character'
import { generateExportText, parseImportText } from '../utils/squadCode'

export interface SquadRowData {
  id: string
  characters: (Character | null)[]
  circuitBuffId: string | null
}

export function useSquadState() {
  // 단일 통합 스쿼드 상태 (characters, circuitBuffId, 고유 ID 원자적 관리)
  const [squadsList, setSquadsList] = useState<SquadRowData[]>(() => {
    // 1) 통합 포맷 우선 로드
    const savedData = localStorage.getItem('wuwa-squads-data')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, i) => ({
            id: item.id || `squad-row-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            characters: (item.characters || [null, null, null]).map((id: string | null) =>
              id ? MOCK_CHARACTERS.find(c => c.id === id) || null : null
            ),
            circuitBuffId: item.circuitBuffId || null
          }))
        }
      } catch {
        // empty
      }
    }

    // 2) 이전 버전 데이터 마이그레이션 fallback
    const savedSquads = localStorage.getItem('wuwa-squads')
    const savedCircuitBuffs = localStorage.getItem('wuwa-squad-circuit-buffs')
    let initialSquads: (Character | null)[][] = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ]
    let initialBuffs: (string | null)[] = [null, null, null]

    if (savedSquads) {
      try {
        const parsedIds = JSON.parse(savedSquads) as (string | null)[][]
        if (Array.isArray(parsedIds) && parsedIds.length > 0) {
          initialSquads = parsedIds.map(row =>
            row.map(id => (id ? MOCK_CHARACTERS.find(c => c.id === id) || null : null))
          )
        }
      } catch {
        // empty
      }
    }

    if (savedCircuitBuffs) {
      try {
        const parsedBuffs = JSON.parse(savedCircuitBuffs)
        if (Array.isArray(parsedBuffs)) {
          initialBuffs = parsedBuffs
        }
      } catch {
        // empty
      }
    }

    return initialSquads.map((row, i) => ({
      id: `squad-row-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
      characters: row,
      circuitBuffId: initialBuffs[i] || null
    }))
  })

  // squadsList 상태 변경 시 localStorage 영구 보존
  useEffect(() => {
    const dataToSave = squadsList.map(s => ({
      id: s.id,
      characters: s.characters.map(c => (c ? c.id : null)),
      circuitBuffId: s.circuitBuffId
    }))
    localStorage.setItem('wuwa-squads-data', JSON.stringify(dataToSave))

    // 하위 호환성 유지
    const legacySquads = squadsList.map(s => s.characters.map(c => (c ? c.id : null)))
    localStorage.setItem('wuwa-squads', JSON.stringify(legacySquads))
    const legacyBuffs = squadsList.map(s => s.circuitBuffId)
    localStorage.setItem('wuwa-squad-circuit-buffs', JSON.stringify(legacyBuffs))
  }, [squadsList])

  // 파생 상태 (기존 컴포넌트 인터페이스와 100% 호환)
  const squads = squadsList.map(s => s.characters)
  const circuitBuffs = squadsList.map(s => s.circuitBuffId)
  const squadIds = squadsList.map(s => s.id)

  const [selectedElement, setSelectedElement] = useState<string>('All')
  const [toast, setToast] = useState<string | null>(null)
  const [activeSquadIdxForMobile, setActiveSquadIdxForMobile] = useState<number | null>(null)
  const [activeCircuitModalSquadIdx, setActiveCircuitModalSquadIdx] = useState<number | null>(null)
  const [activeDragChar, setActiveDragChar] = useState<Character | null>(null)

  const [ownedResonatorIds, setOwnedResonatorIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('owned-resonators')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // empty
      }
    }
    return MOCK_CHARACTERS.map(c => c.id)
  })
  const [showOnlyOwned, setShowOnlyOwned] = useState<boolean>(false)
  const [ownedModalOpen, setOwnedModalOpen] = useState<boolean>(false)
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false)
  const [imageExportModalOpen, setImageExportModalOpen] = useState<boolean>(false)

  const [showLeakInfo, setShowLeakInfo] = useState<boolean>(() => {
    const saved = localStorage.getItem('show-leak-info')
    return saved === 'true'
  })

  const handleSetShowLeakInfo = (val: boolean) => {
    setShowLeakInfo(val)
    localStorage.setItem('show-leak-info', String(val))
  }

  const [hideMaxedOut, setHideMaxedOut] = useState<boolean>(() => {
    const saved = localStorage.getItem('hide-maxed-out')
    return saved === 'true'
  })

  const handleSetHideMaxedOut = (val: boolean) => {
    setHideMaxedOut(val)
    localStorage.setItem('hide-maxed-out', String(val))
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
    const newId = `squad-row-${Date.now()}-${squadsList.length}-${Math.random().toString(36).substring(2, 7)}`
    setSquadsList(prev => [...prev, { id: newId, characters: [null, null, null], circuitBuffId: null }])
  }

  // 2) 스쿼드 동적 삭제 (원자적으로 해당 파티 행, 캐릭터, 회로 버프 동시 제거)
  const handleDeleteSquad = (squadIdx: number) => {
    requestRemoveConfirm(
      `정말 ${squadIdx + 1}번 파티를 삭제하시겠습니까?`,
      () => {
        setSquadsList(prev => {
          if (prev.length > 1) {
            return prev.filter((_, idx) => idx !== squadIdx)
          } else {
            return [
              {
                id: `squad-row-${Date.now()}-0-${Math.random().toString(36).substring(2, 7)}`,
                characters: [null, null, null],
                circuitBuffId: null
              }
            ]
          }
        })
        showToast(`${squadIdx + 1}번 파티가 삭제되었습니다.`)
      },
      '해당 파티의 모든 캐릭터 배치 및 회로 버프가 즉시 제거됩니다.',
      '삭제하기'
    )
  }

  // 3) 캐릭터 할당 및 스마트 이동 처리
  const handleSelectCharacter = (char: Character, targetSquadIdx: number, targetSlotIdx: number) => {
    setSquadsList(prevList => {
      const nextList = prevList.map(s => ({
        ...s,
        characters: [...s.characters]
      }))

      // [규칙 1] 동일 스쿼드 내 중복 배치 금지
      if (nextList[targetSquadIdx]) {
        const dupSlotIdx = nextList[targetSquadIdx].characters.findIndex(slot => slot && slot.id === char.id)
        if (dupSlotIdx !== -1 && dupSlotIdx !== targetSlotIdx) {
          nextList[targetSquadIdx].characters[dupSlotIdx] = null
        }
      }

      // [규칙 2] 전체 스쿼드 합산 한도 초과 시 스마트 재배치 (FIFO)
      const currentDeployments: { squadIdx: number; slotIdx: number }[] = []
      nextList.forEach((squad, sIdx) => {
        squad.characters.forEach((slot, slIdx) => {
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
          if (nextList[deploy.squadIdx]) {
            nextList[deploy.squadIdx].characters[deploy.slotIdx] = null
          }
        }
      }

      if (nextList[targetSquadIdx]) {
        nextList[targetSquadIdx].characters[targetSlotIdx] = char
      }
      return nextList
    })
  }

  // 4) 슬롯에서 캐릭터 제거
  const handleRemoveCharacter = (squadIdx: number, slotIdx: number) => {
    const char = squadsList[squadIdx]?.characters[slotIdx]
    if (!char) return

    requestRemoveConfirm(
      `"${char.name}" 공명자를 파티에서 제외하시겠습니까?`,
      () => {
        setSquadsList(prevList => {
          return prevList.map((squad, sIdx) => {
            if (sIdx === squadIdx) {
              const newChars = [...squad.characters]
              newChars[slotIdx] = null
              return { ...squad, characters: newChars }
            }
            return squad
          })
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
      const code = generateExportText(squadsList)
      navigator.clipboard.writeText(code)
      showToast('편성 코드가 클립보드에 복사되었습니다!')
    } catch {
      showToast('코드 복사에 실패했습니다.')
    }
  }

  // 파티 데이터 불러오기 (Import)
  const handleImport = (code: string) => {
    try {
      const parsedSquads = parseImportText(code)
      if (!parsedSquads || parsedSquads.length === 0) {
        showToast('올바르지 않은 코드 형식입니다.')
        return
      }

      const importedSquadsList: SquadRowData[] = parsedSquads.map((item, i) => ({
        id: `squad-row-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        characters: item.characters,
        circuitBuffId: item.circuitBuffId
      }))

      setSquadsList(importedSquadsList)
      setImportModalOpen(false)
      showToast('파티 편성을 성공적으로 불러왔습니다!')
    } catch {
      showToast('파티 코드를 파싱하는 도중 오류가 발생했습니다.')
    }
  }

  // 파티 배치도 이미지 캡처 모달 열기
  const handleCapture = () => {
    const hasAnyChar = squads.some(row => row.some(slot => slot !== null))
    if (!hasAnyChar) {
      showToast('배치된 캐릭터가 없습니다.')
      return
    }
    setImageExportModalOpen(true)
  }

  // 0) 파티 행 드래그 정렬 처리
  const handleSortSquadRows = (activeId: string, overId: string) => {
    const oldIndex = squadIds.indexOf(activeId)
    const newIndex = squadIds.indexOf(overId)
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      setSquadsList(prev => arrayMove(prev, oldIndex, newIndex))
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

    setSquadsList(prevList => {
      const nextList = prevList.map(s => ({
        ...s,
        characters: [...s.characters]
      }))
      const sourceChar = nextList[sourceSquadIdx]?.characters[sourceSlotIdx]
      const targetChar = nextList[targetSquadIdx]?.characters[targetSlotIdx]

      if (!sourceChar) return prevList

      // Case 1: 빈 슬롯으로의 단순 이동
      if (!targetChar) {
        if (sourceSquadIdx !== targetSquadIdx) {
          const isAlreadyInTarget = nextList[targetSquadIdx].characters.some(
            (c, idx) => idx !== targetSlotIdx && c && c.id === sourceChar.id
          )
          if (isAlreadyInTarget) return prevList
        }
        nextList[targetSquadIdx].characters[targetSlotIdx] = sourceChar
        nextList[sourceSquadIdx].characters[sourceSlotIdx] = null
        return nextList
      }

      // Case 2: 다른 캐릭터와의 맞교환 (Swap)
      if (sourceSquadIdx === targetSquadIdx) {
        nextList[sourceSquadIdx].characters[sourceSlotIdx] = targetChar
        nextList[targetSquadIdx].characters[targetSlotIdx] = sourceChar
        return nextList
      }

      const isSourceDup = nextList[targetSquadIdx].characters.some(
        (c, idx) => idx !== targetSlotIdx && c && c.id === sourceChar.id
      )
      const isTargetDup = nextList[sourceSquadIdx].characters.some(
        (c, idx) => idx !== sourceSlotIdx && c && c.id === targetChar.id
      )

      if (isSourceDup || isTargetDup) return prevList

      nextList[sourceSquadIdx].characters[sourceSlotIdx] = targetChar
      nextList[targetSquadIdx].characters[targetSlotIdx] = sourceChar
      return nextList
    })
  }

  // dnd-kit DragStart 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const activeData = event.active.data.current
    const char = activeData?.char || (activeData?.element ? (activeData as Character) : null)
    if (char) {
      setActiveDragChar(char)
    }
  }

  // dnd-kit 통합 DragEnd 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragChar(null)
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId === overId) return

    // 0) 파티 행 자체의 드래그 정렬
    if (activeId.startsWith('squad-row-') && overId.startsWith('squad-row-')) {
      handleSortSquadRows(activeId, overId)
      return
    }

    const activeData = active.data.current

    // 1) 도감에서 캐릭터를 끌어다 놓는 경우
    const poolChar = (activeData?.isPool && activeData?.char)
      ? activeData.char
      : (activeData?.char && activeData?.squadIdx === undefined ? activeData.char : (!activeData?.squadIdx && activeData?.element ? activeData as Character : null))

    if (poolChar) {
      handleDropFromPool(poolChar, overId)
      return
    }

    // 2) 스쿼드 슬롯 안의 캐릭터를 다른 슬롯으로 옮기거나 스왑하는 경우
    if (activeData?.squadIdx !== undefined && activeData?.slotIdx !== undefined) {
      if (overId === 'character-pool-droppable') {
        handleRemoveCharacter(activeData.squadIdx, activeData.slotIdx)
        return
      }
      handleSwapOrMoveSlot(activeData.squadIdx, activeData.slotIdx, overId)
      return
    }
  }

  // 필터링 및 도감 관련 헬퍼 계산
  const elements = ['All', 'Spectro', 'Aero', 'Electro', 'Fusion', 'Glacio', 'Havoc']
  const filteredCharacters = getSortedCharacters(showLeakInfo).filter(c => {
    if (selectedElement !== 'All' && c.element !== selectedElement) return false
    if (showOnlyOwned && !ownedResonatorIds.includes(c.id)) return false
    if (hideMaxedOut && isMaxed(c.id)) return false
    return true
  })

  const handleResetSquads = () => {
    requestRemoveConfirm(
      '모든 파티 편성을 초기화하시겠습니까?',
      () => {
        setSquadsList([
          {
            id: `squad-row-${Date.now()}-0-${Math.random().toString(36).substring(2, 7)}`,
            characters: [null, null, null],
            circuitBuffId: null
          },
          {
            id: `squad-row-${Date.now()}-1-${Math.random().toString(36).substring(2, 7)}`,
            characters: [null, null, null],
            circuitBuffId: null
          },
          {
            id: `squad-row-${Date.now()}-2-${Math.random().toString(36).substring(2, 7)}`,
            characters: [null, null, null],
            circuitBuffId: null
          }
        ])
        showToast('모든 파티 편성이 초기화되었습니다.')
      },
      '모든 파티 슬롯이 즉시 비워지며 되돌릴 수 없습니다.',
      '초기화하기'
    )
  }

  const handleSelectCircuitBuff = (squadIdx: number, buffId: string | null) => {
    setSquadsList(prev =>
      prev.map((s, idx) => (idx === squadIdx ? { ...s, circuitBuffId: buffId } : s))
    )
    showToast(buffId ? '회로 버프가 적용되었습니다.' : '회로 버프 선택이 해제되었습니다.')
  }

  const handleSaveOwnedResonators = (ids: string[]) => {
    setOwnedResonatorIds(ids)
    localStorage.setItem('owned-resonators', JSON.stringify(ids))
    showToast('보유 공명자 현황이 저장되었습니다.')
  }

  const handleToggleCharacter = (char: Character) => {
    const assigned = getAssignedSquadIndices(char.id, squads)
    const maxAllowed = limitOf(char.id)

    if (assigned.length < maxAllowed) {
      let targetSquadIdx = -1
      let targetSlotIdx = -1
      for (let s = 0; s < squads.length; s++) {
        const emptySlot = squads[s].findIndex(slot => slot === null)
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
            const newId = `squad-row-${Date.now()}-${squadsList.length}-${Math.random().toString(36).substring(2, 7)}`
            setSquadsList(prev => [
              ...prev,
              { id: newId, characters: [char, null, null], circuitBuffId: null }
            ])
            showToast(`새 파티가 추가되고 ${char.name}이 배치되었습니다.`)
          }
        })
        setConfirmModalOpen(true)
      }
    } else {
      const lastAssignedSquadIdx = assigned[assigned.length - 1]

      requestRemoveConfirm(
        `"${char.name}" 공명자를 파티에서 제외하시겠습니까?`,
        () => {
          setSquadsList(prev =>
            prev.map((squad, sIdx) => {
              if (sIdx === lastAssignedSquadIdx) {
                let removed = false
                const newChars = squad.characters.map(slot => {
                  if (slot && slot.id === char.id && !removed) {
                    removed = true
                    return null
                  }
                  return slot
                })
                return { ...squad, characters: newChars }
              }
              return squad
            })
          )
          showToast(`${char.name} 편성을 해제했습니다.`)
        },
        '제외된 캐릭터는 파티 목록에서 즉시 제거됩니다.',
        '제외하기'
      )
    }
  }

  return {
    squads,
    circuitBuffs,
    activeCircuitModalSquadIdx,
    setActiveCircuitModalSquadIdx,
    handleSelectCircuitBuff,
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
    isCharacterMaxedOut: (charId: string) => isMaxed(charId),
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
    imageExportModalOpen,
    setImageExportModalOpen,
    showToast,
    handleResetSquads,
    handleSaveOwnedResonators,
    confirmModalOpen,
    setConfirmModalOpen,
    confirmAction,
    activeDragChar,
    showLeakInfo,
    setShowLeakInfo: handleSetShowLeakInfo,
    hideMaxedOut,
    setHideMaxedOut: handleSetHideMaxedOut
  }
}
