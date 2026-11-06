// 파티 편성 편집 순수 함수 (불변 업데이트). 출전 한도 등 규칙 값은 호출부에서 주입한다.

import type { Character, SquadRow } from '../types'
import { createEmptySquadRow } from './squadRow'

export interface SlotPosition {
  squadIdx: number
  slotIdx: number
}

const cloneRows = (rows: SquadRow[]): SquadRow[] => rows.map(r => ({ ...r, characters: [...r.characters] }))

/** dnd-kit 슬롯 드롭 ID(`party-{squad}-slot-{slot}`) 파싱 */
export function parseSlotId(id: string): SlotPosition | null {
  const match = id.match(/^party-(\d+)-slot-(\d+)$/)
  return match ? { squadIdx: parseInt(match[1], 10), slotIdx: parseInt(match[2], 10) } : null
}

/**
 * 공명자를 지정 슬롯에 배치
 * - [규칙 1] 같은 파티 다른 슬롯에 이미 있으면 그 슬롯은 비운다
 * - [규칙 2] 전체 출전 횟수가 한도에 도달했으면 가장 먼저 배치된 것부터 해제 (FIFO)
 */
export function placeCharacter(
  rows: SquadRow[],
  char: Character,
  target: SlotPosition,
  maxAllowed: number
): SquadRow[] {
  const next = cloneRows(rows)
  const targetRow = next[target.squadIdx]

  if (targetRow) {
    const dupSlotIdx = targetRow.characters.findIndex(slot => slot?.id === char.id)
    if (dupSlotIdx !== -1 && dupSlotIdx !== target.slotIdx) targetRow.characters[dupSlotIdx] = null
  }

  const deployments: SlotPosition[] = []
  next.forEach((row, squadIdx) =>
    row.characters.forEach((slot, slotIdx) => {
      if (squadIdx === target.squadIdx && slotIdx === target.slotIdx) return
      if (slot?.id === char.id) deployments.push({ squadIdx, slotIdx })
    })
  )
  if (deployments.length >= maxAllowed) {
    deployments.slice(0, deployments.length - maxAllowed + 1).forEach(d => {
      next[d.squadIdx].characters[d.slotIdx] = null
    })
  }

  if (targetRow) targetRow.characters[target.slotIdx] = char
  return next
}

/** 지정 슬롯 비우기 */
export function removeCharacterAt(rows: SquadRow[], pos: SlotPosition): SquadRow[] {
  return rows.map((row, squadIdx) => {
    if (squadIdx !== pos.squadIdx) return row
    const characters = [...row.characters]
    characters[pos.slotIdx] = null
    return { ...row, characters }
  })
}

/** 지정 파티에서 해당 공명자 한 칸만 비우기 */
export function removeOneFromSquad(rows: SquadRow[], charId: string, squadIdx: number): SquadRow[] {
  return rows.map((row, idx) => {
    if (idx !== squadIdx) return row
    let removed = false
    const characters = row.characters.map(slot => {
      if (!removed && slot?.id === charId) {
        removed = true
        return null
      }
      return slot
    })
    return { ...row, characters }
  })
}

/**
 * 슬롯 간 이동/맞교환. 규칙에 어긋나면(다른 파티에 같은 공명자가 생김) 원본 배열을 그대로 반환한다.
 */
export function moveOrSwapSlot(rows: SquadRow[], source: SlotPosition, target: SlotPosition): SquadRow[] {
  if (source.squadIdx === target.squadIdx && source.slotIdx === target.slotIdx) return rows
  const next = cloneRows(rows)
  const sourceRow = next[source.squadIdx]
  const targetRow = next[target.squadIdx]
  const sourceChar = sourceRow?.characters[source.slotIdx]
  const targetChar = targetRow?.characters[target.slotIdx]
  if (!sourceChar || !targetRow) return rows

  const hasElsewhere = (row: SquadRow, exceptSlot: number, id: string) =>
    row.characters.some((c, idx) => idx !== exceptSlot && c?.id === id)

  // 빈 슬롯으로 이동
  if (!targetChar) {
    if (source.squadIdx !== target.squadIdx && hasElsewhere(targetRow, target.slotIdx, sourceChar.id)) return rows
    targetRow.characters[target.slotIdx] = sourceChar
    sourceRow.characters[source.slotIdx] = null
    return next
  }

  // 같은 파티 내 맞교환
  if (source.squadIdx === target.squadIdx) {
    sourceRow.characters[source.slotIdx] = targetChar
    targetRow.characters[target.slotIdx] = sourceChar
    return next
  }

  // 다른 파티 간 맞교환: 양쪽 모두 중복이 생기지 않아야 함
  if (hasElsewhere(targetRow, target.slotIdx, sourceChar.id) || hasElsewhere(sourceRow, source.slotIdx, targetChar.id)) {
    return rows
  }
  sourceRow.characters[source.slotIdx] = targetChar
  targetRow.characters[target.slotIdx] = sourceChar
  return next
}

/** 도감 클릭 자동 배치 위치: 해당 공명자가 없는 첫 파티의 첫 빈 슬롯 */
export function findAutoPlaceSlot(rows: SquadRow[], charId: string): SlotPosition | null {
  for (let squadIdx = 0; squadIdx < rows.length; squadIdx++) {
    const slots = rows[squadIdx].characters
    const slotIdx = slots.findIndex(slot => slot === null)
    if (slotIdx !== -1 && !slots.some(slot => slot?.id === charId)) return { squadIdx, slotIdx }
  }
  return null
}

/** 파티 삭제 (마지막 한 줄이면 빈 파티로 교체) */
export function deleteSquad(rows: SquadRow[], squadIdx: number): SquadRow[] {
  return rows.length > 1 ? rows.filter((_, idx) => idx !== squadIdx) : [createEmptySquadRow()]
}

/** 회로 버프 지정/해제 */
export function setSquadCircuit(rows: SquadRow[], squadIdx: number, circuitBuffId: string | null): SquadRow[] {
  return rows.map((row, idx) => (idx === squadIdx ? { ...row, circuitBuffId } : row))
}

/** 새 파티를 추가하고 첫 칸에 공명자 배치 */
export function appendSquadWith(rows: SquadRow[], char: Character): SquadRow[] {
  return [...rows, { ...createEmptySquadRow(rows.length), characters: [char, null, null] }]
}
