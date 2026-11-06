// localStorage 영속화 계층: 버전별 파티 보드, 선택 버전, 레거시(버전 없는) 데이터 이관, 사용자 설정
// 모든 접근은 실패해도(시크릿 모드·저장소 차단) 앱이 동작하도록 try/catch로 감싼다.

import type { SquadRow } from '../types'
import { GAME_VERSIONS, LIVE_VERSION } from '../constants/versions'
import { getCharacterById } from './character'
import { createSquadRowId } from './squadRow'
import { isBoardEmpty } from './versionTransfer'

export const STORAGE_KEYS = {
  /** 버전 → 파티 목록 */
  squadsByVersion: 'wuwa-squads-by-version',
  /** 현재 선택된 보드 버전 */
  selectedVersion: 'selected-version',
  /** 레거시 파티 이관 완료 여부 */
  versionMigrated: 'squads-version-migrated',
  /** 레거시: 버전 구분 이전 통합 포맷 */
  legacySquadsData: 'wuwa-squads-data',
  /** 레거시: 더 이전 포맷 (공명자 ID 2차원 배열) */
  legacySquads: 'wuwa-squads',
  /** 레거시: 더 이전 포맷 (파티별 회로 ID 배열) */
  legacyCircuitBuffs: 'wuwa-squad-circuit-buffs',
  ownedResonators: 'owned-resonators',
  hideMaxedOut: 'hide-maxed-out'
} as const

function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 저장 실패는 무시 (메모리 상태로 계속 동작)
  }
}

function readJson(key: string): unknown {
  const raw = getItem(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** 저장 형식: 공명자는 ID로만 보관 */
interface StoredSquadRow {
  id?: string
  characters?: (string | null)[]
  circuitBuffId?: string | null
}

/**
 * 저장값 → 파티 행. JSON 문법은 맞지만 모양이 다른 값(null 행, 배열이 아닌 characters 등)은
 * 앱이 멈추지 않도록 건너뛰거나 빈 칸으로 보정한다. 공명자는 항상 3칸으로 맞춘다.
 */
function hydrateSquads(rows: unknown[]): SquadRow[] {
  return rows.flatMap((item, i) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const row = item as StoredSquadRow
    const ids: unknown[] = Array.isArray(row.characters) ? row.characters : []
    return [{
      id: typeof row.id === 'string' && row.id ? row.id : createSquadRowId(i),
      characters: [0, 1, 2].map(slot => {
        const id = ids[slot]
        return typeof id === 'string' ? getCharacterById(id) : null
      }),
      circuitBuffId: typeof row.circuitBuffId === 'string' && row.circuitBuffId ? row.circuitBuffId : null
    }]
  })
}

function serializeSquads(rows: SquadRow[]): StoredSquadRow[] {
  return rows.map(s => ({
    id: s.id,
    characters: s.characters.map(c => (c ? c.id : null)),
    circuitBuffId: s.circuitBuffId
  }))
}

// ---------- 버전별 보드 ----------

/** 버전별 파티 목록 로드 (없으면 빈 객체) */
export function loadSquadsByVersion(): Record<string, SquadRow[]> {
  const parsed = readJson(STORAGE_KEYS.squadsByVersion)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
  const result: Record<string, SquadRow[]> = {}
  for (const [version, rows] of Object.entries(parsed)) {
    if (!Array.isArray(rows)) continue
    const hydrated = hydrateSquads(rows)
    if (hydrated.length > 0) result[version] = hydrated
  }
  return result
}

export function saveSquadsByVersion(boards: Record<string, SquadRow[]>): void {
  const data = Object.fromEntries(Object.entries(boards).map(([version, rows]) => [version, serializeSquads(rows)]))
  setItem(STORAGE_KEYS.squadsByVersion, JSON.stringify(data))
}

/** 저장된 선택 버전 (없거나 지원하지 않는 버전이면 라이브 버전) */
export function loadSelectedVersion(): string {
  const saved = getItem(STORAGE_KEYS.selectedVersion)
  return saved && GAME_VERSIONS.includes(saved) ? saved : LIVE_VERSION
}

export function saveSelectedVersion(version: string): void {
  setItem(STORAGE_KEYS.selectedVersion, version)
}

// ---------- 레거시(버전 없는) 데이터 이관 ----------

/** 버전 구분 도입 이전에 저장된 파티 목록 (없으면 null) */
export function loadLegacySquads(): SquadRow[] | null {
  // 1) 통합 포맷
  const data = readJson(STORAGE_KEYS.legacySquadsData)
  if (Array.isArray(data) && data.length > 0) return hydrateSquads(data)

  // 2) 더 이전 포맷 (공명자 / 회로 버프 분리 저장)
  const ids = readJson(STORAGE_KEYS.legacySquads)
  if (!Array.isArray(ids) || ids.length === 0) return null
  const buffsRaw = readJson(STORAGE_KEYS.legacyCircuitBuffs)
  const buffs: (string | null)[] = Array.isArray(buffsRaw) ? buffsRaw : []
  return hydrateSquads(ids.map((row, i) => ({ characters: Array.isArray(row) ? row : [], circuitBuffId: buffs[i] || null })))
}

/** 아직 버전 보드로 이관하지 않은 레거시 파티 (빈 행 제외, 없거나 이관 완료면 null) */
export function loadPendingMigration(): SquadRow[] | null {
  if (getItem(STORAGE_KEYS.versionMigrated) === 'true') return null
  const legacy = loadLegacySquads()
  if (!legacy || isBoardEmpty(legacy)) return null
  return legacy.filter(row => row.characters.some(Boolean) || row.circuitBuffId)
}

export function markVersionMigrated(): void {
  setItem(STORAGE_KEYS.versionMigrated, 'true')
}

// ---------- 사용자 설정 ----------

/** 보유 공명자 ID 목록 (저장값이 없으면 fallback) */
export function loadOwnedResonatorIds(fallback: string[]): string[] {
  const parsed = readJson(STORAGE_KEYS.ownedResonators)
  return Array.isArray(parsed) ? (parsed as string[]) : fallback
}

export function saveOwnedResonatorIds(ids: string[]): void {
  setItem(STORAGE_KEYS.ownedResonators, JSON.stringify(ids))
}

export function loadHideMaxedOut(): boolean {
  return getItem(STORAGE_KEYS.hideMaxedOut) === 'true'
}

export function saveHideMaxedOut(value: boolean): void {
  setItem(STORAGE_KEYS.hideMaxedOut, String(value))
}
