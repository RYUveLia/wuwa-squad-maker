import type { Character } from '../types'
import { ELEMENT_KR_MAP } from '../constants'
import { DraggableCharacterCard } from './DraggableCharacterCard'

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
  showOnlyOwned: boolean
  setShowOnlyOwned: (val: boolean) => void
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
  showOnlyOwned,
  setShowOnlyOwned
}: ResonatorSelectModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-slate-950/95 border border-slate-800/80 rounded-2xl p-4 w-full max-w-md max-h-[75vh] flex flex-col shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Mini slots preview */}
        <div className="flex items-center justify-between mb-2.5 flex-shrink-0 bg-slate-900/30 p-2 rounded-xl border border-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40 select-none">
              {activeSquadIdx + 1}번 파티
            </span>
            {/* 미니 3 슬롯 */}
            <div className="flex gap-1.5 select-none">
              {currentSquad.map((slotChar, idx) => (
                <div 
                  key={idx} 
                  className={`w-8 h-8 rounded-lg overflow-hidden border flex items-center justify-center relative group cursor-pointer transition-all ${
                    slotChar ? 'border-purple-500 bg-slate-900 shadow-md shadow-purple-950/20' : 'border-dashed border-slate-800 bg-slate-950/30'
                  }`}
                  onClick={() => slotChar && onRemoveSlot(idx)}
                >
                  {slotChar ? (
                    <>
                      <img src={slotChar.img} alt={slotChar.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-rose-950/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-black text-rose-400">✕</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-700 font-bold">{idx + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] sm:text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 border border-purple-500/40 px-3.5 py-1.5 rounded-lg cursor-pointer shadow-md active:scale-95 transition-all"
          >
            편성 완료
          </button>
        </div>

        {/* Element Filter */}
        <div className="flex flex-wrap justify-center gap-1 bg-slate-900/40 p-1 rounded-lg border border-slate-800/40 mb-2 flex-shrink-0">
          {elements.map((elem) => (
            <button
              key={elem}
              onClick={() => setSelectedElement(elem)}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                selectedElement === elem
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ELEMENT_KR_MAP[elem] || elem}
            </button>
          ))}
        </div>

        {/* Owned Toggle inside Modal */}
        <div className="flex justify-end px-1 mb-2.5 select-none flex-shrink-0">
          <label className="flex items-center gap-1.5 cursor-pointer text-[10.5px] sm:text-xs text-slate-400 font-bold hover:text-slate-300">
            <input
              type="checkbox"
              checked={showOnlyOwned}
              onChange={(e) => setShowOnlyOwned(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            보유한 공명자만 보기
          </label>
        </div>

        {/* Characters Scroller */}
        <div className="grid grid-cols-4 gap-1.5 justify-items-center overflow-y-auto flex-1 pr-1 pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
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
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
