import { MOCK_CHARACTERS } from './character'
import type { Character } from '../types'

/**
 * 하스스톤 덱 코드 스타일 인코딩/디코딩
 * 
 * 바이너리 구조: [version=1, numSquads, ...각 스쿼드별 3개 캐릭터 인덱스]
 * - 캐릭터 인덱스 = MOCK_CHARACTERS 배열 내 위치 (0~254)
 * - 빈 슬롯 = 0xFF (255)
 * - Base64 인코딩하여 한 줄 코드로 압축
 */

const EMPTY_SLOT = 0xFF
const CODE_VERSION = 1

// id → MOCK_CHARACTERS 인덱스 매핑 (런타임 캐시)
const idToIndex = new Map<string, number>()
MOCK_CHARACTERS.forEach((c, idx) => {
  idToIndex.set(c.id, idx)
})

/** 파티 배열 → Base64 코드 문자열 */
export function encodeSquads(squads: (Character | null)[][]): string {
  const bytes: number[] = [CODE_VERSION, squads.length]
  for (const squad of squads) {
    for (let i = 0; i < 3; i++) {
      const char = squad[i]
      if (!char) {
        bytes.push(EMPTY_SLOT)
      } else {
        const idx = idToIndex.get(char.id)
        bytes.push(idx !== undefined ? idx : EMPTY_SLOT)
      }
    }
  }
  // Uint8Array → Base64
  return btoa(String.fromCharCode(...bytes))
}

/** Base64 코드 문자열 → 파티 배열 */
export function decodeSquads(code: string): (Character | null)[][] | null {
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

/** 파티 배열 → 사람이 읽을 수 있는 주석 라인 목록 */
export function generateReadableLines(squads: (Character | null)[][]): string[] {
  return squads.map((squad, idx) => {
    const names = squad.map(c => c ? c.name : '(빈 슬롯)').join(', ')
    return `# ${idx + 1}번 파티: ${names}`
  })
}

/** 전체 내보내기 텍스트 생성 (하스스톤 스타일) */
export function generateExportText(squads: (Character | null)[][]): string {
  const header = '### WuWa 매트릭스 편성 코드 ###'
  const code = encodeSquads(squads)
  const readable = generateReadableLines(squads)
  return [header, code, ...readable].join('\n')
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
