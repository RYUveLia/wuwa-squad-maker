import { describe, expect, it } from 'vitest'
import { CIRCUIT_BUFFS_BY_VERSION, resolveCircuitBuff, toCircuitBuffKey } from './circuitBuffs'
import { GAME_VERSIONS, LIVE_VERSION } from './versions'

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

  it('버전 없는 레거시 ID: 라이브 → 이전 버전 → 유출 버전 순', () => {
    // 모든 버전에 있는 아이콘 → 라이브 버전
    expect(resolveCircuitBuff('T_Iconpropertyredcrit_UI')?.version).toBe(LIVE_VERSION)
    expect(resolveCircuitBuff('T_Iconpropertyredice_UI')?.version).toBe('3.6')
    expect(resolveCircuitBuff('T_IconpropertyLuokekeBuff1_UI')?.version).toBe('3.6')
    expect(resolveCircuitBuff('T_Iconpropertyreddark_UI')?.version).toBe('3.5')
  })
})
