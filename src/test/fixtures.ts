import type { Character } from '../types'
import { getCharacterById } from '../utils/character'

/** 공명자 ID로 Character 조회 (테스트 전용, 없으면 에러) */
export function char(id: string): Character {
  const found = getCharacterById(id)
  if (!found) throw new Error(`unknown character id: ${id}`)
  return found
}

let rowSeq = 0

/** 테스트용 파티 행 생성: row(['denia', 'verina'], 'T_Iconpropertyredcrit_UI') */
export function row(ids: (string | null)[], circuitBuffId: string | null = null) {
  const characters = [...ids, null, null, null].slice(0, 3).map(id => (id ? char(id) : null))
  return { id: `test-row-${rowSeq++}`, characters, circuitBuffId }
}

/** 파티 행을 "a+b|circuit" 문자열로 요약 (비교용) */
export function summarize(rows: { characters: (Character | null)[]; circuitBuffId: string | null }[]) {
  return rows.map(r => `${r.characters.filter(Boolean).map(c => c!.id).join('+')}|${r.circuitBuffId ?? '-'}`)
}
