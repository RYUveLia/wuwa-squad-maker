import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  STORAGE_KEYS,
  loadLegacySquads,
  loadOwnedResonatorIds,
  loadPendingMigration,
  loadSelectedVersion,
  loadSquadsByVersion,
  markVersionMigrated,
  saveSquadsByVersion
} from './squadStorage'
import { row, summarize } from '../test/fixtures'
import { LIVE_VERSION } from '../constants/versions'

/** Map 기반 localStorage 대역 */
function installMemoryStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear()
  })
  return store
}

beforeEach(() => {
  vi.unstubAllGlobals()
  installMemoryStorage()
})

describe('버전별 보드 저장/로드', () => {
  it('저장한 보드를 그대로 읽어온다 (공명자는 ID로 보관)', () => {
    saveSquadsByVersion({ '3.6': [row(['denia', 'verina'], '3.6:T_Iconpropertyredice_UI')] })
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.squadsByVersion)!)
    expect(raw['3.6'][0].characters).toEqual(['denia', 'verina', null])
    expect(summarize(loadSquadsByVersion()['3.6'])).toEqual(['denia+verina|3.6:T_Iconpropertyredice_UI'])
  })

  it('손상된 저장값은 빈 객체', () => {
    localStorage.setItem(STORAGE_KEYS.squadsByVersion, '{broken')
    expect(loadSquadsByVersion()).toEqual({})
  })

  it('JSON은 맞지만 모양이 다른 행은 건너뛰고 앱이 멈추지 않는다', () => {
    localStorage.setItem(
      STORAGE_KEYS.squadsByVersion,
      JSON.stringify({
        '3.7': [null, 'oops', { characters: 'abc' }, { characters: ['verina', 123, 'no-such-id', 'extra'], circuitBuffId: 7 }],
        '3.6': [null],
        '3.5': 'not-an-array'
      })
    )
    const boards = loadSquadsByVersion()
    expect(summarize(boards['3.7'])).toEqual(['|-', 'verina|-'])
    expect(boards['3.7'][1].characters).toHaveLength(3)
    expect(boards['3.6']).toBeUndefined()
    expect(boards['3.5']).toBeUndefined()
  })

  it('선택 버전: 지원하지 않는 값이면 라이브 버전', () => {
    expect(loadSelectedVersion()).toBe(LIVE_VERSION)
    localStorage.setItem(STORAGE_KEYS.selectedVersion, '3.5')
    expect(loadSelectedVersion()).toBe('3.5')
    localStorage.setItem(STORAGE_KEYS.selectedVersion, '9.9')
    expect(loadSelectedVersion()).toBe(LIVE_VERSION)
  })
})

describe('레거시 데이터 이관', () => {
  it('통합 포맷(wuwa-squads-data)을 읽는다', () => {
    localStorage.setItem(
      STORAGE_KEYS.legacySquadsData,
      JSON.stringify([{ id: 'a', characters: ['verina', null, null], circuitBuffId: 'T_Iconpropertyredcrit_UI' }])
    )
    expect(summarize(loadLegacySquads()!)).toEqual(['verina|T_Iconpropertyredcrit_UI'])
  })

  it('더 이전 포맷(공명자/회로 분리 저장)을 읽는다', () => {
    localStorage.setItem(STORAGE_KEYS.legacySquads, JSON.stringify([['denia', null, null], ['verina']]))
    localStorage.setItem(STORAGE_KEYS.legacyCircuitBuffs, JSON.stringify(['T_Iconpropertyredice_UI']))
    expect(summarize(loadLegacySquads()!)).toEqual(['denia|T_Iconpropertyredice_UI', 'verina|-'])
  })

  it('이관 대기 목록은 빈 행을 빼고, 이관 완료 후에는 null', () => {
    localStorage.setItem(
      STORAGE_KEYS.legacySquadsData,
      JSON.stringify([{ characters: ['verina'] }, { characters: [null, null, null] }])
    )
    expect(summarize(loadPendingMigration()!)).toEqual(['verina|-'])
    markVersionMigrated()
    expect(loadPendingMigration()).toBeNull()
  })

  it('레거시 데이터에 이상한 행이 섞여 있어도 멈추지 않는다', () => {
    localStorage.setItem(STORAGE_KEYS.legacySquadsData, JSON.stringify([null, { characters: 'abc' }, { characters: ['denia'] }]))
    expect(summarize(loadPendingMigration()!)).toEqual(['denia|-'])
    localStorage.removeItem(STORAGE_KEYS.legacySquadsData)
    localStorage.setItem(STORAGE_KEYS.legacySquads, JSON.stringify([null, 'x', ['verina']]))
    expect(summarize(loadPendingMigration()!)).toEqual(['verina|-'])
  })

  it('레거시 데이터가 없거나 비어 있으면 null', () => {
    expect(loadPendingMigration()).toBeNull()
    localStorage.setItem(STORAGE_KEYS.legacySquadsData, JSON.stringify([{ characters: [null, null, null] }]))
    expect(loadPendingMigration()).toBeNull()
  })
})

describe('사용자 설정', () => {
  it('보유 공명자: 저장값이 없으면 기본값', () => {
    expect(loadOwnedResonatorIds(['a', 'b'])).toEqual(['a', 'b'])
    localStorage.setItem(STORAGE_KEYS.ownedResonators, JSON.stringify(['verina']))
    expect(loadOwnedResonatorIds(['a'])).toEqual(['verina'])
  })

  it('저장소 접근이 막혀도 예외 없이 기본값', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') }
    })
    expect(loadSelectedVersion()).toBe(LIVE_VERSION)
    expect(loadSquadsByVersion()).toEqual({})
    expect(() => saveSquadsByVersion({})).not.toThrow()
  })
})
