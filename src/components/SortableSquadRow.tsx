import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DroppableSquadSlot } from './DroppableSquadSlot'
import type { Character } from '../types'
import { CIRCUIT_BUFFS } from '../constants/circuitBuffs'

interface SortableSquadRowProps {
  id: string
  squadIdx: number
  squad: (Character | null)[]
  circuitBuffId?: string | null
  handleRemoveCharacter: (squadIdx: number, slotIdx: number) => void
  handleDeleteSquad: (squadIdx: number) => void
  onSlotClick?: (squadIdx: number, slotIdx: number) => void
  onCircuitBuffClick?: (squadIdx: number) => void
}

export function SortableSquadRow({
  id,
  squadIdx,
  squad,
  circuitBuffId,
  handleRemoveCharacter,
  handleDeleteSquad,
  onSlotClick,
  onCircuitBuffClick
}: SortableSquadRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : ('auto' as const),
  }
  const numStr = String(squadIdx + 1).padStart(2, '0')
  const selectedBuff = circuitBuffId ? CIRCUIT_BUFFS.find(b => b.id === circuitBuffId) : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={SQUAD_LIST_STYLES.row}
      data-capture-exclude={squad.every(char => char === null) ? 'true' : 'false'}
    >
      {/* Left: Drag Handle + Number */}
      <div className={SQUAD_LIST_STYLES.numberBadgeArea}>
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-amber-400 transition-colors text-lg md:text-xl select-none touch-none"
          title="드래그하여 순서 변경"
        >
          ☰
        </span>
        <span className={SQUAD_LIST_STYLES.numberText}>
          {numStr}
        </span>
      </div>

      {/* Center: Slots Row + Circuit Buff */}
      <div className={SQUAD_LIST_STYLES.slotsArea}>
        {squad.map((char, slotIdx) => (
          <DroppableSquadSlot
            key={slotIdx}
            id={`party-${squadIdx}-slot-${slotIdx}`}
            char={char}
            onRemove={() => handleRemoveCharacter(squadIdx, slotIdx)}
            squadIdx={squadIdx}
            slotIdx={slotIdx}
            onSlotClick={onSlotClick}
          />
        ))}

        {/* Circuit Buff Slot (Always available) */}
        <div className="flex items-center justify-center pl-1 sm:pl-2 border-l border-[#262630]/80">
          <button
            type="button"
            onClick={() => onCircuitBuffClick && onCircuitBuffClick(squadIdx)}
            className={`w-14 h-14 sm:w-20 sm:h-20 lg:w-[88px] lg:h-[88px] rounded-lg sm:rounded-2xl flex flex-col items-center justify-center p-1 sm:p-1.5 transition-all duration-200 cursor-pointer group relative bg-[#0e0e13] ${
              selectedBuff 
                ? 'border border-solid border-[#262630] hover:border-zinc-500' 
                : 'border border-dashed border-[#262630] hover:border-zinc-500'
            }`}
            title={selectedBuff ? `특이점 확장 회로 버프: ${selectedBuff.name}` : '회로 버프 선택'}
          >
            {selectedBuff ? (
              <div className="w-full h-full flex items-center justify-center p-0.5 sm:p-1">
                <img
                  src={selectedBuff.iconUrl}
                  alt={selectedBuff.name}
                  className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-500 group-hover:text-amber-400 transition-colors select-none gap-0.5 sm:gap-1">
                <img
                  src="/circuits/T_Iconpropertyredattack_UI.webp"
                  alt="회로 선택"
                  className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 object-contain opacity-40 group-hover:opacity-90 group-hover:scale-110 transition-all"
                />
                <span className="text-[7.5px] sm:text-[9px] font-bold tracking-tighter whitespace-nowrap">
                  회로 선택
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className={SQUAD_LIST_STYLES.actionArea}>
        <button
          onClick={() => handleDeleteSquad(squadIdx)}
          className={SQUAD_LIST_STYLES.deleteBtn}
          title="파티 제거"
        >
          제거
        </button>
      </div>
    </div>
  )
}

const SQUAD_LIST_STYLES = {
  row: 'bg-transparent lg:bg-[#14141a]/70 border-b border-zinc-900 lg:border lg:border-[#262630] rounded-none lg:rounded-2xl p-1 sm:p-3.5 lg:p-5 shadow-none lg:shadow-md flex flex-row items-center justify-between gap-1 sm:gap-3 lg:gap-5 animate-scale-up select-none',
  numberBadgeArea: 'flex items-center gap-1 sm:gap-2 lg:gap-4 select-none flex-shrink-0',
  numberText: 'text-lg sm:text-2xl lg:text-4xl font-black font-mono text-zinc-500 tracking-wider',
  slotsArea: 'flex flex-row gap-1 sm:gap-3 lg:gap-4 flex-1 justify-center max-w-xl',
  actionArea: 'flex items-center justify-end select-none flex-shrink-0 min-w-[36px] sm:min-w-[48px]',
  deleteBtn: 'text-[9.5px] sm:text-[11px] lg:text-[12px] font-bold text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 px-2 sm:px-2.5 py-1 rounded-lg cursor-pointer transition-colors whitespace-nowrap',
}

