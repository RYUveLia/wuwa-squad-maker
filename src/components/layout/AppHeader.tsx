import { LEAK_VERSIONS } from '../../constants/versions'
import { getDoubleDeploymentNamesText, getSeasonBuffInfo } from '../../utils/character'

interface AppHeaderProps {
  currentVersion: string
  versions: string[]
  onSelectVersion: (version: string) => void
}

/** 상단 제목, 2회 출전 규칙 안내, 버전 선택 (버전별로 파티·도감·시즌 버프·회로 버프가 분리됨) */
export function AppHeader({ currentVersion, versions, onSelectVersion }: AppHeaderProps) {
  const seasonBuffInfo = getSeasonBuffInfo(currentVersion)

  return (
    <header className={HEADER_STYLES.container}>
      <h1 className={HEADER_STYLES.title}>WuWa Matrix Squad Maker</h1>
      <p className={HEADER_STYLES.description}>
        명조: 워더링 웨이브 종말 매트릭스 다중 파티 구성 시뮬레이터 <br className="hidden sm:inline" />
        일부 공명자<span className="text-amber-400 font-semibold">{getDoubleDeploymentNamesText(currentVersion)}</span>
        {seasonBuffInfo.character ? (
          <> 및 <span className="text-amber-400 font-bold">{seasonBuffInfo.version} 시즌 버프 대상인 {seasonBuffInfo.character.name}</span>는</>
        ) : (
          '는'
        )} <br className="hidden sm:inline" />
        최대 2회까지 중복 편성이 허용됩니다.
      </p>

      <div role="tablist" aria-label="게임 버전 선택" className={HEADER_STYLES.versionBar}>
        {versions.map((version) => {
          const isActive = version === currentVersion
          return (
            <button
              key={version}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectVersion(version)}
              className={HEADER_STYLES.versionBtn(isActive)}
            >
              {version}
              {LEAK_VERSIONS.includes(version) && <span className={HEADER_STYLES.versionLeakTag(isActive)}>유출</span>}
            </button>
          )
        })}
      </div>
    </header>
  )
}

const HEADER_STYLES = {
  container: 'text-center mb-8 max-w-4xl select-none mx-auto px-2',
  title: 'text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm',
  description: 'text-zinc-400 mt-2 text-sm md:text-base leading-relaxed break-keep',
  versionBar: 'mt-3 flex flex-wrap items-center justify-center gap-1.5',
  versionBtn: (active: boolean) =>
    `px-3 py-1 rounded-lg text-xs sm:text-sm font-bold border transition-colors cursor-pointer select-none ${
      active
        ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-[0_0_10px_rgba(251,189,35,0.3)]'
        : 'bg-[#14141a] text-zinc-400 border-[#262630] hover:text-zinc-200 hover:border-zinc-600'
    }`,
  versionLeakTag: (active: boolean) =>
    `ml-1 text-[9px] sm:text-[10px] font-extrabold ${active ? 'text-zinc-800' : 'text-amber-500/80'}`
}
