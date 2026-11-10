import { COMMON_STYLES } from '../../styles/theme'
import { ELEMENT_KR_MAP } from '../../constants'
import { getSeasonBuffInfo } from '../../utils/character'
import type { SquadState } from '../../hooks/useSquadState'
import { DraggableCharacterCard } from '../DraggableCharacterCard'
import { DroppableCharacterPool } from '../DroppableCharacterPool'

/** 왼쪽 공명자 도감 패널 (데스크톱 전용, 모바일은 ResonatorSelectModal 사용) */
export function ResonatorPoolPanel({ state, className }: { state: SquadState; className: string }) {
  const { boards, editor, pool, ui } = state
  const seasonBuffInfo = getSeasonBuffInfo(boards.currentVersion)

  return (
    <section className={`${className} hidden lg:flex`}>
      <div className={POOL_STYLES.header}>
        <div className={POOL_STYLES.titleArea}>
          <h3 className={POOL_STYLES.title}>공명자 도감 ({pool.filteredCharacters.length})</h3>
          <span className={POOL_STYLES.subtitle}>
            최신순 정렬
            {seasonBuffInfo.character ? ` (${seasonBuffInfo.character.name}는 ${seasonBuffInfo.version} 시즌 임시 2회 적용)` : ''}
          </span>
        </div>

        {/* Element Filter */}
        <div className={POOL_STYLES.filterBar}>
          {pool.elements.map((elem) => (
            <button
              key={elem}
              onClick={() => pool.setSelectedElement(elem)}
              className={POOL_STYLES.filterButton(pool.selectedElement === elem)}
            >
              {ELEMENT_KR_MAP[elem] || elem}
            </button>
          ))}
        </div>

        {/* Owned Resonators Filtering bar */}
        <div className={POOL_STYLES.ownedFilterBar}>
          <button onClick={() => ui.setOwnedModalOpen(true)} className={POOL_STYLES.ownedSettingsBtn}>
            ⚙️ 보유 공명자 설정
          </button>
          <div className="flex items-center gap-3.5">
            <label className={POOL_STYLES.ownedFilterLabel}>
              <input
                type="checkbox"
                checked={pool.hideMaxedOut}
                onChange={(e) => pool.setHideMaxedOut(e.target.checked)}
                className={POOL_STYLES.ownedCheckbox}
              />
              배치 완료 숨기기
            </label>
          </div>
        </div>
      </div>

      <DroppableCharacterPool>
        {pool.filteredCharacters.map((char) => (
          <DraggableCharacterCard
            key={char.id}
            char={char}
            assignedSquadIndices={editor.assignedSquadIndicesOf(char.id)}
            isMaxedOut={editor.isMaxed(char.id)}
            maxAllowed={editor.limitOf(char.id)}
            onClick={() => editor.toggleCharacter(char)}
            isSeasonBuff={seasonBuffInfo.character?.id === char.id}
          />
        ))}
      </DroppableCharacterPool>
    </section>
  )
}

const POOL_STYLES = {
  header: 'flex flex-col gap-4 select-none flex-shrink-0',
  titleArea: 'flex items-baseline justify-between',
  title: 'text-base md:text-lg font-bold text-zinc-200',
  subtitle: 'text-xs text-zinc-500',
  filterBar: 'flex flex-wrap gap-1 bg-[#14141a] p-1 rounded-lg border border-[#262630]',
  filterButton: (isActive: boolean) =>
    `px-3 py-1 text-xs md:text-sm font-bold rounded-md transition-all duration-200 cursor-pointer ${
      isActive ? 'bg-amber-400 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
    }`,
  ownedFilterBar: 'flex items-center justify-between px-1.5 py-1 mb-3.5 select-none bg-[#14141a]/40 border border-[#262630] rounded-xl',
  ownedSettingsBtn: COMMON_STYLES.subBtn,
  ownedFilterLabel: COMMON_STYLES.checkboxLabel,
  ownedCheckbox: COMMON_STYLES.checkboxInput
}
