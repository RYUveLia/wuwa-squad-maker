import { describe, expect, it } from 'vitest'
import { CIRCUIT_BUFFS_BY_VERSION, resolveCircuitBuff, toCircuitBuffKey } from './circuitBuffs'
import { GAME_VERSIONS, LIVE_VERSION, getLegacySearchOrder } from './versions'

describe('회로 버프 데이터', () => {
  it('지원하는 모든 버전에 회로 4개씩', () => {
    for (const v of GAME_VERSIONS) expect(CIRCUIT_BUFFS_BY_VERSION[v]).toHaveLength(4)
  })
})

describe('resolveCircuitBuff', () => {
  it('버전 키는 해당 버전 회로로 해석', () => {
    const r = resolveCircuitBuff(toCircuitBuffKey('3.8', 'T_Iconpropertyredcrit_UI'))
    expect(r?.version).toBe('3.8')
    expect(r?.buff.description).toBe(CIRCUIT_BUFFS_BY_VERSION['3.8'].find(b => b.id === 'T_Iconpropertyredcrit_UI')!.description)
  })

  it('해당 버전에 없는 회로 키는 null', () => {
    expect(resolveCircuitBuff('3.8:T_Iconpropertyredmine_UI')).toBeNull()
    expect(resolveCircuitBuff('9.9:x')).toBeNull()
    expect(resolveCircuitBuff(null)).toBeNull()
  })

  // 라이브 버전이 바뀌어도 깨지지 않도록 해석 순서(getLegacySearchOrder)에서 기대값을 구한다
  it('버전 없는 레거시 ID: 라이브 → 이전 버전(최신순) → 이후 버전 순으로 처음 찾은 버전', () => {
    const order = getLegacySearchOrder(GAME_VERSIONS, LIVE_VERSION)
    const allIds = new Set(GAME_VERSIONS.flatMap(v => CIRCUIT_BUFFS_BY_VERSION[v].map(b => b.id)))
    for (const id of allIds) {
      const expected = order.find(v => CIRCUIT_BUFFS_BY_VERSION[v].some(b => b.id === id))
      expect(resolveCircuitBuff(id)?.version, id).toBe(expected)
    }
    // 라이브 버전에 있는 아이콘은 항상 라이브 버전으로 해석
    for (const b of CIRCUIT_BUFFS_BY_VERSION[LIVE_VERSION]) expect(resolveCircuitBuff(b.id)?.version).toBe(LIVE_VERSION)
  })
})
