import { useState } from 'react'

interface ImportModalProps {
  onImport: (code: string) => void
  onClose: () => void
}

export function ImportModal({ onImport, onClose }: ImportModalProps) {
  const [code, setCode] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-[90%] max-w-md shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-100 mb-2">편성 코드 불러오기</h3>
        <p className="text-xs text-slate-400 mb-4">
          내보내기로 복사한 편성 코드(Base64)를 붙여넣어 주세요.<br />
          <span className="text-purple-400">이전 버전의 형식(주석 포함)</span>도 그대로 지원합니다.
        </p>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="여기에 편성 코드를 붙여넣어 주세요. (예: W1sieWFuZ3lhbmcteHVhbmxpbmciLCJsdWNpbGxh..."
          className="w-full h-28 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none font-mono"
          autoFocus
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-bold text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 cursor-pointer transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => onImport(code)}
            disabled={!code.trim()}
            className="px-4 py-1.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            불러오기
          </button>
        </div>
      </div>
    </div>
  )
}
