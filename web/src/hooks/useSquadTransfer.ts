import { useState } from 'react'
import type { SquadRow } from '../types'
import { GAME_VERSIONS, LIVE_VERSION } from '../constants/versions'
import { createSquadRowId } from '../utils/squadRow'
import { generateExportText, parseImportText } from '../utils/squadCode'
import { loadPendingMigration, markVersionMigrated } from '../utils/squadStorage'
import { hasAnyMember, inferSetVersion, isBoardEmpty, sanitizeSquadsForVersion } from '../utils/versionTransfer'
import type { ConfirmApi } from './useConfirm'
import type { VersionBoardsApi } from './useVersionBoards'

export interface MigrationAssignment {
  row: SquadRow
  version: string
  /** true: 회로 삭제 / false: 회로 유지 (세트 추천 버전으로 옮길 때만 유지) */
  resetCircuit: boolean
}

/** 현재 보드와 다른 버전의 편성 코드를 붙여넣었을 때 사용자 선택 대기 상태 */
export interface PendingImport {
  codeVersion: string
  rows: SquadRow[]
  /**
   * 코드 버전을 어떻게 정했는지
   * - null: 코드에 버전이 담겨 있음
   * - 'inferred': 버전 없는 이전 코드 → 회로·공명자·출전 횟수로 추정
   * - 'live': 버전 없는 이전 코드 → 추정 불가해 라이브 버전으로 가정
   */
  assumedVersion: 'inferred' | 'live' | null
}

/** " · a · b" 형태 토스트 부가 문구 */
const withNotes = (notes: string[]) => {
  const filtered = notes.filter(Boolean)
  return filtered.length ? ` · ${filtered.join(' · ')}` : ''
}

const countParties = (rows: SquadRow[] | undefined) =>
  (rows ?? []).filter(r => r.characters.some(Boolean) || r.circuitBuffId).length

interface Deps {
  boards: VersionBoardsApi
  showToast: (message: string) => void
  requestConfirm: ConfirmApi['requestConfirm']
  closeImportModal: () => void
}

/** 버전 보드 간 파티 이동: 레거시 이관, 편성 코드 내보내기/불러오기, 다른 버전 보드 불러오기 */
export function useSquadTransfer({ boards, showToast, requestConfirm, closeImportModal }: Deps) {
  const { currentVersion, squadsByVersion, squadsList } = boards

  // ---------- 레거시(버전 없는) 저장 파티 이관 ----------

  const [pendingMigration, setPendingMigration] = useState<SquadRow[] | null>(loadPendingMigration)

  /** 선택한 버전으로 기존 파티 이관 (대상 보드가 비어 있으면 대체, 아니면 뒤에 추가) */
  const confirmMigration = (assignments: MigrationAssignment[]) => {
    const byVersion = new Map<string, SquadRow[]>()
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
    boards.replaceAllBoards(next)

    markVersionMigrated()
    setPendingMigration(null)
    if (assignments.length === 0) {
      showToast('기존 파티를 옮기지 않고 정리했습니다.')
      return
    }
    boards.switchVersion(assignments[0].version)
    const summary = [...byVersion.entries()].map(([v, rows]) => `${v}: ${rows.length}개`).join(', ')
    showToast(
      `기존 파티를 옮겼습니다 (${summary})` +
        withNotes([removed > 0 ? `출전 규칙에 맞지 않는 ${removed}명 제외` : '', dropped > 0 ? `빈 파티 ${dropped}개 정리` : ''])
    )
  }

  /** 이번 방문에서는 이관을 미룸 (다음 방문 시 다시 안내) */
  const dismissMigration = () => setPendingMigration(null)

  // ---------- 편성 코드 내보내기 / 불러오기 ----------

  const exportCurrentBoard = () => {
    try {
      navigator.clipboard.writeText(generateExportText(squadsList, currentVersion))
      showToast(`${currentVersion} 편성 코드가 클립보드에 복사되었습니다!`)
    } catch {
      showToast('코드 복사에 실패했습니다.')
    }
  }

  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)

  /** 편성 코드 파티를 대상 버전 보드에 적용하고 그 보드로 이동 */
  const applyImport = (rows: SquadRow[], targetVersion: string, resetCircuits: boolean) => {
    const result = sanitizeSquadsForVersion(rows, targetVersion, { resetCircuits })
    if (hasAnyMember(rows) && !hasAnyMember(result.rows)) {
      showToast(`${targetVersion}에서 편성 가능한 공명자가 없어 불러오지 않았습니다.`)
      return
    }
    boards.replaceBoard(targetVersion, result.rows)
    boards.switchVersion(targetVersion)
    closeImportModal()
    const removed = result.removedUnavailable + result.removedOverLimit
    showToast(
      `${targetVersion} 보드로 불러왔습니다` +
        withNotes([
          resetCircuits ? '회로 초기화' : '',
          removed > 0 ? `규칙에 맞지 않는 공명자 ${removed}명 제외` : '',
          result.clearedCircuits > 0 ? `${targetVersion}에 없는 회로 ${result.clearedCircuits}개 초기화` : '',
          result.droppedRows > 0 ? `빈 파티 ${result.droppedRows}개 정리` : ''
        ])
    )
  }

  /**
   * 편성 코드 불러오기
   * - 현재 보드와 같은 버전 코드: 현재 보드에 적용 (비어 있지 않으면 덮어쓰기 확인)
   * - 다른 버전 코드: ① 코드 버전 보드에 넣기 ② 현재 보드에 넣기(회로 삭제) 선택 대기
   * - 버전 없는 이전 코드: 세트 단위로 버전 추정, 불가하면 라이브 버전으로 가정(회로 삭제)
   */
  const importCode = (code: string) => {
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

    const rows: SquadRow[] = parsed.squads.map((item, i) => ({
      id: createSquadRowId(i),
      characters: item.characters,
      circuitBuffId: item.circuitBuffId
    }))
    const hasVersion = !!parsed.version && GAME_VERSIONS.includes(parsed.version)
    const inferred = hasVersion ? null : inferSetVersion(rows)
    const codeVersion = hasVersion ? parsed.version! : inferred?.version ?? LIVE_VERSION
    const assumedVersion: PendingImport['assumedVersion'] = hasVersion ? null : inferred ? 'inferred' : 'live'

    if (codeVersion !== currentVersion) {
      closeImportModal()
      setPendingImport({ codeVersion, rows, assumedVersion })
      return
    }

    // 버전을 추정하지 못한 이전 코드의 회로는 아이콘만으로는 효과를 알 수 없어 삭제
    const resetLegacyCircuits = assumedVersion === 'live'
    if (isBoardEmpty(squadsList)) {
      applyImport(rows, currentVersion, resetLegacyCircuits)
      return
    }
    requestConfirm(
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

  /** 다른 버전 코드 선택 처리 */
  const resolveImport = (target: 'code' | 'current') => {
    if (!pendingImport) return
    if (target === 'code') {
      // 추정하지 못하고 라이브 버전으로 가정한 이전 코드는 회로 삭제
      applyImport(pendingImport.rows, pendingImport.codeVersion, pendingImport.assumedVersion === 'live')
    } else {
      applyImport(pendingImport.rows, currentVersion, true)
    }
    setPendingImport(null)
  }

  const cancelPendingImport = () => setPendingImport(null)

  // ---------- 다른 버전 보드에서 불러오기 ----------

  /** 다른 버전 보드를 현재 보드로 불러왔을 때 공명자가 한 명이라도 남는지 */
  const canLoadFromVersion = (sourceVersion: string) =>
    hasAnyMember(sanitizeSquadsForVersion(squadsByVersion[sourceVersion] ?? [], currentVersion, { resetCircuits: true }).rows)

  /** 다른 버전 보드의 파티를 현재 보드로 복사 (회로 초기화, 현재 버전 규칙에 맞지 않는 공명자 제외) */
  const loadFromVersion = (sourceVersion: string) => {
    const sourceRows = squadsByVersion[sourceVersion]
    if (isBoardEmpty(sourceRows)) return
    if (!canLoadFromVersion(sourceVersion)) {
      showToast(`${sourceVersion} 파티에는 ${currentVersion}에서 편성 가능한 공명자가 없어 불러올 수 없습니다.`)
      return
    }

    const apply = () => {
      closeImportModal()
      const copied = sourceRows.map((row, i) => ({ ...row, id: createSquadRowId(i), characters: [...row.characters] }))
      const result = sanitizeSquadsForVersion(copied, currentVersion, { resetCircuits: true })
      boards.updateCurrentBoard(result.rows)
      const removed = result.removedUnavailable + result.removedOverLimit
      showToast(
        `${sourceVersion} 파티를 불러왔습니다 (회로 초기화)` +
          withNotes([
            removed > 0 ? `${currentVersion} 규칙에 맞지 않는 ${removed}명 제외` : '',
            result.droppedRows > 0 ? `빈 파티 ${result.droppedRows}개 정리` : ''
          ])
      )
    }

    if (isBoardEmpty(squadsList)) {
      apply()
      return
    }
    requestConfirm(
      `${sourceVersion} 파티로 현재 ${currentVersion} 파티를 덮어쓰시겠습니까?`,
      apply,
      `현재 ${currentVersion} 보드의 파티는 사라지고, 불러온 파티의 회로는 초기화됩니다.`,
      '불러오기'
    )
  }

  return {
    pendingMigration,
    confirmMigration,
    dismissMigration,
    exportCurrentBoard,
    importCode,
    pendingImport,
    resolveImport,
    cancelPendingImport,
    canLoadFromVersion,
    loadFromVersion,
    isVersionBoardEmpty: (version: string) => isBoardEmpty(squadsByVersion[version]),
    getVersionPartyCount: (version: string) => countParties(squadsByVersion[version])
  }
}
