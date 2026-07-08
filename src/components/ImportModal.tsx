import { useState } from 'react'
import { COMMON_STYLES } from '../styles/theme'

interface ImportModalProps {
  onImport: (code: string) => void
  onClose: () => void
}

export function ImportModal({ onImport, onClose }: ImportModalProps) {
  const [code, setCode] = useState('')

  return (
    <div className={IMPORT_STYLES.overlay} onClick={onClose}>
      <div
        className={IMPORT_STYLES.container}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={IMPORT_STYLES.title}>편성 코드 불러오기</h3>
        <p className={IMPORT_STYLES.subMessage}>
          내보내기로 복사한 편성 코드(Base64)를 붙여넣어 주세요.<br />
          <span className="text-purple-400">이전 버전의 형식(주석 포함)</span>도 그대로 지원합니다.
        </p>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="여기에 편성 코드를 붙여넣어 주세요. (예: W1sieWFuZ3lhbmcteHVhbmxpbmciLCJsdWNpbGxh..."
          className={IMPORT_STYLES.textarea}
          autoFocus
        />
        <div className={IMPORT_STYLES.footer}>
          <button
            onClick={onClose}
            className={IMPORT_STYLES.cancelBtn}
          >
            취소
          </button>
          <button
            onClick={() => onImport(code)}
            disabled={!code.trim()}
            className={IMPORT_STYLES.confirmBtn}
          >
            불러오기
          </button>
        </div>
      </div>
    </div>
  )
}

// STYLES
const IMPORT_STYLES = {
  overlay: 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in',
  container: 'bg-slate-900 border border-slate-700 rounded-2xl p-6 w-[90%] max-w-md shadow-2xl animate-scale-up',
  title: 'text-lg font-bold text-slate-100 mb-2',
  subMessage: 'text-xs text-slate-400 mb-4',
  textarea: 'w-full h-28 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none font-mono',
  footer: 'flex gap-2 mt-4 justify-end',
  cancelBtn: COMMON_STYLES.cancelBtn,
  confirmBtn: COMMON_STYLES.confirmBtn
}
