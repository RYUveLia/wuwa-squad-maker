import { MOCK_CHARACTERS } from './character'
import type { Character } from '../types'

export interface SquadExportInput {
  characters: (Character | null)[]
  circuitBuffId?: string | null
}

export interface DecodedSquadResult {
  characters: (Character | null)[]
  circuitBuffId: string | null
}

const EMPTY_SLOT = 0xFF
const CODE_VERSION = 1

/** 레거시 Base64 바이너리 코드 문자열 디코딩 */
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

/** 파티 배열 (공명자 + 회로 버프) → Base64 코드 문자열 */
export function encodeSquads(squads: SquadExportInput[] | (Character | null)[][]): string {
  const normalized = squads
    .map(item => {
      if (Array.isArray(item)) {
        return {
          c: item.map(char => (char ? char.id : null)),
          b: null
        }
      }
      return {
        c: item.characters.map(char => (char ? char.id : null)),
        b: item.circuitBuffId || null
      }
    })
    .filter(item => item.c.some(id => id !== null) || item.b !== null)

  const payload = {
    v: 2,
    s: normalized
  }
  return btoa(JSON.stringify(payload))
}

/** Base64 코드 문자열 → 파티 배열 (v2 객체 포맷, v1 2D 배열 포맷, 레거시 바이너리 하위 호환) */
export function decodeSquads(code: string): DecodedSquadResult[] | null {
  try {
    const jsonStr = atob(code)
    if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
      const legacy = decodeSquadsLegacy(code)
      if (!legacy) return null
      return legacy.map(s => ({ characters: s, circuitBuffId: null }))
    }

    const parsed = JSON.parse(jsonStr)
    const idToChar = new Map<string, Character>()
    MOCK_CHARACTERS.forEach(c => {
      idToChar.set(c.id, c)
    })

    // v2 형식: { v: 2, s: [ { c: [...], b: '...' } ] }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.s)) {
      return parsed.s.map((item: { c: (string | null)[]; b?: string | null }) => {
        const chars: (Character | null)[] = Array.isArray(item.c)
          ? item.c.map(id => (id ? idToChar.get(id) || null : null))
          : [null, null, null]
        while (chars.length < 3) chars.push(null)
        if (chars.length > 3) chars.length = 3
        return {
          characters: chars,
          circuitBuffId: typeof item.b === 'string' ? item.b : null
        }
      })
    }

    // v1 형식: (string | null)[][]
    if (Array.isArray(parsed)) {
      const results: DecodedSquadResult[] = []
      for (const squad of parsed) {
        if (!Array.isArray(squad)) return null
        const restoredSquad = squad.map(id => {
          if (!id) return null
          return idToChar.get(id) || null
        })
        while (restoredSquad.length < 3) restoredSquad.push(null)
        if (restoredSquad.length > 3) restoredSquad.length = 3
        results.push({
          characters: restoredSquad,
          circuitBuffId: null
        })
      }
      return results
    }

    return null
  } catch {
    const legacy = decodeSquadsLegacy(code)
    if (!legacy) return null
    return legacy.map(s => ({ characters: s, circuitBuffId: null }))
  }
}

/** 전체 내보내기 텍스트 생성 (순수 Base64 코드만 반환) */
export function generateExportText(squads: SquadExportInput[] | (Character | null)[][]): string {
  return encodeSquads(squads)
}

/** 불러오기 텍스트에서 Base64 코드만 추출하여 디코딩 */
export function parseImportText(text: string): DecodedSquadResult[] | null {
  const lines = text.trim().split('\n')
  const codeLine = lines.find(line => {
    const trimmed = line.trim()
    return trimmed.length > 0 && !trimmed.startsWith('#')
  })
  if (!codeLine) return null
  return decodeSquads(codeLine.trim())
}
