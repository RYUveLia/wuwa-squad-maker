import { useState, useEffect, useRef } from 'react'
import { MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

import type { Character } from '../types'
import { MOCK_CHARACTERS, getSortedCharacters, getMaxDeployment, getAssignedSquadIndices, checkCharacterMaxedOut } from '../utils/character'
import { generateExportText, parseImportText } from '../utils/squadCode'
import { GAME_VERSIONS, LIVE_VERSION } from '../constants/versions'
import { hasAnyMember, inferSetVersion, isBoardEmpty, sanitizeSquadsForVersion } from '../utils/versionTransfer'

export interface SquadRowData {
  id: string
  characters: (Character | null)[]
  circuitBuffId: string | null
}

const SQUADS_BY_VERSION_KEY = 'wuwa-squads-by-version'
const SELECTED_VERSION_KEY = 'selected-version'
const VERSION_MIGRATED_KEY = 'squads-version-migrated'

const createSquadRowId = (i: number) => `squad-row-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`

const createEmptySquads = (count: number = 3): SquadRowData[] =>
  Array.from({ length: count }, (_, i) => ({ id: createSquadRowId(i), characters: [null, null, null], circuitBuffId: null }))

type StoredSquadRow = { id?: string; characters?: (string | null)[]; circuitBuffId?: string | null }

const hydrateSquads = (rows: StoredSquadRow[]): SquadRowData[] =>
  rows.map((item, i) => ({
    id: item.id || createSquadRowId(i),
    characters: (item.characters || [null, null, null]).map((id: string | null) =>
      id ? MOCK_CHARACTERS.find(c => c.id === id) || null : null
    ),
    circuitBuffId: item.circuitBuffId || null
  }))

/** 버전 구분 도입 이전에 저장된 파티 목록 로드 (없으면 null) */
const loadLegacySquads = (): SquadRowData[] | null => {
  // 1) 통합 포맷
  const savedData = localStorage.getItem('wuwa-squads-data')
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      if (Array.isArray(parsed) && parsed.length > 0) return hydrateSquads(parsed)
    } catch {
      // empty
    }
  }

  // 2) 더 이전 포맷 (공명자 / 회로 버프 분리 저장)
  const savedSquads = localStorage.getItem('wuwa-squads')
  if (!savedSquads) return null
  try {
    const parsedIds = JSON.parse(savedSquads) as (string | null)[][]
    if (!Array.isArray(parsedIds) || parsedIds.length === 0) return null
    let buffs: (string | null)[] = []
    try {
      const parsedBuffs = JSON.parse(localStorage.getItem('wuwa-squad-circuit-buffs') || '[]')
      if (Array.isArray(parsedBuffs)) buffs = parsedBuffs
    } catch {
      // empty
    }
    return hydrateSquads(parsedIds.map((row, i) => ({ characters: row, circuitBuffId: buffs[i] || null })))
  } catch {
    return null
  }
}

/** 버전별 파티 목록 로드 (기존 버전 없는 저장 파티는 마이그레이션 모달에서 사용자가 버전을 골라 이관) */
const loadSquadsByVersion = (): Record<string, SquadRowData[]> => {
  const saved = localStorage.getItem(SQUADS_BY_VERSION_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const result: Record<string, SquadRowData[]> = {}
        for (const [version, rows] of Object.entries(parsed)) {
          if (Array.isArray(rows) && rows.length > 0) result[version] = hydrateSquads(rows as StoredSquadRow[])
        }
        return result
      }
    } catch {
      // empty
    }
  }
  return {}
}

/** 아직 버전으로 이관하지 않은 기존 저장 파티 (없거나 이미 이관했으면 null) */
const loadPendingMigration = (): SquadRowData[] | null => {
  if (localStorage.getItem(VERSION_MIGRATED_KEY) === 'true') return null
  const legacy = loadLegacySquads()
  if (!legacy || isBoardEmpty(legacy)) return null
  // 빈 파티 행은 이관 대상에서 제외
  return legacy.filter(row => row.characters.some(Boolean) || row.circuitBuffId)
}

export interface MigrationAssignment {
  row: SquadRowData
  version: string
  /** true: 회로 삭제 / false: 회로 유지 (세트 추천 버전으로 옮길 때만 유지) */
  resetCircuit: boolean
}

/** 현재 보드와 다른 버전의 편성 코드를 붙여넣었을 때 사용자 선택 대기 상태 */
export interface PendingImport {
  codeVersion: string
  rows: SquadRowData[]
  /**
   * 코드 버전을 어떻게 정했는지
   * - null: 코드에 버전이 담겨 있음
   * - 'inferred': 버전 없는 이전 코드 → 회로·공명자·출전 횟수로 추정
   * - 'live': 버전 없는 이전 코드 → 추정 불가해 라이브 버전으로 가정
   */
  assumedVersion: 'inferred' | 'live' | null
}

/** 저장된 선택 버전 (없거나 지원하지 않는 버전이면 라이브 버전) */
const getInitialVersion = (): string => {
  const saved = localStorage.getItem(SELECTED_VERSION_KEY)
  return saved && GAME_VERSIONS.includes(saved) ? saved : LIVE_VERSION
}

export function useSquadState() {
  const selectableVersions = GAME_VERSIONS

  // 현재 선택된 게임 버전 (파티 목록 · 도감 · 시즌 버프 · 회로 버프 기준)
  const [currentVersion, setCurrentVersion] = useState<string>(getInitialVersion)

  // 버전별 파티 목록 (characters, circuitBuffId, 고유 ID 원자적 관리)
  const [squadsByVersion, setSquadsByVersion] = useState<Record<string, SquadRowData[]>>(() => {
    const loaded = loadSquadsByVersion()
    const initialVersion = getInitialVersion()
    return loaded[initialVersion] ? loaded : { ...loaded, [initialVersion]: createEmptySquads() }
  })

  const squadsList: SquadRowData[] = squadsByVersion[currentVersion] ?? []

  // 현재 버전의 파티 목록만 갱신하는 setter (기존 setSquadsList 호출부와 동일한 인터페이스)
  const setSquadsList = (updater: SquadRowData[] | ((prev: SquadRowData[]) => SquadRowData[])) => {
    setSquadsByVersion(prev => {
      const current = prev[currentVersion] ?? createEmptySquads()
      const next = typeof updater === 'function' ? updater(current) : updater
      return { ...prev, [currentVersion]: next }
    })
  }

  // 버전별 파티 목록 영구 보존
  useEffect(() => {
    const dataToSave = Object.fromEntries(
      Object.entries(squadsByVersion).map(([version, rows]) => [
        version,
        rows.map(s => ({
          id: s.id,
          characters: s.characters.map(c => (c ? c.id : null)),
          circuitBuffId: s.circuitBuffId
        }))
      ])
    )
    localStorage.setItem(SQUADS_BY_VERSION_KEY, JSON.stringify(dataToSave))
  }, [squadsByVersion])

  const handleSetVersion = (version: string) => {
    setSquadsByVersion(prev => (prev[version] ? prev : { ...prev, [version]: createEmptySquads() }))
    setCurrentVersion(version)
    localStorage.setItem(SELECTED_VERSION_KEY, version)
  }

  // 기존(버전 없는) 저장 파티 이관 대기 목록
  const [pendingMigration, setPendingMigration] = useState<SquadRowData[] | null>(loadPendingMigration)

  /** 선택한 버전으로 기존 파티 이관 (대상 보드가 비어 있으면 대체, 아니면 뒤에 추가) */
  const handleConfirmMigration = (assignments: MigrationAssignment[]) => {
    const byVersion = new Map<string, SquadRowData[]>()
    assignments.forEach(({ row, version, resetCircuit }) => {
      const moved = resetCircuit ? { ...row, circuitBuffId: null } : row
      byVersion.set(version, [...(byVersion.get(version) ?? []), moved])
    })

    let removed = 0
    let dropped = 0
    const next = { ...squadsByVersion }
    byVersion.forEach((rows, version) => {
      const base = isBoardEmpty(squadsByVersion[version]) ? [] : squadsByVersion[version]
      const result = sanitizeSquadsForVersion([...base, ...rows], version, { resetCircuits: false })
      removed += result.removedUnavailable + result.removedOverLimit
      dropped += result.droppedRows
      next[version] = result.rows
    })
    setSquadsByVersion(next)

    localStorage.setItem(VERSION_MIGRATED_KEY, 'true')
    setPendingMigration(null)
    const summary = [...byVersion.entries()].map(([v, rows]) => `${v}: ${rows.length}개`).join(', ')
    if (assignments.length > 0) {
      const firstVersion = assignments[0].version
      handleSetVersion(firstVersion)
      const notes = [
        removed > 0 ? `출전 규칙에 맞지 않는 ${removed}명 제외` : '',
        dropped > 0 ? `빈 파티 ${dropped}개 정리` : ''
      ].filter(Boolean)
      showToast(`기존 파티를 옮겼습니다 (${summary})${notes.length ? ` · ${notes.join(' · ')}` : ''}`)
    } else {
      showToast('기존 파티를 옮기지 않고 정리했습니다.')
    }
  }

  /** 이번 방문에서는 이관을 미룸 (다음 방문 시 다시 안내) */
  const handleDismissMigration = () => setPendingMigration(null)

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

  const [hideMaxedOut, setHideMaxedOut] = useState<boolean>(() => {
    const saved = localStorage.getItem('hide-maxed-out')
    return saved === 'true'
  })

  const handleSetHideMaxedOut = (val: boolean) => {
    setHideMaxedOut(val)
    localStorage.setItem('hide-maxed-out', String(val))
  }

  // 훅 내부 간소화 헬퍼 정의
  const limitOf = (charId: string) => getMaxDeployment(charId, currentVersion)
  const isMaxed = (charId: string) => checkCharacterMaxedOut(charId, squads, currentVersion)

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

  // 토스트 메시지 출력 유틸 (연속 호출 시 이전 타이머가 새 토스트를 일찍 지우지 않도록 재설정)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => {
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
      const code = generateExportText(squadsList, currentVersion)
      navigator.clipboard.writeText(code)
      showToast(`${currentVersion} 편성 코드가 클립보드에 복사되었습니다!`)
    } catch {
      showToast('코드 복사에 실패했습니다.')
    }
  }

  // 다른 버전 코드 붙여넣기 시 선택 대기
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)

  /** 편성 코드 파티를 대상 버전 보드에 적용하고 그 보드로 이동 */
  const applyImport = (rows: SquadRowData[], targetVersion: string, resetCircuits: boolean) => {
    const result = sanitizeSquadsForVersion(rows, targetVersion, { resetCircuits })
    if (hasAnyMember(rows) && !hasAnyMember(result.rows)) {
      showToast(`${targetVersion}에서 편성 가능한 공명자가 없어 불러오지 않았습니다.`)
      return
    }
    setSquadsByVersion(prev => ({ ...prev, [targetVersion]: result.rows }))
    setCurrentVersion(targetVersion)
    localStorage.setItem(SELECTED_VERSION_KEY, targetVersion)
    setImportModalOpen(false)
    const removed = result.removedUnavailable + result.removedOverLimit
    const notes = [
      resetCircuits ? '회로 초기화' : '',
      removed > 0 ? `규칙에 맞지 않는 공명자 ${removed}명 제외` : '',
      result.clearedCircuits > 0 ? `${targetVersion}에 없는 회로 ${result.clearedCircuits}개 초기화` : '',
      result.droppedRows > 0 ? `빈 파티 ${result.droppedRows}개 정리` : ''
    ].filter(Boolean)
    showToast(`${targetVersion} 보드로 불러왔습니다${notes.length ? ` · ${notes.join(' · ')}` : ''}`)
  }

  // 파티 데이터 불러오기 (Import)
  // - 현재 보드와 같은 버전 코드: 현재 보드에 적용 (비어 있지 않으면 덮어쓰기 확인)
  // - 다른 버전 코드(v3): ① 코드 버전 보드에 넣기(회로 유지) ② 현재 보드에 넣기(회로 삭제) 중 선택
  // - 버전 정보가 없는 이전 코드: 현재 보드에 적용 (현재 버전에 없는 회로는 초기화)
  const handleImport = (code: string) => {
    let parsed
    try {
      parsed = parseImportText(code)
    } catch {
      parsed = null
    }
    if (!parsed || parsed.squads.length === 0) {
      showToast('올바르지 않은 코드 형식입니다.')
      return
    }

    const rows: SquadRowData[] = parsed.squads.map((item, i) => ({
      id: createSquadRowId(i),
      characters: item.characters,
      circuitBuffId: item.circuitBuffId
    }))
    // 버전 정보가 없는 이전 코드는 세트 전체가 그대로 맞는 버전으로 추정, 추정 불가면 라이브 버전으로 가정
    const hasVersion = !!parsed.version && GAME_VERSIONS.includes(parsed.version)
    const inferred = hasVersion ? null : inferSetVersion(rows)
    const codeVersion = hasVersion ? parsed.version! : inferred?.version ?? LIVE_VERSION
    const assumedVersion: PendingImport['assumedVersion'] = hasVersion ? null : inferred ? 'inferred' : 'live'

    if (codeVersion !== currentVersion) {
      setImportModalOpen(false)
      setPendingImport({ codeVersion, rows, assumedVersion })
      return
    }

    // 버전을 추정하지 못한 이전 코드의 회로는 아이콘만으로는 효과를 알 수 없어 삭제
    const resetLegacyCircuits = assumedVersion === 'live'
    if (isBoardEmpty(squadsList)) {
      applyImport(rows, currentVersion, resetLegacyCircuits)
      return
    }
    requestRemoveConfirm(
      `편성 코드로 현재 ${currentVersion} 파티를 덮어쓰시겠습니까?`,
      () => applyImport(rows, currentVersion, resetLegacyCircuits),
      hasVersion
        ? `현재 ${currentVersion} 보드의 기존 파티가 대체됩니다.`
        : assumedVersion === 'inferred'
          ? `버전 정보가 없는 이전 코드지만 ${currentVersion} 코드로 추정되어 현재 보드에 적용합니다.`
          : `버전 정보가 없고 버전을 추정할 수 없는 이전 코드라 회로를 삭제하고 현재 보드에 적용합니다.`,
      '불러오기'
    )
  }

  /** 다른 버전 코드 붙여넣기 선택 처리 */
  const handleResolveImport = (target: 'code' | 'current') => {
    if (!pendingImport) return
    if (target === 'code') {
      // 추정하지 못하고 라이브 버전으로 가정한 이전 코드는 회로 삭제
      applyImport(pendingImport.rows, pendingImport.codeVersion, pendingImport.assumedVersion === 'live')
    }
    else applyImport(pendingImport.rows, currentVersion, true)
    setPendingImport(null)
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
  const filteredCharacters = getSortedCharacters(currentVersion).filter(c => {
    if (selectedElement !== 'All' && c.element !== selectedElement) return false
    if (showOnlyOwned && !ownedResonatorIds.includes(c.id)) return false
    if (hideMaxedOut && isMaxed(c.id)) return false
    return true
  })

  const handleResetSquads = () => {
    requestRemoveConfirm(
      `${currentVersion} 버전의 모든 파티 편성을 초기화하시겠습니까?`,
      () => {
        setSquadsList(createEmptySquads())
        showToast('모든 파티 편성이 초기화되었습니다.')
      },
      '이 버전의 모든 파티 슬롯이 즉시 비워지며 되돌릴 수 없습니다. (다른 버전 파티는 유지)',
      '초기화하기'
    )
  }

  /** 다른 버전 보드의 파티를 현재 보드로 불러오기 (회로는 초기화, 현재 버전 규칙에 맞지 않는 공명자 제외) */
  /** 다른 버전 보드를 현재 보드로 불러왔을 때 공명자가 한 명이라도 남는지 */
  const canLoadFromVersion = (sourceVersion: string) => {
    const sourceRows = squadsByVersion[sourceVersion] ?? []
    return hasAnyMember(sanitizeSquadsForVersion(sourceRows, currentVersion, { resetCircuits: true }).rows)
  }

  const handleLoadFromVersion = (sourceVersion: string) => {
    const sourceRows = squadsByVersion[sourceVersion]
    if (isBoardEmpty(sourceRows)) return
    if (!canLoadFromVersion(sourceVersion)) {
      showToast(`${sourceVersion} 파티에는 ${currentVersion}에서 편성 가능한 공명자가 없어 불러올 수 없습니다.`)
      return
    }

    const apply = () => {
      setImportModalOpen(false)
      const copied = sourceRows.map((row, i) => ({ ...row, id: createSquadRowId(i), characters: [...row.characters] }))
      const result = sanitizeSquadsForVersion(copied, currentVersion, { resetCircuits: true })
      setSquadsList(result.rows)
      const removed = result.removedUnavailable + result.removedOverLimit
      const notes = [
        removed > 0 ? `${currentVersion} 규칙에 맞지 않는 ${removed}명 제외` : '',
        result.droppedRows > 0 ? `빈 파티 ${result.droppedRows}개 정리` : ''
      ].filter(Boolean)
      showToast(`${sourceVersion} 파티를 불러왔습니다 (회로 초기화)${notes.length ? ` · ${notes.join(' · ')}` : ''}`)
    }

    if (isBoardEmpty(squadsList)) {
      apply()
      return
    }
    requestRemoveConfirm(
      `${sourceVersion} 파티로 현재 ${currentVersion} 파티를 덮어쓰시겠습니까?`,
      apply,
      `현재 ${currentVersion} 보드의 파티는 사라지고, 불러온 파티의 회로는 초기화됩니다.`,
      '불러오기'
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
    currentVersion,
    setCurrentVersion: handleSetVersion,
    selectableVersions,
    pendingMigration,
    handleConfirmMigration,
    pendingImport,
    handleResolveImport,
    cancelPendingImport: () => setPendingImport(null),
    isVersionBoardEmpty: (version: string) => isBoardEmpty(squadsByVersion[version]),
    canLoadFromVersion,
    getVersionPartyCount: (version: string) =>
      (squadsByVersion[version] ?? []).filter(r => r.characters.some(Boolean) || r.circuitBuffId).length,
    handleDismissMigration,
    handleLoadFromVersion,
    hideMaxedOut,
    setHideMaxedOut: handleSetHideMaxedOut
  }
}
