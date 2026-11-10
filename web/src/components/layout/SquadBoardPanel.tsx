import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { SquadState } from '../../hooks/useSquadState'
import { SortableSquadRow } from '../SortableSquadRow'

/** 모바일(lg 미만)에서는 슬롯 클릭 시 공명자 선택 시트를 연다 */
const MOBILE_BREAKPOINT_PX = 1024

/** 오른쪽 파티 편성 패널: 툴바(초기화·이미지·내보내기·불러오기) + 파티 목록 + 파티 추가 */
export function SquadBoardPanel({ state, className }: { state: SquadState; className: string }) {
  const { boards, editor, transfer, ui } = state
  const { squads, squadIds, circuitBuffs, currentVersion } = boards

  return (
    <main className={className}>
      <div className={BOARD_STYLES.toolbar}>
        <span className={BOARD_STYLES.toolbarTitle}>{currentVersion} 파티 편성 현황</span>
        <div className={BOARD_STYLES.toolbarBtnArea}>
          <button onClick={editor.requestResetSquads} className={BOARD_STYLES.resetBtn}>
            초기화
          </button>
          <button onClick={ui.openImageExport} className={BOARD_STYLES.toolbarBtn}>
            이미지로 저장
          </button>
          <button onClick={transfer.exportCurrentBoard} className={BOARD_STYLES.toolbarBtn}>
            내보내기
          </button>
          <button onClick={() => ui.setImportModalOpen(true)} className={BOARD_STYLES.toolbarBtn}>
            불러오기
          </button>
        </div>
      </div>

      <div id="squads-container" className={BOARD_STYLES.scroller}>
        <SortableContext items={squadIds} strategy={verticalListSortingStrategy}>
          {squads.map((squad, squadIdx) => (
            <SortableSquadRow
              key={squadIds[squadIdx]}
              id={squadIds[squadIdx]}
              squadIdx={squadIdx}
              squad={squad}
              circuitBuffId={circuitBuffs[squadIdx]}
              version={currentVersion}
              handleRemoveCharacter={editor.requestRemoveCharacter}
              handleDeleteSquad={editor.requestDeleteSquad}
              onSlotClick={(sIdx) => {
                if (window.innerWidth < MOBILE_BREAKPOINT_PX) ui.setMobileSquadIdx(sIdx)
              }}
              onCircuitBuffClick={(idx) => ui.setCircuitModalSquadIdx(idx)}
            />
          ))}
        </SortableContext>

        <div onClick={editor.addSquad} className={BOARD_STYLES.addSquadBar} data-capture-exclude="true">
          <span className={BOARD_STYLES.addSquadPlus}>＋</span>
          <span className={BOARD_STYLES.addSquadText}>새로운 파티 추가</span>
        </div>
      </div>
    </main>
  )
}

const BOARD_STYLES = {
  toolbar: 'flex items-center justify-between bg-[#14141a]/70 border border-[#262630] p-2 sm:p-3 rounded-2xl select-none flex-shrink-0 gap-1.5 sm:gap-2',
  toolbarTitle: 'text-[11px] sm:text-xs md:text-sm font-bold text-zinc-300 px-1 whitespace-nowrap flex-shrink-0',
  toolbarBtnArea: 'flex gap-1 sm:gap-2',
  toolbarBtn: 'px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-zinc-400 hover:text-zinc-200 bg-[#14141a] hover:bg-[#1c1c24] border border-[#262630] rounded-lg cursor-pointer transition-colors whitespace-nowrap',
  resetBtn: 'px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 rounded-lg cursor-pointer transition-colors whitespace-nowrap',
  scroller: 'flex flex-col gap-4 overflow-y-visible lg:overflow-y-auto pr-1 flex-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent p-1',
  addSquadBar: 'bg-[#14141a]/30 border-2 border-dashed border-zinc-800/80 hover:border-amber-400/50 hover:bg-[#14141a]/70 rounded-2xl py-4 flex flex-row items-center justify-center cursor-pointer group transition-all duration-300 select-none flex-shrink-0 gap-2',
  addSquadPlus: 'text-xl text-zinc-500 group-hover:text-amber-400 group-hover:scale-110 transition-all duration-300',
  addSquadText: 'text-sm font-bold text-zinc-400 group-hover:text-amber-300 transition-colors'
}
