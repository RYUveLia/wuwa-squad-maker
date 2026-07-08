import { MOCK_CHARACTERS } from './character'
import type { Character } from '../types'

/**
 * 영문 ID 기반 JSON의 Base64 인코딩/디코딩 (레거시 바이너리 포맷 하위 호환 지원)
 */

const EMPTY_SLOT = 0xFF
const CODE_VERSION = 1

// 레거시 id → MOCK_CHARACTERS 인덱스 매핑
const idToIndex = new Map<string, number>()
MOCK_CHARACTERS.forEach((c, idx) => {
  idToIndex.set(c.id, idx)
})

/** 파티 배열 → Base64 코드 문자열 (영문 ID 기반) */
export function encodeSquads(squads: (Character | null)[][]): string {
  // 공명자가 1명이라도 편성된 파티만 걸러냄
  const activeSquads = squads.filter(squad => squad.some(char => char !== null))
  const idSquads = activeSquads.map(squad =>
    squad.map(char => char ? char.id : null)
  )
  const jsonStr = JSON.stringify(idSquads)
  return btoa(jsonStr)
}

/** 레거시 Base64 코드 문자열 디코딩 */
function decodeSquadsLegacy(code: string): (Character | null)[][] | null {
  try {
    const binary = atob(code)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    const version = bytes[0]
    if (version !== CODE_VERSION) return null

    const numSquads = bytes[1]
    if (bytes.length < 2 + numSquads * 3) return null

    const squads: (Character | null)[][] = []
    let offset = 2
    for (let s = 0; s < numSquads; s++) {
      const squad: (Character | null)[] = []
      for (let i = 0; i < 3; i++) {
        const idx = bytes[offset++]
        if (idx === EMPTY_SLOT || idx >= MOCK_CHARACTERS.length) {
          squad.push(null)
        } else {
          squad.push(MOCK_CHARACTERS[idx])
        }
      }
      squads.push(squad)
    }
    return squads
  } catch {
    return null
  }
}

/** Base64 코드 문자열 → 파티 배열 (영문 ID 기반 우선, 실패 시 레거시 폴백) */
export function decodeSquads(code: string): (Character | null)[][] | null {
  try {
    const jsonStr = atob(code)
    // 간단한 검증: JSON 포맷인지 확인
    if (!jsonStr.startsWith('[')) {
      return decodeSquadsLegacy(code)
    }
    const idSquads = JSON.parse(jsonStr) as (string | null)[][]
    
    if (!Array.isArray(idSquads)) return decodeSquadsLegacy(code)
    
    const idToChar = new Map<string, Character>()
    MOCK_CHARACTERS.forEach(c => {
      idToChar.set(c.id, c)
    })
    
    const squads: (Character | null)[][] = []
    for (const squad of idSquads) {
      if (!Array.isArray(squad)) return null
      const restoredSquad = squad.map(id => {
        if (!id) return null
        return idToChar.get(id) || null
      })
      squads.push(restoredSquad)
    }
    return squads
  } catch {
    return decodeSquadsLegacy(code)
  }
}

/** 전체 내보내기 텍스트 생성 (순수 Base64 코드만 반환) */
export function generateExportText(squads: (Character | null)[][]): string {
  return encodeSquads(squads)
}

/** 불러오기 텍스트에서 Base64 코드만 추출하여 디코딩 */
export function parseImportText(text: string): (Character | null)[][] | null {
  const lines = text.trim().split('\n')
  // 주석(#)과 빈 줄을 건너뛰고 첫 번째 유효 라인 = Base64 코드
  const codeLine = lines.find(line => {
    const trimmed = line.trim()
    return trimmed.length > 0 && !trimmed.startsWith('#')
  })
  if (!codeLine) return null
  return decodeSquads(codeLine.trim())
}

