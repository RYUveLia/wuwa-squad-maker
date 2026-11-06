// 게임 버전별 편성 보드 설정
// - 파티 목록, 공명자 도감(출시 버전 기준), 2회 출전 시즌 버프, 회로 버프가 모두 선택된 버전을 따른다.

/** 지원하는 게임 버전 (오래된 순). 회로 버프(CIRCUIT_BUFFS_BY_VERSION)와 시즌 버프 맵도 같은 키를 사용한다 */
export const GAME_VERSIONS: string[] = ['3.5', '3.6', '3.7', '3.8']

/** 현재 라이브 버전. 버전 정보가 없는 기존 저장 파티/레거시 회로 ID는 이 버전으로 간주한다 */
export const LIVE_VERSION = '3.7'

/** 유출(미출시) 버전. 버전 선택에 '유출' 표시, 레거시 데이터 버전 추천 시 마지막 순위 */
export const LEAK_VERSIONS: string[] = ['3.8']

/** 버전별 2회 출전 시즌 버프(추가 피로도) 대상 공명자 ID. 미정이면 null */
export const SEASON_BUFF_CHARACTER_BY_VERSION: Record<string, string | null> = {
  '3.5': 'chisa',
  '3.6': 'denia',
  '3.7': 'lynae',
  '3.8': 'lucilla'
}

/** '3.5' → 35 처럼 버전을 정수로 변환 (부동소수 비교 오차 방지) */
export function versionToNumber(version: string | number): number {
  return Math.floor(Number(version) * 10 + 1e-6)
}
