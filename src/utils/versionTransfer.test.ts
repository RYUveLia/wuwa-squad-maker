import { describe, expect, it } from 'vitest'
import {
  getAllowedVersions,
  getCircuitVersions,
  hasAnyMember,
  inferSetVersion,
  isBoardEmpty,
  sanitizeSquadsForVersion,
  suggestVersion,
  toVersionedCircuitKey
} from './versionTransfer'
import { char, row, summarize } from '../test/fixtures'

describe('버전 후보 계산', () => {
  it('공명자가 모두 출시된 버전', () => {
    expect(getAllowedVersions([char('jingran'), char('verina'), null])).toEqual(['3.6', '3.7', '3.8'])
  })

  it('회로 아이콘이 존재하는 버전', () => {
    expect(getCircuitVersions('T_IconpropertyLuokekeBuff1_UI')).toEqual(['3.5', '3.6'])
    expect(getCircuitVersions('T_Iconpropertyredice_UI')).toEqual(['3.6', '3.8'])
    expect(getCircuitVersions('3.7:T_Iconpropertyredmine_UI')).toEqual(['3.7'])
    expect(getCircuitVersions(null)).toEqual([])
  })

  it('대상 버전 회로 키로 변환 (없으면 null)', () => {
    expect(toVersionedCircuitKey('T_Iconpropertyredcrit_UI', '3.5')).toBe('3.5:T_Iconpropertyredcrit_UI')
    expect(toVersionedCircuitKey('T_Iconpropertyredmine_UI', '3.6')).toBeNull()
    expect(toVersionedCircuitKey('3.6:T_Iconpropertyredcrit_UI', '3.7')).toBeNull()
  })

  it('회로 없는 파티는 최신 라이브 버전 추천', () => {
    expect(suggestVersion(row(['verina'])).version).toBe('3.7')
  })
})

describe('sanitizeSquadsForVersion', () => {
  it('미출시 공명자 제외 + 회로 초기화', () => {
    const r = sanitizeSquadsForVersion([row(['verina', 'jingran'], '3.6:T_Iconpropertyredcrit_UI')], '3.5', { resetCircuits: true })
    expect(summarize(r.rows)).toEqual(['verina|-'])
    expect(r.removedUnavailable).toBe(1)
  })

  it('출전 한도 초과분은 앞 파티 우선으로 제외', () => {
    const rows = [row(['denia', 'verina']), row(['denia', 'mornye'])]
    expect(summarize(sanitizeSquadsForVersion(rows, '3.6', { resetCircuits: false }).rows)).toEqual(['denia+verina|-', 'denia+mornye|-'])
    const r37 = sanitizeSquadsForVersion(rows, '3.7', { resetCircuits: false })
    expect(summarize(r37.rows)).toEqual(['denia+verina|-', 'mornye|-'])
    expect(r37.removedOverLimit).toBe(1)
  })

  it('방랑자는 한 명만 남긴다', () => {
    const r = sanitizeSquadsForVersion([row(['rover-havoc', 'verina']), row(['rover-aero', 'mornye'])], '3.7', { resetCircuits: false })
    expect(summarize(r.rows)).toEqual(['rover-havoc+verina|-', 'mornye|-'])
  })

  it('회로 유지 시 대상 버전에 없는 회로만 초기화', () => {
    const r = sanitizeSquadsForVersion(
      [row(['verina'], 'T_Iconpropertyredcrit_UI'), row(['mornye'], 'T_Iconpropertyredmine_UI')],
      '3.6',
      { resetCircuits: false }
    )
    expect(summarize(r.rows)).toEqual(['verina|3.6:T_Iconpropertyredcrit_UI', 'mornye|-'])
    expect(r.clearedCircuits).toBe(1)
  })

  it('공명자가 모두 빠진 파티는 회로가 남아도 삭제', () => {
    const r = sanitizeSquadsForVersion([row(['hsin'], 'T_Iconpropertyredcrit_UI'), row(['verina'])], '3.5', { resetCircuits: false })
    expect(summarize(r.rows)).toEqual(['verina|-'])
    expect(r.droppedRows).toBe(1)
  })

  it('전부 빠지면 빈 파티 1개만 남긴다', () => {
    const r = sanitizeSquadsForVersion([row(['hsin']), row(['suoming'])], '3.5', { resetCircuits: true })
    expect(summarize(r.rows)).toEqual(['|-'])
    expect(hasAnyMember(r.rows)).toBe(false)
    expect(isBoardEmpty(r.rows)).toBe(true)
  })
})

describe('inferSetVersion (세트 단위 추천)', () => {
  it('3.6 전용 회로 + 데니아 2회 세트 → 3.6', () => {
    const set = [
      row(['galbrena', 'brant', 'lupa'], 'T_Iconpropertyredattack_UI'),
      row(['luuk-herssen', 'denia', 'mornye'], 'T_Iconpropertyredcrit_UI'),
      row(['hiyuki', 'lucilla', 'suisui'], 'T_Iconpropertyredice_UI'),
      row(['sigrika', 'qiuyuan', 'shorekeeper'], 'T_IconpropertyLuokekeBuff1_UI'),
      row(['jingran', 'iuno', 'shorekeeper'], 'T_Iconpropertyredattack_UI'),
      row(['qingxiao', 'denia', 'mornye'], 'T_Iconpropertyredcrit_UI')
    ]
    expect(inferSetVersion(set)).toEqual({ version: '3.6', candidates: ['3.6'] })
  })

  it('세트 전체가 맞는 버전이 없으면 null', () => {
    expect(inferSetVersion([row(['hsin'], 'T_IconpropertyLuokekeBuff1_UI')])).toBeNull()
  })

  it('후보가 여럿이면 라이브 버전 우선', () => {
    expect(inferSetVersion([row(['verina'], 'T_Iconpropertyredcrit_UI')])?.version).toBe('3.7')
  })

  it('빈 세트는 null', () => {
    expect(inferSetVersion([row([])])).toBeNull()
  })
})
