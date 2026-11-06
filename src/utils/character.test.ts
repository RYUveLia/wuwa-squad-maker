import { describe, expect, it } from 'vitest'
import {
  checkCharacterMaxedOut,
  getDoubleDeploymentNamesText,
  getMaxDeployment,
  getSeasonBuffInfo,
  getSortedCharacters,
  isAvailableInVersion
} from './character'
import { char } from '../test/fixtures'

describe('isAvailableInVersion', () => {
  it('출시 버전 이하 보드에서만 편성 가능하다', () => {
    expect(isAvailableInVersion(char('qingxiao'), '3.5')).toBe(false) // 청초 3.61
    expect(isAvailableInVersion(char('qingxiao'), '3.6')).toBe(true)
    expect(isAvailableInVersion(char('lynae'), '3.5')).toBe(true) // 3.01
  })

  it('유출 캐릭터는 유출 버전 보드에서만 노출된다', () => {
    expect(isAvailableInVersion(char('lily'), '3.7')).toBe(false)
    expect(isAvailableInVersion(char('lily'), '3.8')).toBe(true)
  })
})

describe('getSortedCharacters', () => {
  it('버전이 올라갈수록 도감 공명자 수가 늘어난다', () => {
    const counts = ['3.5', '3.6', '3.7', '3.8'].map(v => getSortedCharacters(v).length)
    expect(counts).toEqual([...counts].sort((a, b) => a - b))
    expect(getSortedCharacters('3.5').some(c => c.id === 'qingxiao')).toBe(false)
  })
})

describe('시즌 버프 / 출전 한도', () => {
  it('버전별 시즌 버프 대상', () => {
    expect(getSeasonBuffInfo('3.5').character?.id).toBe('chisa')
    expect(getSeasonBuffInfo('3.6').character?.id).toBe('denia')
    expect(getSeasonBuffInfo('3.7').character?.id).toBe('lynae')
    expect(getSeasonBuffInfo('3.8').character?.id).toBe('lucilla')
  })

  it('시즌 버프 대상은 해당 버전에서만 2회', () => {
    expect(getMaxDeployment('denia', '3.6')).toBe(2)
    expect(getMaxDeployment('denia', '3.7')).toBe(1)
  })

  it('순수 힐러는 모든 버전에서 2회', () => {
    for (const v of ['3.5', '3.6', '3.7', '3.8']) expect(getMaxDeployment('verina', v)).toBe(2)
  })

  it('출전 한도 도달 여부', () => {
    const squads = [[char('denia'), null, null], [char('denia'), null, null]]
    expect(checkCharacterMaxedOut('denia', squads, '3.6')).toBe(true)
    expect(checkCharacterMaxedOut('denia', squads.slice(0, 1), '3.6')).toBe(false)
  })

  it('방랑자는 속성 상관없이 한 명만 편성 가능', () => {
    const squads = [[char('rover-havoc'), null, null]]
    expect(checkCharacterMaxedOut('rover-aero', squads, '3.7')).toBe(true)
    expect(checkCharacterMaxedOut('rover-havoc', squads, '3.7')).toBe(true)
  })
})

describe('getDoubleDeploymentNamesText', () => {
  it('해당 버전에 출시된 순수 힐러만 안내한다', () => {
    expect(getDoubleDeploymentNamesText('3.7')).not.toContain(char('lily').name)
    expect(getDoubleDeploymentNamesText('3.8')).toContain(char('lily').name)
  })
})
