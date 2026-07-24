import characterData from '../data/characters.json'
import type { Character } from '../types'
import { DOUBLE_DEPLOYMENT_CHARACTERS } from '../constants'

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

// 최종 60명 공명자 리스트 다차원 정렬 (등급 내림차순 → 출시 버전 내림차순 → 이름 오름차순, Unknown 9.9는 끝으로)
export const MOCK_CHARACTERS: Character[] = [...filteredBase, roverSpectro, roverHavoc, roverAero, roverElectro].sort((a, b) => {
  const aIsUnknown = a.releaseVersion === 9.9
  const bIsUnknown = b.releaseVersion === 9.9

  if (aIsUnknown && bIsUnknown) {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity
    return a.enName.localeCompare(b.enName)
  }
  if (aIsUnknown) return 1
  if (bIsUnknown) return -1

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

// 유출 정보 설정에 의존하는 중복 편성 가능 캐릭터 목록 (추후 신규 캐릭터 등장 시 이곳에 ID 추가)
export const LEAK_DOUBLE_DEPLOYMENT_CHARACTERS: string[] = []

export const getMaxDeployment = (charId: string, showLeakInfo: boolean = false): number => {
  if (showLeakInfo) {
    if (charId === 'denia') return 2
    if (charId === 'chisa') return 1
  } else {
    if (charId === 'chisa') return 2
    if (charId === 'denia') return 1
  }

  if (LEAK_DOUBLE_DEPLOYMENT_CHARACTERS.includes(charId)) {
    return showLeakInfo ? 2 : 1
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
export function checkCharacterMaxedOut(charId: string, squads: (Character | null)[][], showLeakInfo: boolean = false): boolean {
  const ROVER_IDS = ['rover-spectro', 'rover-havoc', 'rover-aero', 'rover-electro']
  const isRover = ROVER_IDS.includes(charId)
  
  const assignedIndices = getAssignedSquadIndices(charId, squads)
  const isThisRoverDeployed = assignedIndices.length > 0
  
  const isAnyOtherRoverDeployed = MOCK_CHARACTERS.some(c => 
    ROVER_IDS.includes(c.id) && 
    c.id !== charId && 
    getAssignedSquadIndices(c.id, squads).length > 0
  )
  
  const maxAllowed = getMaxDeployment(charId, showLeakInfo)
  return isRover 
    ? (isThisRoverDeployed || isAnyOtherRoverDeployed)
    : (assignedIndices.length >= maxAllowed)
}

/** 유출 설정에 따라 중복 편성이 허용되는 공명자들의 한글 이름 목록 괄호 포맷 텍스트 반환 */
export function getDoubleDeploymentNamesText(showLeakInfo: boolean): string {
  const allowedIds = [
    ...DOUBLE_DEPLOYMENT_CHARACTERS,
    ...(showLeakInfo ? LEAK_DOUBLE_DEPLOYMENT_CHARACTERS : [])
  ]
  
  const names = allowedIds.map(id => {
    const char = MOCK_CHARACTERS.find(c => c.id === id)
    return char ? char.name : ''
  }).filter(Boolean)
  
  return `(${names.join(', ')})`
}
