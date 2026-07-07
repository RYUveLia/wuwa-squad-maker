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
      className="grid grid-cols-3 sm:grid-cols-4 gap-2 overflow-y-auto pr-1 mt-4 flex-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
    >
      {children}
    </div>
  )
}
