// dnd-kit 드래그 데이터 해석 (React 무관 순수 함수)

import type { Character } from '../types'

/** 도감 영역 드롭 ID (슬롯 캐릭터를 도감으로 끌면 편성 해제) */
export const POOL_DROPPABLE_ID = 'character-pool-droppable'
/** 파티 행 정렬용 드래그 ID 접두사 */
export const SQUAD_ROW_PREFIX = 'squad-row-'

/**
 * 드래그 데이터가 도감 카드에서 온 것이면 공명자를 반환한다.
 * - 도감 카드: `{ isPool: true, char }`
 * - 슬롯 카드: `{ char, squadIdx, slotIdx }` → 도감 카드가 아님 (null)
 * - 공명자 객체 자체가 데이터인 경우(element 필드 보유)도 도감 카드로 취급
 */
export function getPoolCharacter(data: Record<string, unknown> | undefined): Character | null {
  if (!data) return null
  if (data.isPool && data.char) return data.char as Character
  if (data.char && data.squadIdx === undefined) return data.char as Character
  if (!data.squadIdx && data.element) return data as unknown as Character
  return null
}
