import type { SquadRow } from '../types'
import { SQUAD_ROW_PREFIX } from './dragData'

/** 파티 행 고유 ID (dnd-kit 정렬 키로도 사용, SQUAD_ROW_PREFIX로 행 드래그를 구분) */
export const createSquadRowId = (index: number = 0): string =>
  `${SQUAD_ROW_PREFIX}${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`

/** 빈 파티 행 */
export const createEmptySquadRow = (index: number = 0): SquadRow => ({
  id: createSquadRowId(index),
  characters: [null, null, null],
  circuitBuffId: null
})

/** 빈 파티 행 목록 (기본 3줄) */
export const createEmptySquads = (count: number = 3): SquadRow[] =>
  Array.from({ length: count }, (_, i) => createEmptySquadRow(i))
