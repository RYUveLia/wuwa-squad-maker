export interface CircuitBuff {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  iconUrl: string
}

export const CIRCUIT_BUFFS: CircuitBuff[] = [
  {
    id: 'T_Iconpropertyredice_UI',
    name: '이상 효과 강화',
    nameEn: 'Enhancement: Negative Status',
    description: '캐릭터가 이상 효과 추가 시, 목표가 받는 피해를 최종적으로 25% 증가시키고, 30초간 지속된다.\n적군이 받는 서리 효과의 피해가 최종적으로 80% 증가된다.',
    descriptionEn: 'When inflicted with Negative Statuses, the target\'s total DMG taken is increased by 25% for 30s. Enemies take 80% more total Glacio Chafe DMG.',
    iconUrl: 'https://static.nanoka.cc/assets/ww/UIResources/Common/Image/IconAttribute/T_Iconpropertyredice_UI.webp'
  },
  {
    id: 'T_IconpropertyLuokekeBuff1_UI',
    name: '에코 어빌리티 강화',
    nameEn: 'Enhancement: Echo Skill',
    description: '아군 에코 어빌리티의 피해가 최종적으로 30% 증가되고, 인멸 피해가 최종적으로 20% 증가되며, 공명 스킬 피해가 최종적으로 20% 증가된다.',
    descriptionEn: 'Total Echo Skill DMG is increased by 30%. Total Havoc DMG is increased by 20%. Total Resonance Skill DMG is increased by 20%.',
    iconUrl: 'https://static.nanoka.cc/assets/ww/UIResources/Common/Image/IconAttribute/T_IconpropertyLuokekeBuff1_UI.webp'
  },
  {
    id: 'T_Iconpropertyredcrit_UI',
    name: '조화도 파괴 강화',
    nameEn: 'Enhancement: Tune Break',
    description: '캐릭터가 조화도 · 이탈 상태 추가 시, 파티 전체의 피해가 최종적으로 25% 증가되며, 30초간 지속된다. 캐릭터가 조화 밀집 · 이탈 상태 추가 시, 피해가 최종적으로 30% 증가되며, 15초간 지속된다.',
    descriptionEn: 'When a Resonator inflicts Tunability - Shifting, the total DMG dealt by all Resonators in the team is increased by 25% for 30s. When a Resonator inflicts Tune Strain - Shifting, their total DMG is increased by 30% for 15s.',
    iconUrl: 'https://static.nanoka.cc/assets/ww/UIResources/Common/Image/IconAttribute/T_Iconpropertyredcrit_UI.webp'
  },
  {
    id: 'T_Iconpropertyredattack_UI',
    name: '공용 강화',
    nameEn: 'General Enhancement',
    description: '적군이 받는 피해가 최종적으로 20% 증가되고, 적군이 받는 강공격 피해가 최종적으로 20% 증가된다.',
    descriptionEn: 'Enemies take 20% more total DMG. Enemies take 20% more total Heavy Attack DMG.',
    iconUrl: 'https://static.nanoka.cc/assets/ww/UIResources/Common/Image/IconAttribute/T_Iconpropertyredattack_UI.webp'
  }
]
