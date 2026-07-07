import { useDraggable } from '@dnd-kit/core'
import type { Character } from '../types'
import { ELEMENT_KR_MAP } from '../constants'

interface DraggableCharacterCardProps {
  char: Character
  assignedSquadIndices: number[]
  onClick: () => void
  isMaxedOut: boolean
  maxAllowed: number
}

export function DraggableCharacterCard({
  char,
  assignedSquadIndices,
  onClick,
  isMaxedOut,
  maxAllowed
}: DraggableCharacterCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: char.id,
    data: char,
    disabled: isMaxedOut,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined

  const isAssigned = assignedSquadIndices.length > 0

  const rarityBorder = char.rarity === 5
    ? 'hover:border-amber-500/50 hover:shadow-amber-500/5'
    : 'hover:border-purple-500/50 hover:shadow-purple-500/5'

  const elementColor =
    char.element === 'Spectro' ? 'text-amber-400 border-amber-900/50 bg-amber-950/40' :
    char.element === 'Aero' ? 'text-emerald-400 border-emerald-900/50 bg-emerald-950/40' :
    char.element === 'Electro' ? 'text-violet-400 border-violet-900/50 bg-violet-950/40' :
    char.element === 'Fusion' ? 'text-rose-400 border-rose-900/50 bg-rose-950/40' :
    char.element === 'Glacio' ? 'text-cyan-400 border-cyan-900/50 bg-cyan-950/40' :
    char.element === 'Havoc' ? 'text-fuchsia-400 border-fuchsia-900/50 bg-fuchsia-950/40' :
    'text-slate-400 border-slate-900/50 bg-slate-950/40'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => {
        if (isMaxedOut && assignedSquadIndices.length === 0) return
        onClick()
      }}
      className={`${CONTAINER_CLASS(isMaxedOut, isDragging)} ${rarityBorder}`}
    >
      <div className={IMAGE_WRAPPER_CLASS}>
        <img
          src={char.img}
          alt={char.name}
          className={IMAGE_CLASS}
          draggable="false"
        />
        
        {isAssigned && (
          <div className={DEPLOYED_OVERLAY_CLASS}>
            <span className={DEPLOYED_BADGE_CLASS}>
              P{assignedSquadIndices.map(i => i + 1).join(',')}
            </span>
          </div>
        )}
      </div>
      <div className={NAME_CLASS}>
        {char.name}
      </div>
      
      {/* 속성을 이름 아래에 배치 */}
      <div className={TAG_AREA_CLASS}>
        <span className={ELEMENT_BADGE_CLASS(elementColor)}>
          {ELEMENT_KR_MAP[char.element] || char.element}
        </span>
        {maxAllowed === 2 && (
          <span className={LIMIT2_BADGE_CLASS}>
            {char.id === 'chisa' ? '2회 (시즌)' : '2회'}
          </span>
        )}
      </div>
    </div>
  )
}

// STYLES
const CONTAINER_CLASS = (isMaxedOut: boolean, isDragging: boolean) => `bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2 md:p-2.5 flex flex-col items-center select-none group transition-all duration-200 ${
  isMaxedOut ? 'opacity-30 border-slate-900 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:bg-slate-950 hover:shadow-md'
} ${isDragging ? 'opacity-30 scale-95 border-purple-500/80 shadow-2xl' : ''}`

const IMAGE_WRAPPER_CLASS = 'aspect-square w-full bg-slate-900/80 rounded-xl overflow-hidden relative'
const IMAGE_CLASS = 'w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
const DEPLOYED_OVERLAY_CLASS = 'absolute inset-0 flex items-center justify-center bg-slate-950/75 pointer-events-none'
const DEPLOYED_BADGE_CLASS = 'text-xs md:text-sm font-extrabold text-purple-400 tracking-wider bg-slate-950 border border-purple-500/30 px-2.5 py-0.5 rounded shadow select-none'
const NAME_CLASS = 'mt-2 text-sm md:text-base font-bold text-slate-300 group-hover:text-slate-100 transition-colors truncate w-full text-center'
const TAG_AREA_CLASS = 'mt-1.5 select-none flex flex-wrap items-center justify-center gap-1 md:gap-1.5 w-full font-bold'
const ELEMENT_BADGE_CLASS = (elementColor: string) => `px-2 py-0.5 rounded border text-[12px] md:text-[13px] whitespace-nowrap ${elementColor}`
const LIMIT2_BADGE_CLASS = 'text-[12px] md:text-[13px] font-extrabold text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded whitespace-nowrap'
