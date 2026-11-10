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
  slotName?: string
  onRemove: () => void
  squadIdx: number
  slotIdx: number
  onSlotClick?: (squadIdx: number, slotIdx: number) => void
}

export function DroppableSquadSlot({
  id,
  char,
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
      className={SLOT_BOX_CLASS(isOver, char)}
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
        <div className="w-full h-full flex items-center justify-center select-none">
          <img
            src="/SP_FuncIconRole.webp"
            alt="공명자 슬롯"
            className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 object-contain transition-all duration-300 pointer-events-none ${
              isOver ? 'opacity-80 scale-110' : 'opacity-25 group-hover:opacity-50'
            }`}
          />
        </div>
      )}
    </div>
  )
}

// STYLES
const SLOT_BOX_CLASS = (isOver: boolean, char: Character | null) => {
  if (char) {
    return 'w-14 h-14 sm:w-20 sm:h-20 lg:w-[100px] lg:h-[100px] xl:w-[110px] xl:h-[110px] aspect-square rounded-lg sm:rounded-2xl flex flex-col items-center justify-center p-0 relative group transition-all duration-300 border border-[#262630] bg-[#0e0e13] overflow-hidden'
  }
  const borderClass = isOver 
    ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10' 
    : 'border-dashed border-[#262630] bg-[#0e0e13]/90 hover:border-zinc-700'
  return `w-14 h-14 sm:w-20 sm:h-20 lg:w-[100px] lg:h-[100px] xl:w-[110px] xl:h-[110px] aspect-square rounded-lg sm:rounded-2xl flex flex-col items-center justify-center p-1 sm:p-1.5 md:p-2 relative group transition-all duration-300 border ${borderClass}`
}

const CHAR_WRAPPER_CLASS = (isDragging: boolean) => `w-full h-full flex flex-col items-center justify-center relative cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform duration-200 select-none ${
  isDragging ? 'opacity-30' : ''
}`

const CHAR_IMAGE_CLASS = 'w-full h-full object-cover shadow-md'
