import { describe, expect, it } from 'vitest'
import {
  GAME_VERSIONS,
  LEAK_VERSIONS,
  LIVE_VERSION,
  SEASON_BUFF_CHARACTER_BY_VERSION,
  getLeakVersions,
  getLegacySearchOrder,
  isReleaseUndecided,
  versionToNumber
} from './versions'
import { CIRCUIT_BUFFS_BY_VERSION } from './circuitBuffs'
import { ALL_CHARACTERS, getCharacterById, isAvailableInVersion } from '../utils/character'

describe('유출 버전 계산 (라이브 버전 기준)', () => {
  const versions = ['3.5', '3.6', '3.7', '3.8', '4.0']

  it('라이브 버전보다 뒤의 버전이 유출 버전', () => {
    expect(getLeakVersions(versions, '3.7')).toEqual(['3.8', '4.0'])
    expect(getLeakVersions(versions, '3.8')).toEqual(['4.0'])
  })

  it('라이브가 마지막 버전이면 유출 버전 없음', () => {
    expect(getLeakVersions(versions, '4.0')).toEqual([])
  })

  it('레거시 해석 순서: 라이브 → 이전 버전(최신순) → 이후(유출) 버전', () => {
    expect(getLegacySearchOrder(versions, '3.7')).toEqual(['3.7', '3.6', '3.5', '3.8', '4.0'])
    expect(getLegacySearchOrder(versions, '4.0')).toEqual(['4.0', '3.8', '3.7', '3.6', '3.5'])
  })
})

// 새 버전 추가·라이브 전환 때 빠뜨린 것을 잡아내는 데이터 점검
describe('버전 데이터 점검', () => {
  it('라이브 버전은 지원 버전 목록에 있다', () => {
    expect(GAME_VERSIONS).toContain(LIVE_VERSION)
  })

  it('지원 버전은 오래된 순으로 정렬되어 있다', () => {
    const nums = GAME_VERSIONS.map(versionToNumber)
    expect(nums).toEqual([...nums].sort((a, b) => a - b))
  })

  it('모든 지원 버전에 시즌 버프 항목과 회로 4개가 등록되어 있다', () => {
    for (const v of GAME_VERSIONS) {
      expect(SEASON_BUFF_CHARACTER_BY_VERSION, `시즌 버프 누락: ${v}`).toHaveProperty([v])
      expect(CIRCUIT_BUFFS_BY_VERSION[v], `회로 누락: ${v}`).toHaveLength(4)
    }
  })

  it('시즌 버프 대상은 실제 공명자이고 그 버전 보드에 노출된다', () => {
    for (const [v, id] of Object.entries(SEASON_BUFF_CHARACTER_BY_VERSION)) {
      if (!id) continue
      const c = getCharacterById(id)
      expect(c, `${v} 시즌 버프 대상 '${id}'가 characters.json에 없음`).toBeTruthy()
      expect(isAvailableInVersion(c!, v), `${v} 보드에 '${id}'가 노출되지 않음`).toBe(true)
    }
  })

  it('유출 버전이 없으면 출시 버전 미정(9.9) 공명자도 없어야 한다 (라이브 전환 시 releaseVersion 입력 누락 방지)', () => {
    if (LEAK_VERSIONS.length > 0) return
    const undecided = ALL_CHARACTERS.filter(c => isReleaseUndecided(c.releaseVersion)).map(c => c.id)
    expect(undecided).toEqual([])
  })
})
