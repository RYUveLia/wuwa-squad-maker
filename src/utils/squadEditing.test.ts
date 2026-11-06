import { describe, expect, it } from 'vitest'
import {
  appendSquadWith,
  deleteSquad,
  findAutoPlaceSlot,
  moveOrSwapSlot,
  parseSlotId,
  placeCharacter,
  removeCharacterAt,
  removeOneFromSquad,
  setSquadCircuit
} from './squadEditing'
import { char, row, summarize } from '../test/fixtures'

describe('parseSlotId', () => {
  it('슬롯 드롭 ID만 파싱', () => {
    expect(parseSlotId('party-2-slot-1')).toEqual({ squadIdx: 2, slotIdx: 1 })
    expect(parseSlotId('squad-row-123')).toBeNull()
  })
})

describe('placeCharacter', () => {
  it('빈 슬롯에 배치', () => {
    const next = placeCharacter([row([])], char('verina'), { squadIdx: 0, slotIdx: 1 }, 2)
    expect(next[0].characters.map(c => c?.id ?? null)).toEqual([null, 'verina', null])
  })

  it('같은 파티 다른 슬롯에 있으면 옮긴다', () => {
    const next = placeCharacter([row(['verina', 'mornye'])], char('verina'), { squadIdx: 0, slotIdx: 2 }, 2)
    expect(next[0].characters.map(c => c?.id ?? null)).toEqual([null, 'mornye', 'verina'])
  })

  it('한도 도달 시 가장 먼저 배치된 것부터 해제 (FIFO)', () => {
    const rows = [row(['denia']), row(['denia']), row([])]
    const next = placeCharacter(rows, char('denia'), { squadIdx: 2, slotIdx: 0 }, 2)
    expect(summarize(next)).toEqual(['|-', 'denia|-', 'denia|-'])
  })

  it('원본을 변경하지 않는다', () => {
    const rows = [row([])]
    placeCharacter(rows, char('verina'), { squadIdx: 0, slotIdx: 0 }, 2)
    expect(rows[0].characters[0]).toBeNull()
  })
})

describe('moveOrSwapSlot', () => {
  it('빈 슬롯으로 이동', () => {
    const next = moveOrSwapSlot([row(['verina']), row([])], { squadIdx: 0, slotIdx: 0 }, { squadIdx: 1, slotIdx: 2 })
    expect(summarize(next)).toEqual(['|-', 'verina|-'])
  })

  it('같은 파티 내 맞교환', () => {
    const next = moveOrSwapSlot([row(['verina', 'mornye'])], { squadIdx: 0, slotIdx: 0 }, { squadIdx: 0, slotIdx: 1 })
    expect(next[0].characters.map(c => c?.id ?? null)).toEqual(['mornye', 'verina', null])
  })

  it('다른 파티로 옮겼을 때 중복이 생기면 무시', () => {
    const rows = [row(['verina']), row(['verina', null, null])]
    expect(moveOrSwapSlot(rows, { squadIdx: 0, slotIdx: 0 }, { squadIdx: 1, slotIdx: 1 })).toBe(rows)
  })

  it('빈 슬롯을 끌면 무시', () => {
    const rows = [row([])]
    expect(moveOrSwapSlot(rows, { squadIdx: 0, slotIdx: 0 }, { squadIdx: 0, slotIdx: 1 })).toBe(rows)
  })
})

describe('기타 편집', () => {
  it('슬롯 비우기 / 파티에서 한 명 빼기', () => {
    expect(summarize(removeCharacterAt([row(['verina', 'mornye'])], { squadIdx: 0, slotIdx: 0 }))).toEqual(['mornye|-'])
    expect(summarize(removeOneFromSquad([row(['verina']), row(['verina'])], 'verina', 1))).toEqual(['verina|-', '|-'])
  })

  it('자동 배치 위치: 같은 공명자가 없는 첫 파티의 첫 빈 칸', () => {
    expect(findAutoPlaceSlot([row(['verina', 'mornye']), row(['denia'])], 'verina')).toEqual({ squadIdx: 1, slotIdx: 1 })
    expect(findAutoPlaceSlot([row(['verina', 'mornye', 'denia'])], 'lynae')).toBeNull()
  })

  it('파티 삭제: 마지막 한 줄이면 빈 파티로 교체', () => {
    expect(summarize(deleteSquad([row(['verina']), row(['denia'])], 0))).toEqual(['denia|-'])
    expect(summarize(deleteSquad([row(['verina'])], 0))).toEqual(['|-'])
  })

  it('회로 지정 / 공명자와 함께 파티 추가', () => {
    expect(summarize(setSquadCircuit([row(['verina'])], 0, '3.7:T_Iconpropertyredcrit_UI'))).toEqual(['verina|3.7:T_Iconpropertyredcrit_UI'])
    expect(summarize(appendSquadWith([row(['verina'])], char('denia')))).toEqual(['verina|-', 'denia|-'])
  })
})
