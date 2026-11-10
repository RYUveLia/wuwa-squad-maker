import { describe, expect, it } from 'vitest'
import { decodeSquads, encodeSquads, generateExportText, parseImportText } from './squadCode'
import { char } from '../test/fixtures'

const toB64 = (obj: unknown) => btoa(JSON.stringify(obj))

describe('편성 코드 v3 (버전 포함)', () => {
  it('보드 버전과 회로 키를 담아 왕복 변환된다', () => {
    const code = generateExportText(
      [
        { characters: [char('denia'), char('verina'), null], circuitBuffId: '3.6:T_Iconpropertyredice_UI' },
        { characters: [null, null, null], circuitBuffId: null } // 빈 파티는 제외
      ],
      '3.6'
    )
    expect(JSON.parse(atob(code))).toEqual({
      v: 3,
      ver: '3.6',
      s: [{ c: ['denia', 'verina', null], b: '3.6:T_Iconpropertyredice_UI' }]
    })

    const parsed = parseImportText(code)
    expect(parsed?.version).toBe('3.6')
    expect(parsed?.squads).toHaveLength(1)
    expect(parsed?.squads[0].characters.map(c => c?.id ?? null)).toEqual(['denia', 'verina', null])
    expect(parsed?.squads[0].circuitBuffId).toBe('3.6:T_Iconpropertyredice_UI')
  })

  it('버전 없이 인코딩하면 v2 형식', () => {
    expect(JSON.parse(atob(encodeSquads([[char('verina'), null, null]]))).v).toBe(2)
  })
})

describe('이전 형식 호환', () => {
  it('v2 코드는 버전 없이 디코딩된다', () => {
    const parsed = parseImportText(toB64({ v: 2, s: [{ c: ['hsin', null, null], b: 'T_Iconpropertyredmine_UI' }] }))
    expect(parsed?.version).toBeNull()
    expect(parsed?.squads[0].characters[0]?.id).toBe('hsin')
    expect(parsed?.squads[0].circuitBuffId).toBe('T_Iconpropertyredmine_UI')
  })

  it('v1 (2차원 배열) 코드', () => {
    const squads = decodeSquads(toB64([['verina', 'denia']]))
    expect(squads?.[0].characters.map(c => c?.id ?? null)).toEqual(['verina', 'denia', null])
    expect(squads?.[0].circuitBuffId).toBeNull()
  })

  it('알 수 없는 공명자 ID는 빈 슬롯', () => {
    const squads = decodeSquads(toB64({ v: 2, s: [{ c: ['no-such-id', 'verina'], b: null }] }))
    expect(squads?.[0].characters.map(c => c?.id ?? null)).toEqual([null, 'verina', null])
  })

  it('# 주석 줄은 건너뛰고 코드만 읽는다', () => {
    const code = toB64({ v: 2, s: [{ c: ['verina'], b: null }] })
    expect(parseImportText(`# 내 편성\n${code}`)?.squads).toHaveLength(1)
  })

  it('잘못된 코드는 null', () => {
    expect(parseImportText('not-a-code')).toBeNull()
    expect(parseImportText('   ')).toBeNull()
  })
})
