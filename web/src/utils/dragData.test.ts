import { describe, expect, it } from 'vitest'
import { getPoolCharacter } from './dragData'
import { char } from '../test/fixtures'

describe('getPoolCharacter (드래그 데이터 해석)', () => {
  it('도감 카드 데이터 → 공명자', () => {
    expect(getPoolCharacter({ isPool: true, char: char('verina') })?.id).toBe('verina')
  })

  it('슬롯 카드 데이터는 도감 카드가 아니다 (0번 줄 포함)', () => {
    expect(getPoolCharacter({ char: char('verina'), squadIdx: 0, slotIdx: 0 })).toBeNull()
    expect(getPoolCharacter({ char: char('verina'), squadIdx: 2, slotIdx: 1 })).toBeNull()
  })

  it('공명자 객체 자체가 데이터인 경우', () => {
    expect(getPoolCharacter({ ...char('denia') })?.id).toBe('denia')
  })

  it('데이터가 없거나 알 수 없는 모양이면 null', () => {
    expect(getPoolCharacter(undefined)).toBeNull()
    expect(getPoolCharacter({ sortable: true })).toBeNull()
  })
})
