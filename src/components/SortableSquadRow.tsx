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
}

export function SortableSquadRow({
  id,
  squadIdx,
  squad,
  squadsLength,
  handleRemoveCharacter,
  handleDeleteSquad
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
    <div ref={setNodeRef} style={style} className={SQUAD_LIST_STYLES.row}>
      {/* Left: Drag Handle + Number */}
      <div className={SQUAD_LIST_STYLES.numberBadgeArea}>
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-purple-400 transition-colors text-lg md:text-xl select-none touch-none"
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
            />
          )
        })}
      </div>

      {/* Right: Actions */}
      <div className={SQUAD_LIST_STYLES.actionArea}>
        <span className={SQUAD_LIST_STYLES.squadLabel}>
          {squadIdx + 1}번 파티
        </span>
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
  row: 'bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3 md:p-4 backdrop-blur-md shadow-md flex flex-row items-center justify-between gap-2 md:gap-4 animate-scale-up select-none',
  numberBadgeArea: 'flex items-center gap-1.5 md:gap-3 select-none flex-shrink-0',
  numberText: 'text-xl md:text-3xl font-black font-mono text-slate-500 tracking-wider',
  slotsArea: 'flex flex-row gap-1.5 sm:gap-3 flex-1 justify-center max-w-md',
  actionArea: 'flex flex-col items-end gap-1.5 select-none flex-shrink-0 min-w-[70px] sm:min-w-[85px]',
  squadLabel: 'text-[10px] md:text-xs font-bold px-2 py-0.5 rounded border tracking-wide uppercase text-purple-400 bg-purple-950/20 border-purple-900/50',
  deleteBtn: 'text-[10px] md:text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 rounded cursor-pointer transition-colors mt-1',
}
