import { useDroppable, useDraggable } from '@dnd-kit/core'
import type { Character } from '../types'

interface DraggableSquadCharacterProps {
  char: Character
  squadIdx: number
  slotIdx: number
  onRemove: () => void
}

function DraggableSquadCharacter({
  char,
  squadIdx,
  slotIdx,
  onRemove
}: DraggableSquadCharacterProps) {
  const draggableId = `squad-char-${squadIdx}-${slotIdx}`
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    data: { char, squadIdx, slotIdx }
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 60,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation()
        onRemove()
      }}
      className={CHAR_WRAPPER_CLASS(isDragging)}
    >
      <img
        src={char.img}
        alt={char.name}
        className={CHAR_IMAGE_CLASS}
        draggable="false"
      />
    </div>
  )
}

interface DroppableSquadSlotProps {
  id: string
  char: Character | null
  slotName: string
  onRemove: () => void
  squadIdx: number
  slotIdx: number
  onSlotClick?: (squadIdx: number, slotIdx: number) => void
}

export function DroppableSquadSlot({
  id,
  char,
  slotName,
  onRemove,
  squadIdx,
  slotIdx,
  onSlotClick
}: DroppableSquadSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  })

  return (
    <div
      ref={setNodeRef}
      className={SLOT_BOX_CLASS(isOver)}
      onClick={() => {
        if (!char && onSlotClick) {
          onSlotClick(squadIdx, slotIdx)
        }
      }}
    >
      {char ? (
        <DraggableSquadCharacter
          char={char}
          squadIdx={squadIdx}
          slotIdx={slotIdx}
          onRemove={onRemove}
        />
      ) : (
        <div className={EMPTY_AREA_CLASS}>
          <span className={PLUS_ICON_CLASS(isOver)}>
            ＋
          </span>
          <span className={SLOT_LABEL_CLASS(isOver)}>
            {slotName}
          </span>
        </div>
      )}
    </div>
  )
}

// STYLES
const SLOT_BOX_CLASS = (isOver: boolean) => {
  const borderClass = isOver 
    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/5' 
    : 'border-dashed border-slate-800 bg-slate-950/80 hover:border-slate-700/80'
  return `w-14 h-14 sm:w-20 sm:h-20 lg:w-[100px] lg:h-[100px] xl:w-[110px] xl:h-[110px] aspect-square rounded-lg sm:rounded-2xl flex flex-col items-center justify-center p-1 sm:p-1.5 md:p-2 relative group transition-all duration-300 border-2 ${borderClass}`
}

const CHAR_WRAPPER_CLASS = (isDragging: boolean) => `w-full h-full flex flex-col items-center justify-center relative cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform duration-200 select-none ${
  isDragging ? 'opacity-30' : ''
}`

const CHAR_IMAGE_CLASS = 'w-full h-full object-cover rounded-lg sm:rounded-xl shadow-md'
const EMPTY_AREA_CLASS = 'text-center text-slate-500 select-none'
const PLUS_ICON_CLASS = (isOver: boolean) => `text-base sm:text-2xl lg:text-3xl block leading-none transition-transform duration-300 ${
  isOver ? 'text-purple-400 scale-125' : 'text-slate-600 group-hover:text-slate-400'
}`
const SLOT_LABEL_CLASS = (isOver: boolean) => `text-[9px] sm:text-xs lg:text-sm font-bold block mt-0.5 sm:mt-1 transition-colors duration-300 ${
  isOver ? 'text-purple-300' : 'text-slate-600 group-hover:text-slate-400'
}`
