import type { Character } from '../types'
import { ELEMENT_KR_MAP } from '../constants'
import { DraggableCharacterCard } from './DraggableCharacterCard'
import { COMMON_STYLES } from '../styles/theme'

interface ResonatorSelectModalProps {
  onSelect: (char: Character) => void
  onClose: () => void
  getAssignedSquadIndices: (charId: string) => number[]
  isCharacterMaxedOut: (charId: string) => boolean
  getMaxDeployment: (charId: string) => number
  filteredCharacters: Character[]
  elements: string[]
  selectedElement: string
  setSelectedElement: (elem: string) => void
  
  // Mini slots preview props
  activeSquadIdx: number
  currentSquad: (Character | null)[]
  onRemoveSlot: (slotIdx: number) => void

  // Ownership states
  onOpenOwnedSettings: () => void

  // Leak Info states
  showLeakInfo: boolean
  setShowLeakInfo: (val: boolean) => void

  // Hide Maxed Out states
  hideMaxedOut: boolean
  setHideMaxedOut: (val: boolean) => void
}

export function ResonatorSelectModal({
  onSelect,
  onClose,
  getAssignedSquadIndices,
  isCharacterMaxedOut,
  getMaxDeployment,
  filteredCharacters,
  elements,
  selectedElement,
  setSelectedElement,
  activeSquadIdx,
  currentSquad,
  onRemoveSlot,
  onOpenOwnedSettings,
  showLeakInfo,
  setShowLeakInfo,
  hideMaxedOut,
  setHideMaxedOut
}: ResonatorSelectModalProps) {
  return (
    <div className={COMMON_STYLES.modalOverlay} onClick={onClose}>
      <div
        className={`${COMMON_STYLES.modalContainer} max-w-md max-h-[75vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Mini slots preview */}
        <div className={SELECT_MODAL_STYLES.header}>
          <div className={SELECT_MODAL_STYLES.headerLeft}>
            <span className={SELECT_MODAL_STYLES.partyBadge}>
              {activeSquadIdx + 1}번 파티
            </span>
            {/* 미니 3 슬롯 */}
            <div className={SELECT_MODAL_STYLES.miniSlotsArea}>
              {currentSquad.map((slotChar, idx) => (
                <div 
                  key={idx} 
                  className={SELECT_MODAL_STYLES.miniSlot(!!slotChar)}
                  onClick={() => slotChar && onRemoveSlot(idx)}
                >
                  {slotChar ? (
                    <>
                      <img
                        src={slotChar.img}
                        alt={slotChar.name}
                        className={SELECT_MODAL_STYLES.miniSlotImg}
                      />
                      <div className={SELECT_MODAL_STYLES.miniSlotRemoveOverlay}>
                        <span className={SELECT_MODAL_STYLES.miniSlotRemoveText}>✕</span>
                      </div>
                    </>
                  ) : (
                    <span className={SELECT_MODAL_STYLES.miniSlotEmptyText}>{idx + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className={SELECT_MODAL_STYLES.doneBtn}
          >
            편성 완료
          </button>
        </div>

        {/* Element Filter */}
        <div className={SELECT_MODAL_STYLES.filterBar}>
          {elements.map((elem) => (
            <button
              key={elem}
              onClick={() => setSelectedElement(elem)}
              className={SELECT_MODAL_STYLES.filterBtn(selectedElement === elem)}
            >
              {ELEMENT_KR_MAP[elem] || elem}
            </button>
          ))}
        </div>

        {/* Owned & Leak Toggle inside Modal */}
        <div className={SELECT_MODAL_STYLES.ownedFilterArea}>
          <button
            onClick={onOpenOwnedSettings}
            className={SELECT_MODAL_STYLES.ownedModalTrigger}
          >
            ⚙️ 보유 설정
          </button>
          
          <div className="flex items-center gap-3">
            <label className={SELECT_MODAL_STYLES.ownedLabel}>
              <input
                type="checkbox"
                checked={hideMaxedOut}
                onChange={(e) => setHideMaxedOut(e.target.checked)}
                className={SELECT_MODAL_STYLES.ownedCheckbox}
              />
              완료 숨기기
            </label>

            {/* Leak Filter Toggle Button */}
            <div className="flex items-center gap-1.5 border-l border-slate-800/80 pl-2.5">
              <span className="text-[10px] font-semibold text-slate-400 select-none">유출</span>
              <button
                role="switch"
                aria-checked={showLeakInfo}
                onClick={() => setShowLeakInfo(!showLeakInfo)}
                className={`relative inline-flex h-5 w-8.5 shrink-0 cursor-pointer rounded-full items-center transition-colors duration-200 ease-in-out focus:outline-none select-none border border-slate-700/60 ${
                  showLeakInfo 
                    ? 'bg-purple-600/90 shadow-[0_0_8px_rgba(168,85,247,0.35)]' 
                    : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full shadow ring-0 transition-all duration-200 ease-in-out ${
                    showLeakInfo ? 'translate-x-4 bg-white' : 'translate-x-0.5 bg-slate-400'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Characters Scroller */}
        <div className={SELECT_MODAL_STYLES.scroller}>
          {filteredCharacters.map((char) => {
            const assignedSquadIndices = getAssignedSquadIndices(char.id)
            const maxAllowed = getMaxDeployment(char.id)
            const isMaxedOut = isCharacterMaxedOut(char.id)

            return (
              <DraggableCharacterCard
                key={char.id}
                char={char}
                assignedSquadIndices={assignedSquadIndices}
                isMaxedOut={isMaxedOut}
                maxAllowed={maxAllowed}
                onClick={() => onSelect(char)}
                isDraggable={false}
                isSeasonBuff={char.id === (showLeakInfo ? 'denia' : 'chisa')}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// STYLES (App.tsx Colocation Style Pattern 기조 통일)
const SELECT_MODAL_STYLES = {
  header: 'flex items-center justify-between mb-2.5 flex-shrink-0 bg-slate-900/30 p-2 rounded-xl border border-slate-800/40',
  headerLeft: 'flex items-center gap-2',
  partyBadge: 'text-[10px] font-black font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40 select-none',
  miniSlotsArea: 'flex gap-1.5 select-none',
  miniSlot: (isAssigned: boolean) => `w-8 h-8 rounded-lg overflow-hidden border flex items-center justify-center relative group cursor-pointer transition-all ${
    isAssigned ? 'border-purple-500 bg-slate-900 shadow-md shadow-purple-950/20' : 'border-dashed border-slate-800 bg-slate-950/30'
  }`,
  miniSlotImg: 'w-full h-full object-cover',
  miniSlotRemoveOverlay: 'absolute inset-0 bg-rose-950/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity',
  miniSlotRemoveText: 'text-[10px] font-black text-rose-400',
  miniSlotEmptyText: 'text-[10px] text-slate-700 font-bold',
  doneBtn: 'text-[10px] sm:text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 border border-purple-500/40 px-3.5 py-1.5 rounded-lg cursor-pointer shadow-md active:scale-95 transition-all',
  filterBar: 'flex flex-wrap justify-center gap-1 bg-slate-900/40 p-1 rounded-lg border border-slate-800/40 mb-2 flex-shrink-0',
  filterBtn: (isActive: boolean) => `px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
    isActive ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
  }`,
  ownedFilterArea: 'flex justify-between items-center px-1 mb-2.5 select-none flex-shrink-0',
  ownedModalTrigger: COMMON_STYLES.subBtn,
  ownedLabel: COMMON_STYLES.checkboxLabel,
  ownedCheckbox: COMMON_STYLES.checkboxInput,
  scroller: 'grid grid-cols-4 gap-1.5 justify-items-center overflow-y-auto flex-1 pr-1 pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent'
}
