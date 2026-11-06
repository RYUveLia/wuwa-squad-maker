import { useState } from 'react'
import { COMMON_STYLES } from '../styles/theme'

interface ImportModalProps {
  onImport: (code: string) => void
  onClose: () => void
  currentVersion: string
  versions: string[]
  getVersionPartyCount: (version: string) => number
  onLoadFromVersion: (version: string) => void
}

export function ImportModal({
  onImport,
  onClose,
  currentVersion,
  versions,
  getVersionPartyCount,
  onLoadFromVersion
}: ImportModalProps) {
  const otherVersions = versions.filter(v => v !== currentVersion)
  const [code, setCode] = useState('')

  return (
    <div className={COMMON_STYLES.modalOverlay} onClick={onClose}>
      <div
        className={`${COMMON_STYLES.modalContainer} max-w-md`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={IMPORT_STYLES.title}>편성 코드 불러오기</h3>
        <p className={IMPORT_STYLES.subMessage}>
          내보내기로 복사한 편성 코드(Base64)를 붙여넣어 주세요.<br />
          코드에 담긴 <span className="text-amber-400">버전 보드</span>로 불러오며, 버전 정보가 없는 이전 코드는 현재 <span className="text-amber-400">{currentVersion}</span> 보드로 불러옵니다.<br />
          해당 버전에 없는 공명자·회로는 제외됩니다.
        </p>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="여기에 편성 코드를 붙여넣어 주세요. (예: W1sieWFuZ3lhbmcteHVhbmxpbmciLCJsdWNpbGxh..."
          className={IMPORT_STYLES.textarea}
          autoFocus
        />
        {/* Load from another version board */}
        <div className="mt-4 pt-3 border-t border-[#262630]">
          <p className="text-xs font-bold text-zinc-200">다른 버전 보드에서 불러오기</p>
          <p className="text-[11px] text-zinc-500 mt-0.5 break-keep">
            회로는 초기화되고, {currentVersion}에 없는 공명자·출전 한도 초과분은 제외됩니다.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {otherVersions.map(v => {
              const count = getVersionPartyCount(v)
              return (
                <button
                  key={v}
                  type="button"
                  disabled={count === 0}
                  onClick={() => onLoadFromVersion(v)}
                  className={IMPORT_STYLES.versionBtn}
                >
                  {v} <span className="text-zinc-500 font-semibold">({count === 0 ? '비어 있음' : `${count}개 파티`})</span>
                </button>
              )
            })}
          </div>
        </div>

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
  title: 'text-lg font-bold text-zinc-100 mb-2',
  subMessage: 'text-xs text-zinc-400 mb-4',
  textarea: 'w-full h-28 bg-[#09090d] border border-[#262630] rounded-lg p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 resize-none font-mono',
  footer: 'flex gap-2 mt-4 justify-end',
  versionBtn: 'px-2.5 py-1 text-[11px] sm:text-xs font-bold text-amber-400 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-800/40 rounded-lg cursor-pointer transition-colors disabled:text-zinc-600 disabled:bg-transparent disabled:border-[#262630] disabled:cursor-not-allowed',
  cancelBtn: COMMON_STYLES.cancelBtn,
  confirmBtn: COMMON_STYLES.confirmBtn
}
