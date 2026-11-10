import characterData from '../data/characters.json'
import type { Character } from '../types'
import { DOUBLE_DEPLOYMENT_CHARACTERS, ROVER_IDS } from '../constants'
import { LEAK_VERSIONS, SEASON_BUFF_CHARACTER_BY_VERSION, versionToNumber } from '../constants/versions'

const baseCharacters = characterData as Character[]
const filteredBase = baseCharacters.filter(c => c.id !== 'rover')

const roverSpectro: Character = {
  id: 'rover-spectro',
  name: '방랑자 (회절)',
  enName: 'Rover (Spectro)',
  rarity: 5,
  element: 'Spectro',
  weapon: 'Sword',
  releaseVersion: 1.011,
  img: '/characters/rover.png'
}

const roverHavoc: Character = {
  id: 'rover-havoc',
  name: '방랑자 (인멸)',
  enName: 'Rover (Havoc)',
  rarity: 5,
  element: 'Havoc',
  weapon: 'Sword',
  releaseVersion: 1.011,
  img: '/characters/rover.png'
}

const roverAero: Character = {
  id: 'rover-aero',
  name: '방랑자 (기류)',
  enName: 'Rover (Aero)',
  rarity: 5,
  element: 'Aero',
  weapon: 'Sword',
  releaseVersion: 1.011,
  img: '/characters/rover.png'
}

const roverElectro: Character = {
  id: 'rover-electro',
  name: '방랑자 (전도)',
  enName: 'Rover (Electro)',
  rarity: 5,
  element: 'Electro',
  weapon: 'Sword',
  releaseVersion: 1.011,
  img: '/characters/rover.png'
}

// 차기(3.8) 유출 캐릭터 ID 목록 (출시 버전이 미정(9.9)이어도 유출 버전 보드에서는 노출)
export const LEAK_CHARACTER_IDS: string[] = ['lily']

const rawCharacters: Character[] = [...filteredBase, roverSpectro, roverHavoc, roverAero, roverElectro]

// 전체 등록된 공명자 마스터 리스트 (전체 캐릭터 ID 검색 및 기본 데이터용)
export const ALL_CHARACTERS: Character[] = [...rawCharacters].sort((a, b) => {
  // 1차: 등급 내림차순 (5성 → 4성)
  if (a.rarity !== b.rarity) {
    return b.rarity - a.rarity
  }
  // 2차: 출시 버전 내림차순 (최신 먼저)
  if (a.releaseVersion !== b.releaseVersion) {
    return b.releaseVersion - a.releaseVersion
  }
  return a.enName.localeCompare(b.enName)
})

/** 해당 버전 보드에서 편성 가능한(출시된) 공명자인지 여부 */
export const isAvailableInVersion = (char: Character, version: string): boolean => {
  if (versionToNumber(char.releaseVersion) <= versionToNumber(version)) return true
  // 출시 버전 미정 유출 캐릭터는 유출 버전 보드에서만 노출
  return LEAK_CHARACTER_IDS.includes(char.id) && LEAK_VERSIONS.includes(version)
}

/** 선택된 버전까지 출시된 공명자 목록 (등급 → 최신순 정렬 유지) */
export const getSortedCharacters = (version: string): Character[] => {
  return ALL_CHARACTERS.filter(c => isAvailableInVersion(c, version))
}

const CHARACTER_BY_ID = new Map(ALL_CHARACTERS.map(c => [c.id, c]))

/** 공명자 ID로 조회 (없으면 null) */
export const getCharacterById = (id: string | null | undefined): Character | null =>
  (id ? CHARACTER_BY_ID.get(id) : undefined) ?? null

export interface SeasonBuffInfo {
  version: string
  character: Character | null
}

/** 버전별 2회 출전 시즌 버프 정보 반환 (미정인 경우 character: null) */
export const getSeasonBuffInfo = (version: string): SeasonBuffInfo => {
  const charId = SEASON_BUFF_CHARACTER_BY_VERSION[version] ?? null
  const character = getCharacterById(charId)
  return { version, character }
}

export const getMaxDeployment = (charId: string, version: string): number => {
  const seasonBuff = getSeasonBuffInfo(version)
  if (seasonBuff.character && seasonBuff.character.id === charId) {
    return 2
  }
  if (DOUBLE_DEPLOYMENT_CHARACTERS.includes(charId)) return 2
  return 1
}

/** 특정 공명자가 편성된 모든 스쿼드 인덱스 목록 추출 */
export function getAssignedSquadIndices(charId: string, squads: (Character | null)[][]): number[] {
  const indices: number[] = []
  for (let i = 0; i < squads.length; i++) {
    if (squads[i].some(slot => slot && slot.id === charId)) {
      indices.push(i)
    }
  }
  return indices
}

/** 특정 공명자가 출전 횟수 한도에 다다랐는지 검증 (방랑자 상호 잠금 규칙 포함) */
export function checkCharacterMaxedOut(charId: string, squads: (Character | null)[][], version: string): boolean {
  const isRover = ROVER_IDS.includes(charId)
  
  const assignedIndices = getAssignedSquadIndices(charId, squads)
  const isThisRoverDeployed = assignedIndices.length > 0
  
  const isAnyOtherRoverDeployed = ALL_CHARACTERS.some(c => 
    ROVER_IDS.includes(c.id) && 
    c.id !== charId && 
    getAssignedSquadIndices(c.id, squads).length > 0
  )
  
  const maxAllowed = getMaxDeployment(charId, version)
  return isRover 
    ? (isThisRoverDeployed || isAnyOtherRoverDeployed)
    : (assignedIndices.length >= maxAllowed)
}

/** 해당 버전에서 기본 2회 출전이 가능한 순수 힐러들의 한글 이름 목록 괄호 포맷 텍스트 반환 */
export function getDoubleDeploymentNamesText(version: string): string {
  const names = DOUBLE_DEPLOYMENT_CHARACTERS
    .map(id => getCharacterById(id))
    .filter((char): char is Character => !!char && isAvailableInVersion(char, version))
    .map(char => char.name)

  return `(${names.join(', ')})`
}
