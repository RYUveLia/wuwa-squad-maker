import { useEffect } from 'react'
import { COMMON_STYLES } from '../styles/theme'

interface ConfirmModalProps {
  isOpen: boolean
  message: string
  subMessage?: string
  confirmText?: string // 동적 승인 버튼 문구 추가
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  message,
  subMessage,
  confirmText = '제외하기', // 기본값 설정
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onConfirm()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onConfirm, onCancel])

  if (!isOpen) return null

  return (
    <div className={COMMON_STYLES.modalOverlay} style={{ zIndex: 110 }} onClick={onCancel}>
      <div
        className={`${COMMON_STYLES.modalContainer} max-w-sm text-center items-center`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header/Warning Icon */}
        <div className={CONFIRM_STYLES.iconArea}>
          <span className={CONFIRM_STYLES.icon}>⚠️</span>
        </div>

        {/* Message */}
        <div className={CONFIRM_STYLES.body}>
          <p className={CONFIRM_STYLES.message}>{message}</p>
          {subMessage && <p className={CONFIRM_STYLES.subMessage}>{subMessage}</p>}
        </div>

        {/* Actions */}
        <div className={CONFIRM_STYLES.footer}>
          <button
            onClick={onCancel}
            className={CONFIRM_STYLES.cancelBtn}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={CONFIRM_STYLES.confirmBtn}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// STYLES (Colocation Style Pattern 기조 일치 및 흘러내림 방지 튜닝)
const CONFIRM_STYLES = {
  iconArea: 'w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-3.5 select-none',
  icon: 'text-xl leading-none',
  body: 'flex flex-col gap-1 mb-4.5',
  message: 'text-[13px] sm:text-sm md:text-[15px] font-bold text-slate-100 leading-snug break-keep px-1',
  subMessage: 'text-[10px] sm:text-[10.5px] text-slate-500 font-semibold break-keep px-1',
  footer: 'flex gap-2.5 w-full',
  cancelBtn: 'flex-1 text-[10.5px] sm:text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 py-2 rounded-lg cursor-pointer transition-colors active:scale-98 whitespace-nowrap flex-shrink-0',
  confirmBtn: 'flex-1 text-[10.5px] sm:text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 py-2 rounded-lg cursor-pointer shadow-md active:scale-98 transition-all whitespace-nowrap flex-shrink-0'
}
