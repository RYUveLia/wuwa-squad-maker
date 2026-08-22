import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DroppableSquadSlot } from './DroppableSquadSlot'
import type { Character } from '../types'

interface SortableSquadRowProps {
  id: string
  squadIdx: number
  squad: (Character | null)[]
  squadsLength: number
  handleRemoveCharacter: (squadIdx: number, slotIdx: number) => void
  handleDeleteSquad: (squadIdx: number) => void
  onSlotClick?: (squadIdx: number, slotIdx: number) => void
}

export function SortableSquadRow({
  id,
  squadIdx,
  squad,
  squadsLength,
  handleRemoveCharacter,
  handleDeleteSquad,
  onSlotClick
}: SortableSquadRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : ('auto' as const),
  }
  const numStr = String(squadIdx + 1).padStart(2, '0')

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

      {/* Center: Slots Row */}
      <div className={SQUAD_LIST_STYLES.slotsArea}>
        {squad.map((char, slotIdx) => {
          const slotName = String(slotIdx + 1)
          return (
            <DroppableSquadSlot
              key={slotIdx}
              id={`party-${squadIdx}-slot-${slotIdx}`}
              char={char}
              slotName={slotName}
              onRemove={() => handleRemoveCharacter(squadIdx, slotIdx)}
              squadIdx={squadIdx}
              slotIdx={slotIdx}
              onSlotClick={onSlotClick}
            />
          )
        })}
      </div>

      {/* Right: Actions */}
      <div className={SQUAD_LIST_STYLES.actionArea}>
        {squadsLength > 1 && (
          <button
            onClick={() => handleDeleteSquad(squadIdx)}
            className={SQUAD_LIST_STYLES.deleteBtn}
            title="파티 제거"
          >
            제거
          </button>
        )}
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
