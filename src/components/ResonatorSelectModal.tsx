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
  setSelectedElement
}: ResonatorSelectModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-slate-950/95 border border-slate-800/80 rounded-2xl p-4 w-full max-w-md max-h-[75vh] flex flex-col shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5 flex-shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100">공명자 선택</h3>
            <p className="text-[9.5px] sm:text-[10px] text-slate-500 mt-0.5">터치하여 파티에 바로 배치합니다.</p>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] sm:text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg cursor-pointer"
          >
            닫기
          </button>
        </div>

        {/* Element Filter */}
        <div className="flex flex-wrap justify-center gap-1 bg-slate-900/40 p-1 rounded-lg border border-slate-800/40 mb-2.5 flex-shrink-0">
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

        {/* Characters Scroller */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5 justify-items-center overflow-y-auto flex-1 pr-1 pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
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
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
