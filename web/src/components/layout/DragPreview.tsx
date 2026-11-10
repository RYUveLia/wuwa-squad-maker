import type { Character } from '../../types'

/** 드래그 중 커서를 따라다니는 공명자 카드 미리보기 (DragOverlay 내용) */
export function DragPreview({ char }: { char: Character }) {
  return (
    <div className="w-20 h-24 bg-[#14141a] border-2 border-amber-400 rounded-xl p-1.5 flex flex-col items-center shadow-2xl shadow-amber-500/30 pointer-events-none">
      <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#09090d]">
        <img src={char.img} alt={char.name} className="w-full h-full object-cover" />
      </div>
      <span className="mt-1 text-[9px] font-bold text-zinc-200 truncate w-full text-center">{char.name}</span>
    </div>
  )
}
