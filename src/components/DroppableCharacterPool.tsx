import { useDroppable } from '@dnd-kit/core'

interface DroppableCharacterPoolProps {
  children: React.ReactNode
}

export function DroppableCharacterPool({ children }: DroppableCharacterPoolProps) {
  const { setNodeRef } = useDroppable({
    id: 'character-pool-droppable'
  })

  return (
    <div
      ref={setNodeRef}
      className={POOL_GRID_CLASS}
    >
      {children}
    </div>
  )
}

// STYLES
const POOL_GRID_CLASS = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 md:gap-2 overflow-y-auto pr-1 mt-4 flex-1 content-start auto-rows-max scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent'
