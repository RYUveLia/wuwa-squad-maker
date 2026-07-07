import { useState } from 'react'
import type { Character } from '../types'
import { MOCK_CHARACTERS } from '../utils/character'

interface OwnedResonatorModalProps {
  isOpen: boolean
  onClose: () => void
  ownedIds: string[]
  onSave: (ids: string[]) => void
}

export function OwnedResonatorModal({
  isOpen,
  onClose,
  ownedIds,
  onSave
}: OwnedResonatorModalProps) {
  const [tempOwnedIds, setTempOwnedIds] = useState<string[]>(ownedIds)

  if (!isOpen) return null

  const handleToggleId = (id: string) => {
    setTempOwnedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    setTempOwnedIds(MOCK_CHARACTERS.map((c: Character) => c.id))
  }

  const handleClearAll = () => {
    setTempOwnedIds([])
  }

  const handleSaveAndClose = () => {
    onSave(tempOwnedIds)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-slate-950/95 border border-slate-800/80 rounded-2xl p-4 w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-900 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-100">보유 공명자 설정</h3>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">내가 현재 보유 중인 캐릭터들만 체크하세요. 도감 필터 시 활용됩니다.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="text-[10px] sm:text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md cursor-pointer transition-colors"
            >
              전체 선택
            </button>
            <button
              onClick={handleClearAll}
              className="text-[10px] sm:text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md cursor-pointer transition-colors"
            >
              전체 해제
            </button>
          </div>
        </div>

        {/* Characters Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3 sm:gap-4 md:gap-5 overflow-y-auto flex-1 py-5 px-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent justify-items-center">
          {MOCK_CHARACTERS.map((char: Character) => {
            const isOwned = tempOwnedIds.includes(char.id)
            const rarityBorder = char.rarity === 5
              ? isOwned ? 'border-amber-500 shadow-amber-500/10' : 'border-slate-900'
              : isOwned ? 'border-purple-500 shadow-purple-500/10' : 'border-slate-900'

            return (
              <div
                key={char.id}
                onClick={() => handleToggleId(char.id)}
                className={`relative w-[62px] sm:w-[68px] md:w-[72px] aspect-[4/5] rounded-xl overflow-hidden border flex flex-col items-center justify-between cursor-pointer transition-all duration-200 select-none group hover:scale-[1.03] ${
                  isOwned ? 'opacity-100 bg-slate-900 shadow-md' : 'opacity-40 bg-slate-950/20 grayscale hover:opacity-75 hover:grayscale-0'
                } ${rarityBorder}`}
              >
                {/* 둥근 액자형 프레임 이미지 */}
                <div className="w-full aspect-square p-1 overflow-hidden">
                  <img src={char.img} alt={char.name} className="w-full h-full object-cover rounded-lg pointer-events-none" />
                </div>
                
                {/* Character Name Area */}
                <div className="w-full bg-slate-950/80 py-0.5 text-center pointer-events-none mt-auto">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 group-hover:text-white truncate block px-0.5">
                    {char.name}
                  </span>
                </div>

                {/* Checked Badge Overlay */}
                {isOwned && (
                  <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow border border-emerald-400 select-none pointer-events-none scale-90 sm:scale-100 animate-scale-up">
                    <span className="text-[10px] font-black leading-none">✓</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-900 flex-shrink-0">
          <button
            onClick={onClose}
            className="text-[11px] sm:text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg cursor-pointer transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSaveAndClose}
            className="text-[11px] sm:text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded-lg cursor-pointer shadow-md active:scale-95 transition-all"
          >
            보유 현황 저장
          </button>
        </div>
      </div>
    </div>
  )
}
