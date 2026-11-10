import { GAME_VERSIONS, LIVE_VERSION } from './versions'

export interface CircuitBuff {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  iconUrl: string
}

// 3.5 특이점 확장 회로 버프 목록 (Tower 12 / S2 단계1)
export const CIRCUIT_BUFFS_3_5: CircuitBuff[] = [
  {
    id: 'T_Iconpropertyreddark_UI',
    name: '이상 효과 강화',
    nameEn: 'Enhancement: Negative Status',
    description: '캐릭터가 이상 효과 추가 시, 목표가 받는 피해가 최종적으로 25% 증가되고, 30초간 지속된다.\n캐릭터가 암흑 효과 추가 시, 자신이 입히는 피해가 최종적으로 30% 증가되고, 15초간 지속된다',
    descriptionEn: 'When affected by Negative Statuses, the target\'s total DMG taken is increased by 25% for 30s.\nInflicting Havoc Bane increases Resonators\' total DMG dealt by 30% for 15s.',
    iconUrl: '/circuits/T_Iconpropertyreddark_UI.webp'
  },
  {
    id: 'T_IconpropertyLuokekeBuff1_UI',
    name: '에코 어빌리티 강화',
    nameEn: 'Enhancement: Echo Skill',
    description: '아군의 에코 어빌리티가 입히는 피해가 최종적으로 30% 증가되고, 용융 피해가 최종적으로 20% 증가되며, 강공격 피해가 최종적으로 20% 증가된다',
    descriptionEn: 'Echo Skill Total DMG is increased by 30%, Fusion Total DMG by 20%, and Heavy Attack Total DMG by 20%.',
    iconUrl: '/circuits/T_IconpropertyLuokekeBuff1_UI.webp'
  },
  {
    id: 'T_Iconpropertyredcrit_UI',
    name: '조화도 파괴 강화',
    nameEn: 'Enhancement: Tune Break',
    description: '캐릭터의 조화 파동 피해가 최종적으로 150% 증가된다.\n캐릭터가 조화도 · 이탈 상태 추가 시, 피해가 최종적으로 25% 증가되고, 30초간 지속된다',
    descriptionEn: 'Resonators\' total Tune Rupture DMG is increased by 150%.\nInflicting Tunability - Shifting increases total DMG by 25% for 30s.',
    iconUrl: '/circuits/T_Iconpropertyredcrit_UI.webp'
  },
  {
    id: 'T_Iconpropertyredattack_UI',
    name: '공용 강화',
    nameEn: 'General Enhancement',
    description: '적군이 받는 피해가 최종적으로 20% 증가되고, 적군이 받는 공명 스킬 피해가 최종적으로 20% 증가된다',
    descriptionEn: 'Enemies take 20% more total DMG. Enemies take 20% more total Resonance Skill DMG.',
    iconUrl: '/circuits/T_Iconpropertyredattack_UI.webp'
  }
]

// 3.6 특이점 확장 회로 버프 목록 (Tower 14 / S2 단계2)
export const CIRCUIT_BUFFS_3_6: CircuitBuff[] = [
  {
    id: 'T_Iconpropertyredice_UI',
    name: '이상 효과 강화',
    nameEn: 'Enhancement: Negative Status',
    description: '캐릭터가 이상 효과 추가 시, 목표가 받는 피해를 최종적으로 25% 증가시키고, 30초간 지속된다.\n적군이 받는 서리 효과의 피해가 최종적으로 80% 증가된다.',
    descriptionEn: 'When inflicted with Negative Statuses, the target\'s total DMG taken is increased by 25% for 30s. Enemies take 80% more total Glacio Chafe DMG.',
    iconUrl: '/circuits/T_Iconpropertyredice_UI.webp'
  },
  {
    id: 'T_IconpropertyLuokekeBuff1_UI',
    name: '에코 어빌리티 강화',
    nameEn: 'Enhancement: Echo Skill',
    description: '아군 에코 어빌리티의 피해가 최종적으로 30% 증가되고, 인멸 피해가 최종적으로 20% 증가되며, 공명 스킬 피해가 최종적으로 20% 증가된다.',
    descriptionEn: 'Total Echo Skill DMG is increased by 30%. Total Havoc DMG is increased by 20%. Total Resonance Skill DMG is increased by 20%.',
    iconUrl: '/circuits/T_IconpropertyLuokekeBuff1_UI.webp'
  },
  {
    id: 'T_Iconpropertyredcrit_UI',
    name: '조화도 파괴 강화',
    nameEn: 'Enhancement: Tune Break',
    description: '캐릭터가 조화도 · 이탈 상태 추가 시, 파티 전체의 피해가 최종적으로 25% 증가되며, 30초간 지속된다. 캐릭터가 조화 밀집 · 이탈 상태 추가 시, 피해가 최종적으로 30% 증가되며, 15초간 지속된다.',
    descriptionEn: 'When a Resonator inflicts Tunability - Shifting, the total DMG dealt by all Resonators in the team is increased by 25% for 30s. When a Resonator inflicts Tune Strain - Shifting, their total DMG is increased by 30% for 15s.',
    iconUrl: '/circuits/T_Iconpropertyredcrit_UI.webp'
  },
  {
    id: 'T_Iconpropertyredattack_UI',
    name: '공용 강화',
    nameEn: 'General Enhancement',
    description: '적군이 받는 피해가 최종적으로 20% 증가되고, 적군이 받는 강공격 피해가 최종적으로 20% 증가된다.',
    descriptionEn: 'Enemies take 20% more total DMG. Enemies take 20% more total Heavy Attack DMG.',
    iconUrl: '/circuits/T_Iconpropertyredattack_UI.webp'
  }
]

// 3.7 특이점 확장 회로 버프 목록 (Tower 16 / S2 단계3)
export const CIRCUIT_BUFFS_3_7: CircuitBuff[] = [
  {
    id: 'T_Iconpropertyredmine_UI',
    name: '이상 효과 강화',
    nameEn: 'Enhancement: Negative Status',
    description: '캐릭터가 이상 효과를 추가할 시, 목표가 받는 최종 피해를 25% 증가시키고, 받는 전도 최종 피해를 추가로 30% 증가시키며, 30초간 지속된다',
    descriptionEn: 'When inflicted with Negative Statuses, the target takes 25% more total DMG and an additional 30% more total Electro DMG for 30s.',
    iconUrl: '/circuits/T_Iconpropertyredmine_UI.webp'
  },
  {
    id: 'T_Iconpropertyredphysics_UI',
    name: '기본 피해 강화',
    nameEn: 'Basic DMG Enhancement',
    description: '에코 어빌리티 피해가 최종적으로 40% 증가된다.\n캐릭터가 합일 대응 시, 입히는 피해가 최종적으로 55% 증가되고, 30초간 지속된다.\n캐릭터가 실드 획득 시, 입히는 최종 피해가 11% 증가되고, 최대 5스택 중첩이 가능하며, 2초간 지속되고, 캐릭터가 퇴장 시 제거된다',
    descriptionEn: 'Total Echo Skill DMG is increased by 40%.\nWhen a Resonator triggers Unison Response, they deal 55% more total DMG for 30s.\nResonators deal 11% more total DMG upon gaining a Shield for 2s, stacking up to 5 times. The stacks are cleared when the Resonator is switched out.',
    iconUrl: '/circuits/T_Iconpropertyredphysics_UI.webp'
  },
  {
    id: 'T_Iconpropertyredcrit_UI',
    name: '조화도 파괴 강화',
    nameEn: 'Enhancement: Tune Break',
    description: '캐릭터가 조화도 · 이탈 상태를 추가할 시, 파티 전체의 피해가 최종적으로 25% 증가되고 30초간 지속된다.\n캐릭터가 해킹 · 이탈 상태를 추가할 시, 입히는 피해가 최종적으로 30% 증가되고 30초간 지속된다',
    descriptionEn: 'Inflicting Tunability - Shifting increases the total DMG dealt by all Resonators in the team by 25% for 30s.\nInflicting Hack - Shifting increases the total DMG dealt by the Resonator by 30% for 30s.',
    iconUrl: '/circuits/T_Iconpropertyredcrit_UI.webp'
  },
  {
    id: 'T_Iconpropertyredattack_UI',
    name: '공용 강화',
    nameEn: 'General Enhancement',
    description: '적군이 받는 피해가 최종적으로 20% 증가되고, 적군이 받는 일반 공격 피해가 최종적으로 20% 증가된다',
    descriptionEn: 'Enemies take 20% more total DMG. Enemies take 20% more total Basic Attack DMG.',
    iconUrl: '/circuits/T_Iconpropertyredattack_UI.webp'
  }
]

// 3.8 특이점 확장 회로 버프 목록 (Tower 18 / S2 단계4)
export const CIRCUIT_BUFFS_3_8: CircuitBuff[] = [
  {
    id: 'T_Iconpropertyredice_UI',
    name: '이상 효과 강화',
    nameEn: 'Enhancement: Negative Status',
    description: '캐릭터가 이상 효과 추가 시, 목표가 받는 피해를 최종적으로 25% 증가시키고, 30초간 지속된다.\n적군이 받는 서리 효과의 피해가 최종적으로 80% 증가된다',
    descriptionEn: 'When inflicted with Negative Statuses, the target\'s total DMG taken is increased by 25% for 30s. Enemies take 80% more total Glacio Chafe DMG.',
    iconUrl: '/circuits/T_Iconpropertyredice_UI.webp'
  },
  {
    id: 'T_Iconpropertyredphysics_UI',
    name: '기본 피해 강화',
    nameEn: 'Basic DMG Enhancement',
    description: '캐릭터가 실드 획득 시, 피해가 최종적으로 25% 증가되고, 2초간 지속된다.\n에코 어빌리티 피해가 최종적으로 65% 증가된다.\n캐릭터가 합일 대응 시, 입히는 피해가 최종적으로 55% 증가되고, 30초간 지속된다',
    descriptionEn: 'Resonators deal 25% more total DMG for 2s upon gaining a Shield.\nTotal Echo Skill DMG is increased by 65%.\nWhen a Resonator triggers Unison Response, they deal 55% more total DMG for 30s.',
    iconUrl: '/circuits/T_Iconpropertyredphysics_UI.webp'
  },
  {
    id: 'T_Iconpropertyredcrit_UI',
    name: '조화도 파괴 강화',
    nameEn: 'Enhancement: Tune Break',
    description: '캐릭터가 조화도 · 이탈 추가 시, 파티 내 모든 캐릭터의 피해가 최종적으로 25% 증가되고, 30초간 지속된다.\n캐릭터가 조화 파동 피해를 입힌 후, 입히는 피해가 최종적으로 30% 증가되고, 30초간 지속된다',
    descriptionEn: 'Inflicting Tunability - Shifting increases the total DMG dealt by all Resonators in the team by 25% for 30s.\nDealing Tune Rupture DMG increases the total DMG dealt by the Resonator by 30% for 30s.',
    iconUrl: '/circuits/T_Iconpropertyredcrit_UI.webp'
  },
  {
    id: 'T_Iconpropertyredattack_UI',
    name: '공용 강화',
    nameEn: 'General Enhancement',
    description: '적군이 받는 피해를 최종적으로 20% 증가되고, 받는 공명 해방 피해가 최종적으로 20% 증가된다',
    descriptionEn: 'Enemies take 20% more total DMG. Enemies take 20% more total Resonance Liberation DMG.',
    iconUrl: '/circuits/T_Iconpropertyredattack_UI.webp'
  }
]

// 버전별 회로 버프 맵 (게임 버전 ↔ 특이점 확장 Tower: 3.5=12, 3.6=14, 3.7=16, 3.8=18)
export const CIRCUIT_BUFFS_BY_VERSION: Record<string, CircuitBuff[]> = {
  '3.5': CIRCUIT_BUFFS_3_5,
  '3.6': CIRCUIT_BUFFS_3_6,
  '3.7': CIRCUIT_BUFFS_3_7,
  '3.8': CIRCUIT_BUFFS_3_8
}

export interface ResolvedCircuitBuff {
  version: string
  buff: CircuitBuff
}

/** 저장 키 생성: `${version}:${buffId}` (같은 아이콘 ID를 버전마다 재사용하므로 버전을 함께 저장) */
export function toCircuitBuffKey(version: string, buffId: string): string {
  return `${version}:${buffId}`
}

/**
 * 저장 키로 회로 버프 조회.
 * - `${version}:${buffId}` 형식: 해당 버전에서만 조회
 * - 버전 없는 레거시 ID: 라이브 버전(LIVE_VERSION) → 이전 버전(최신순) → 이후(유출) 버전 순으로 조회
 *   (레거시 저장 파티는 라이브 버전 보드로 이관되므로, 유출 버전 데이터는 마지막에 찾는다)
 */
export function resolveCircuitBuff(key: string | null | undefined): ResolvedCircuitBuff | null {
  if (!key) return null

  const sepIdx = key.indexOf(':')
  if (sepIdx !== -1) {
    const version = key.slice(0, sepIdx)
    const buffId = key.slice(sepIdx + 1)
    const buff = CIRCUIT_BUFFS_BY_VERSION[version]?.find(b => b.id === buffId)
    return buff ? { version, buff } : null
  }

  const liveIdx = GAME_VERSIONS.indexOf(LIVE_VERSION)
  const searchOrder = [
    LIVE_VERSION,
    ...GAME_VERSIONS.slice(0, liveIdx).reverse(),
    ...GAME_VERSIONS.slice(liveIdx + 1)
  ]
  for (const version of searchOrder) {
    const buff = CIRCUIT_BUFFS_BY_VERSION[version]?.find(b => b.id === key)
    if (buff) return { version, buff }
  }
  return null
}
