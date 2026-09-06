export interface CircuitBuff {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  iconUrl: string
}

// 3.6 버전 특이점 확장 회로 버프 목록
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

// 3.7 유출/신규 버전 특이점 확장 회로 버프 목록 (Tower 16 / S2 단계3)
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
    description: '캐릭터가 실드 획득 시, 피해가 최종적으로 25% 증가되고, 2초간 지속된다.\n에코 어빌리티 피해가 최종적으로 40% 증가된다.\n캐릭터가 합일 대응 시, 입히는 피해가 최종적으로 55% 증가되고, 15초간 지속된다',
    descriptionEn: 'Resonators deal 25% more total DMG for 2s upon obtaining a Shield.\nTotal Echo Skill DMG is increased by 40%.\nWhen a Resonator triggers Unison Response, they deal 55% more total DMG for 15s.',
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

// 버전별 회로 버프 맵
export const CIRCUIT_BUFFS_BY_VERSION: Record<string, CircuitBuff[]> = {
  '3.6': CIRCUIT_BUFFS_3_6,
  '3.7': CIRCUIT_BUFFS_3_7
}

/** 현재 활성화된 설정(유출 여부 등)에 따른 회로 버프 목록 반환 */
export function getCircuitBuffs(showLeakInfo: boolean = false): CircuitBuff[] {
  return showLeakInfo ? CIRCUIT_BUFFS_3_7 : CIRCUIT_BUFFS_3_6
}

/** 특정 버프 ID로 회로 버프 객체 조회 (유출 모드 우선 검색 후 이전 버전 목록 fallback 지원) */
export function findCircuitBuffById(buffId: string | null | undefined, showLeakInfo: boolean = false): CircuitBuff | null {
  if (!buffId) return null
  const currentBuffs = getCircuitBuffs(showLeakInfo)
  const found = currentBuffs.find(b => b.id === buffId)
  if (found) return found

  for (const list of Object.values(CIRCUIT_BUFFS_BY_VERSION)) {
    const fallback = list.find(b => b.id === buffId)
    if (fallback) return fallback
  }
  return null
}

// 하위 호환용 기본 export
export const CIRCUIT_BUFFS: CircuitBuff[] = CIRCUIT_BUFFS_3_6
