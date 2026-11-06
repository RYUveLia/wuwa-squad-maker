import { useEffect } from 'react'
import { COMMON_STYLES } from '../styles/theme'
import type { SquadRowData } from '../hooks/useSquadState'
import { sanitizeSquadsForVersion } from '../utils/versionTransfer'

interface ImportTargetModalProps {
  codeVersion: string
  currentVersion: string
  rows: SquadRowData[]
  isVersionBoardEmpty: (version: string) => boolean
  onSelect: (target: 'code' | 'current') => void
  onCancel: () => void
}

/** 정리 후 빠지는 공명자 이름 목록 */
function getRemovedNames(before: SquadRowData[], after: SquadRowData[]): string[] {
  const names: string[] = []
  before.forEach((row, r) =>
    row.characters.forEach((char, slot) => {
      if (char && !after[r]?.characters[slot]) names.push(char.name)
    })
  )
  return names
}

/** 현재 보드와 다른 버전의 편성 코드를 붙여넣었을 때 넣을 보드를 고르는 모달 */
export function ImportTargetModal({
  codeVersion,
  currentVersion,
  rows,
  isVersionBoardEmpty,
  onSelect,
  onCancel
}: ImportTargetModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const toCode = sanitizeSquadsForVersion(rows, codeVersion, { resetCircuits: false })
  const toCurrent = sanitizeSquadsForVersion(rows, currentVersion, { resetCircuits: true })
  const removedToCode = getRemovedNames(rows, toCode.rows)
  const removedToCurrent = getRemovedNames(rows, toCurrent.rows)
  const circuitCount = rows.filter(r => r.circuitBuffId).length

  const options = [
    {
      key: 'code' as const,
      title: `${codeVersion} 보드에 넣기`,
      badge: '회로 유지',
      notes: [
        `코드가 만들어진 ${codeVersion} 보드로 이동해 그대로 불러옵니다.`,
        removedToCode.length > 0 ? `제외: ${removedToCode.join(', ')}` : '',
        !isVersionBoardEmpty(codeVersion) ? `${codeVersion} 보드의 기존 파티는 대체됩니다.` : ''
      ]
    },
    {
      key: 'current' as const,
      title: `현재 ${currentVersion} 보드에 넣기`,
      badge: '회로 삭제',
      notes: [
        `회로 버프${circuitCount > 0 ? ` ${circuitCount}개` : ''}를 지우고 ${currentVersion} 규칙에 맞게 넣습니다.`,
        removedToCurrent.length > 0
          ? `제외: ${removedToCurrent.join(', ')} (${currentVersion} 미출시 또는 출전 한도 초과)`
          : `${currentVersion} 규칙에 맞지 않는 공명자는 없습니다.`,
        !isVersionBoardEmpty(currentVersion) ? `${currentVersion} 보드의 기존 파티는 대체됩니다.` : ''
      ]
    }
  ]

  return (
    <div className={COMMON_STYLES.modalOverlay} onClick={onCancel}>
      <div className={`${COMMON_STYLES.modalContainer} max-w-md`} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base sm:text-lg font-bold">{codeVersion} 버전 편성 코드입니다</h3>
        <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 break-keep">
          지금은 {currentVersion} 보드를 보고 있어요. 어디에 넣을지 골라 주세요.
        </p>

        <div className="flex flex-col gap-2 mt-4">
          {options.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSelect(opt.key)}
              className="text-left p-3 rounded-xl border border-[#262630] bg-[#14141a] hover:border-amber-400/70 hover:bg-amber-950/10 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-zinc-100 group-hover:text-amber-300">{opt.title}</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                    opt.key === 'code'
                      ? 'text-emerald-400 border-emerald-800/50 bg-emerald-950/30'
                      : 'text-rose-400 border-rose-900/50 bg-rose-950/30'
                  }`}
                >
                  {opt.badge}
                </span>
              </div>
              <ul className="mt-1.5 flex flex-col gap-0.5">
                {opt.notes.filter(Boolean).map((note, i) => (
                  <li key={i} className="text-[11px] text-zinc-400 leading-snug break-keep">
                    · {note}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <button type="button" onClick={onCancel} className={COMMON_STYLES.cancelBtn}>
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
