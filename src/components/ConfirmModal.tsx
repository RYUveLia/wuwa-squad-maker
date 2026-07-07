interface ConfirmModalProps {
  isOpen: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  message,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className={CONFIRM_STYLES.overlay} onClick={onCancel}>
      <div
        className={CONFIRM_STYLES.container}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header/Warning Icon */}
        <div className={CONFIRM_STYLES.iconArea}>
          <span className={CONFIRM_STYLES.icon}>⚠️</span>
        </div>

        {/* Message */}
        <div className={CONFIRM_STYLES.body}>
          <p className={CONFIRM_STYLES.message}>{message}</p>
          <p className={CONFIRM_STYLES.subMessage}>제외된 캐릭터는 파티 목록에서 즉시 제거됩니다.</p>
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
            제외하기
          </button>
        </div>
      </div>
    </div>
  )
}

// STYLES (Colocation Style Pattern 기조 일치)
const CONFIRM_STYLES = {
  overlay: 'fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in',
  container: 'bg-slate-950/95 border border-slate-800/80 rounded-2xl p-5 sm:p-6 w-full max-w-sm flex flex-col items-center shadow-2xl animate-scale-up text-center',
  iconArea: 'w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-4 select-none',
  icon: 'text-2xl leading-none',
  body: 'flex flex-col gap-1.5 mb-5',
  message: 'text-sm sm:text-base font-bold text-slate-100 leading-snug',
  subMessage: 'text-[10px] sm:text-[11px] text-slate-500 font-medium',
  footer: 'flex gap-3 w-full',
  cancelBtn: 'flex-1 text-[11px] sm:text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 py-2.5 rounded-lg cursor-pointer transition-colors active:scale-98',
  confirmBtn: 'flex-1 text-[11px] sm:text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 px-4 py-2.5 rounded-lg cursor-pointer shadow-md active:scale-98 transition-all'
}
