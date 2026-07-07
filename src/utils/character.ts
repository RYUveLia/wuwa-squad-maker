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
  releaseVersion: 1.0,
  img: '/characters/rover.png'
}

const roverHavoc: Character = {
  id: 'rover-havoc',
  name: '방랑자 (인멸)',
  enName: 'Rover (Havoc)',
  rarity: 5,
  element: 'Havoc',
  weapon: 'Sword',
  releaseVersion: 1.0,
  img: '/characters/rover.png'
}

const roverAero: Character = {
  id: 'rover-aero',
  name: '방랑자 (기류)',
  enName: 'Rover (Aero)',
  rarity: 5,
  element: 'Aero',
  weapon: 'Sword',
  releaseVersion: 1.0,
  img: '/characters/rover.png'
}

const roverElectro: Character = {
  id: 'rover-electro',
  name: '방랑자 (전도)',
  enName: 'Rover (Electro)',
  rarity: 5,
  element: 'Electro',
  weapon: 'Sword',
  releaseVersion: 1.0,
  img: '/characters/rover.png'
}

// 최종 60명 공명자 리스트 다차원 정렬 (Unknown은 끝으로, 나머지는 출시 버전 내림차순 -> 등급 내림차순 -> 이름 오름차순)
export const MOCK_CHARACTERS: Character[] = [...filteredBase, roverSpectro, roverHavoc, roverAero, roverElectro].sort((a, b) => {
  const aIsUnknown = a.releaseVersion === 9.9
  const bIsUnknown = b.releaseVersion === 9.9

  if (aIsUnknown && bIsUnknown) {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity
    return a.enName.localeCompare(b.enName)
  }
  if (aIsUnknown) return 1
  if (bIsUnknown) return -1

  if (a.releaseVersion !== b.releaseVersion) {
    return b.releaseVersion - a.releaseVersion
  }
  if (a.rarity !== b.rarity) {
    return b.rarity - a.rarity
  }
  return a.enName.localeCompare(b.enName)
})

export const getMaxDeployment = (charId: string): number => {
  if (DOUBLE_DEPLOYMENT_CHARACTERS.includes(charId)) return 2
  if (charId === 'chisa') return 2 // 치사 3.5 시즌 임시 2회 룰 기본 적용
  return 1
}
