// 버전 보드 간 파티 이동/복사 유틸
// - 기존(버전 없는) 저장 파티 마이그레이션 시 버전 추천
// - 다른 버전 보드에서 파티 불러오기 시 대상 버전 규칙에 맞게 정리

import type { Character } from '../types'
import { CIRCUIT_BUFFS_BY_VERSION, toCircuitBuffKey } from '../constants/circuitBuffs'
import { GAME_VERSIONS, LEAK_VERSIONS, LIVE_VERSION, versionToNumber } from '../constants/versions'
import { LEAK_CHARACTER_IDS, getMaxDeployment, isAvailableInVersion } from './character'

export interface TransferSquadRow {
  id: string
  characters: (Character | null)[]
  circuitBuffId: string | null
}

const ROVER_IDS = ['rover-spectro', 'rover-havoc', 'rover-aero', 'rover-electro']

/** 파티의 공명자가 모두 출시된 버전 목록 */
export function getAllowedVersions(characters: (Character | null)[]): string[] {
  const chars = characters.filter((c): c is Character => !!c)
  return GAME_VERSIONS.filter(v => chars.every(c => isAvailableInVersion(c, v)))
}

/** 회로 ID(레거시 ID 또는 `${version}:${id}` 키)가 존재하는 버전 목록 */
export function getCircuitVersions(circuitKey: string | null): string[] {
  if (!circuitKey) return []
  const sepIdx = circuitKey.indexOf(':')
  if (sepIdx !== -1) {
    const version = circuitKey.slice(0, sepIdx)
    const buffId = circuitKey.slice(sepIdx + 1)
    return CIRCUIT_BUFFS_BY_VERSION[version]?.some(b => b.id === buffId) ? [version] : []
  }
  return GAME_VERSIONS.filter(v => CIRCUIT_BUFFS_BY_VERSION[v]?.some(b => b.id === circuitKey))
}

/** 대상 버전에 맞는 회로 저장 키로 변환 (대상 버전에 없는 회로면 null = 초기화) */
export function toVersionedCircuitKey(circuitKey: string | null, version: string): string | null {
  if (!circuitKey) return null
  const sepIdx = circuitKey.indexOf(':')
  const buffId = sepIdx !== -1 ? circuitKey.slice(sepIdx + 1) : circuitKey
  if (sepIdx !== -1 && circuitKey.slice(0, sepIdx) !== version) return null
  return CIRCUIT_BUFFS_BY_VERSION[version]?.some(b => b.id === buffId) ? toCircuitBuffKey(version, buffId) : null
}

/** 후보 중 추천 버전: 라이브 버전 → 라이브 이전 최신 버전 → 남은 것 중 최신(유출) 순 */
export function pickPreferred(candidates: string[]): string | null {
  if (candidates.length === 0) return null
  if (candidates.includes(LIVE_VERSION)) return LIVE_VERSION
  const nonLeak = candidates.filter(v => !LEAK_VERSIONS.includes(v))
  if (nonLeak.length > 0) return nonLeak[nonLeak.length - 1]
  return candidates[candidates.length - 1]
}

export interface VersionSuggestion {
  version: string
  reason: string
}

/** 기존 파티를 보낼 버전 추천 (1. 회로가 존재하는 버전 2. 공명자가 모두 출시된 버전 기준) */
export function suggestVersion(row: TransferSquadRow): VersionSuggestion {
  const allowed = getAllowedVersions(row.characters)
  const fallback = allowed.length > 0 ? allowed : [GAME_VERSIONS[GAME_VERSIONS.length - 1]]

  if (!row.circuitBuffId) {
    return { version: pickPreferred(fallback)!, reason: '회로 미선택 → 최신 버전' }
  }

  const circuitVersions = getCircuitVersions(row.circuitBuffId)
  const both = circuitVersions.filter(v => fallback.includes(v))
  if (both.length > 0) {
    const version = pickPreferred(both)!
    return {
      version,
      reason: both.length === 1 ? `회로가 ${version}에만 존재` : `회로 존재 버전: ${both.join(', ')}`
    }
  }
  return { version: pickPreferred(fallback)!, reason: '공명자 출시 버전에 맞는 회로 없음 → 회로 초기화' }
}

/** 파티의 공명자 중 가장 늦게 출시된 버전 (안내 문구용) */
export function getRequiredVersionLabel(characters: (Character | null)[]): string | null {
  const chars = characters.filter((c): c is Character => !!c)
  if (chars.length === 0) return null
  const leakOnly = chars.some(c => LEAK_CHARACTER_IDS.includes(c.id) && versionToNumber(c.releaseVersion) >= 99)
  if (leakOnly) return LEAK_VERSIONS[0] ?? null
  const maxNum = Math.max(...chars.map(c => versionToNumber(c.releaseVersion)))
  return (maxNum / 10).toFixed(1)
}

export interface SanitizeResult {
  rows: TransferSquadRow[]
  removedUnavailable: number
  removedOverLimit: number
  /** 대상 버전에 없는 회로라 초기화된 파티 수 (resetCircuits: false일 때) */
  clearedCircuits: number
}

/**
 * 대상 버전 규칙에 맞게 파티 목록 정리
 * - 대상 버전에 출시되지 않은 공명자 제외
 * - 대상 버전 출전 한도(시즌 버프/순수 힐러) 초과분, 방랑자 중복 제외 (앞쪽 파티 우선)
 * - resetCircuits: true면 회로 초기화, false면 대상 버전에 있는 회로만 유지
 */
export function sanitizeSquadsForVersion(
  rows: TransferSquadRow[],
  version: string,
  { resetCircuits }: { resetCircuits: boolean }
): SanitizeResult {
  const counts = new Map<string, number>()
  let roverUsed: string | null = null
  let removedUnavailable = 0
  let removedOverLimit = 0
  let clearedCircuits = 0

  const sanitized = rows.map(row => {
    const characters = row.characters.map(char => {
      if (!char) return null
      if (!isAvailableInVersion(char, version)) {
        removedUnavailable++
        return null
      }
      if (ROVER_IDS.includes(char.id)) {
        if (roverUsed && roverUsed !== char.id) {
          removedOverLimit++
          return null
        }
        roverUsed = char.id
      }
      const used = counts.get(char.id) ?? 0
      const limit = ROVER_IDS.includes(char.id) ? 1 : getMaxDeployment(char.id, version)
      if (used >= limit) {
        removedOverLimit++
        return null
      }
      counts.set(char.id, used + 1)
      return char
    })
    const circuitBuffId = resetCircuits ? null : toVersionedCircuitKey(row.circuitBuffId, version)
    if (!resetCircuits && row.circuitBuffId && !circuitBuffId) clearedCircuits++
    return { ...row, characters, circuitBuffId }
  })

  return { rows: sanitized, removedUnavailable, removedOverLimit, clearedCircuits }
}

/** 파티 목록이 비어 있는지 (공명자/회로 모두 없음) */
export function isBoardEmpty(rows: TransferSquadRow[] | undefined): boolean {
  return !rows || rows.every(r => r.characters.every(c => !c) && !r.circuitBuffId)
}
