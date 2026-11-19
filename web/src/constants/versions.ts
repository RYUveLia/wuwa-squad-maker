// 게임 버전별 편성 보드 설정
// - 파티 목록, 공명자 도감(출시 버전 기준), 2회 출전 시즌 버프, 회로 버프가 모두 선택된 버전을 따른다.

/** 지원하는 게임 버전 (오래된 순). 회로 버프(CIRCUIT_BUFFS_BY_VERSION)와 시즌 버프 맵도 같은 키를 사용한다 */
export const GAME_VERSIONS: string[] = ['3.5', '3.6', '3.7', '3.8']

/**
 * 현재 라이브 버전. **라이브 전환은 이 값만 바꾸면 된다.**
 * - GAME_VERSIONS에서 이 버전보다 뒤에 있는 버전은 자동으로 유출(미출시) 버전이 된다
 * - 버전 정보가 없는 기존 저장 파티/레거시 회로 ID는 이 버전으로 간주한다
 */
export const LIVE_VERSION = '3.8'

/** 라이브 버전보다 뒤에 있는 지원 버전 = 유출(미출시) 버전 */
export function getLeakVersions(versions: string[], live: string): string[] {
  const liveIdx = versions.indexOf(live)
  return liveIdx === -1 ? [] : versions.slice(liveIdx + 1)
}

/** 버전 정보가 없는 레거시 데이터를 해석할 때 찾는 순서: 라이브 → 이전 버전(최신순) → 이후(유출) 버전 */
export function getLegacySearchOrder(versions: string[], live: string): string[] {
  const liveIdx = versions.indexOf(live)
  if (liveIdx === -1) return [...versions].reverse()
  return [live, ...versions.slice(0, liveIdx).reverse(), ...versions.slice(liveIdx + 1)]
}

/** 유출(미출시) 버전. 버전 선택에 '유출' 표시, 레거시 데이터 버전 추천 시 마지막 순위. LIVE_VERSION에서 자동 계산 */
export const LEAK_VERSIONS: string[] = getLeakVersions(GAME_VERSIONS, LIVE_VERSION)

/** 출시 버전 미정 공명자의 releaseVersion 값. 유출 버전 보드에서만 노출된다 */
export const RELEASE_UNDECIDED = 9.9

/** 출시 버전이 아직 정해지지 않은(유출 단계) 공명자인지 */
export function isReleaseUndecided(releaseVersion: number): boolean {
  return versionToNumber(releaseVersion) >= versionToNumber(RELEASE_UNDECIDED)
}

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
