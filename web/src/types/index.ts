export interface Character {
  id: string
  name: string
  enName: string
  rarity: number
  element: string
  weapon: string
  releaseVersion: number
  img: string
}

/** 파티(스쿼드) 한 줄: 공명자 3칸 + 회로 버프 저장 키(`${version}:${id}` 또는 레거시 아이콘 ID) */
export interface SquadRow {
  id: string
  characters: (Character | null)[]
  circuitBuffId: string | null
}
