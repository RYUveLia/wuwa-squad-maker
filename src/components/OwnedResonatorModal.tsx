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
    <div className={OWNED_MODAL_STYLES.overlay} onClick={onClose}>
      <div
        className={OWNED_MODAL_STYLES.container}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={OWNED_MODAL_STYLES.header}>
          <div className={OWNED_MODAL_STYLES.headerTitleArea}>
            <h3 className={OWNED_MODAL_STYLES.title}>보유 공명자 설정</h3>
            <p className={OWNED_MODAL_STYLES.description}>
              내가 현재 보유 중인 캐릭터들만 체크하세요. 도감 필터 시 활용됩니다.
            </p>
          </div>
          <div className={OWNED_MODAL_STYLES.headerBtnArea}>
            <button
              onClick={handleSelectAll}
              className={OWNED_MODAL_STYLES.shortcutBtn}
            >
              전체 선택
            </button>
            <button
              onClick={handleClearAll}
              className={OWNED_MODAL_STYLES.shortcutBtn}
            >
              전체 해제
            </button>
          </div>
        </div>

        {/* Characters Grid */}
        <div className={OWNED_MODAL_STYLES.grid}>
          {MOCK_CHARACTERS.map((char: Character) => {
            const isOwned = tempOwnedIds.includes(char.id)

            return (
              <div
                key={char.id}
                onClick={() => handleToggleId(char.id)}
                className={CARD_CLASS(isOwned, char.rarity)}
              >
                {/* 둥근 액자형 프레임 이미지 */}
                <div className={OWNED_MODAL_STYLES.imgFrame}>
                  <img
                    src={char.img}
                    alt={char.name}
                    className={OWNED_MODAL_STYLES.img}
                  />
                </div>
                
                {/* Character Name Area */}
                <div className={OWNED_MODAL_STYLES.nameArea}>
                  <span className={OWNED_MODAL_STYLES.nameText}>
                    {char.name}
                  </span>
                </div>

                {/* Checked Badge Overlay */}
                {isOwned && (
                  <div className={OWNED_MODAL_STYLES.checkBadge}>
                    <span className={OWNED_MODAL_STYLES.checkText}>✓</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className={OWNED_MODAL_STYLES.footer}>
          <button
            onClick={onClose}
            className={OWNED_MODAL_STYLES.cancelBtn}
          >
            취소
          </button>
          <button
            onClick={handleSaveAndClose}
            className={OWNED_MODAL_STYLES.saveBtn}
          >
            보유 현황 저장
          </button>
        </div>
      </div>
    </div>
  )
}

// STYLES (App.tsx Colocation Style Pattern 기조 통일)
const OWNED_MODAL_STYLES = {
  overlay: 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in',
  container: 'bg-slate-950/95 border border-slate-800/80 rounded-2xl p-4 w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl animate-scale-up',
  header: 'flex items-center justify-between pb-3 border-b border-slate-900 flex-shrink-0',
  headerTitleArea: 'flex flex-col',
  title: 'text-base font-bold text-slate-100',
  description: 'text-[10px] sm:text-xs text-slate-500 mt-0.5',
  headerBtnArea: 'flex gap-2',
  shortcutBtn: 'text-[10px] sm:text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md cursor-pointer transition-colors',
  grid: 'grid grid-cols-4 sm:grid-cols-5 gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5 overflow-y-auto flex-1 py-5 px-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent justify-items-center',
  imgFrame: 'w-full aspect-square overflow-hidden rounded-lg relative',
  img: 'w-full h-full object-cover pointer-events-none',
  nameArea: 'w-full text-center mt-auto pb-0.5 select-none pointer-events-none',
  nameText: 'text-[9.5px] sm:text-[10.5px] font-bold text-slate-300 group-hover:text-white truncate block px-0.5',
  checkBadge: 'absolute top-1 right-1 bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow border border-emerald-400 select-none pointer-events-none scale-90 sm:scale-100 animate-scale-up',
  checkText: 'text-[10px] font-black leading-none',
  footer: 'flex items-center justify-end gap-3 pt-3 border-t border-slate-900 flex-shrink-0',
  cancelBtn: 'text-[11px] sm:text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg cursor-pointer transition-colors',
  saveBtn: 'text-[11px] sm:text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded-lg cursor-pointer shadow-md active:scale-95 transition-all'
}

const CARD_CLASS = (isOwned: boolean, rarity: number) => {
  const rarityBorder = rarity === 5
    ? isOwned ? 'border-amber-500 shadow-amber-500/10' : 'border-slate-900'
    : isOwned ? 'border-purple-500 shadow-purple-500/10' : 'border-slate-900'

  return `relative w-full max-w-[64px] sm:max-w-[76px] md:max-w-[80px] h-[86px] sm:h-[102px] md:h-[108px] rounded-xl overflow-hidden border flex flex-col items-center justify-between p-1 cursor-pointer transition-all duration-200 select-none group hover:scale-[1.03] flex-shrink-0 ${
    isOwned ? 'opacity-100 bg-slate-900 shadow-md' : 'opacity-40 bg-slate-950/20 grayscale hover:opacity-75 hover:grayscale-0'
  } ${rarityBorder}`
}
