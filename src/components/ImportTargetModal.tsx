import { useEffect } from 'react'
import { COMMON_STYLES } from '../styles/theme'
import type { SquadRow } from '../types'
import { hasAnyMember, sanitizeSquadsForVersion } from '../utils/versionTransfer'

interface ImportTargetModalProps {
  codeVersion: string
  /** 버전 없는 이전 코드일 때 codeVersion을 정한 방식 ('inferred': 추정, 'live': 라이브 가정) */
  assumedVersion?: 'inferred' | 'live' | null
  currentVersion: string
  rows: SquadRow[]
  isVersionBoardEmpty: (version: string) => boolean
  onSelect: (target: 'code' | 'current') => void
  onCancel: () => void
}

/** 정리 후 빠지는 공명자 이름 목록 (빈 파티가 삭제되어 순서가 바뀌므로 파티 id로 비교) */
function getRemovedNames(before: SquadRow[], after: SquadRow[]): string[] {
  const afterById = new Map(after.map(row => [row.id, row]))
  const names: string[] = []
  before.forEach(row =>
    row.characters.forEach((char, slot) => {
      if (char && !afterById.get(row.id)?.characters[slot]) names.push(char.name)
    })
  )
  return names
}

/** 현재 보드와 다른 버전의 편성 코드를 붙여넣었을 때 넣을 보드를 고르는 모달 */
export function ImportTargetModal({
  codeVersion,
  assumedVersion = null,
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

  // 버전을 추정하지 못한 이전 코드는 아이콘만으로 회로 효과를 알 수 없어 코드 버전 보드에서도 회로 삭제
  const codeResetsCircuits = assumedVersion === 'live'
  const toCode = sanitizeSquadsForVersion(rows, codeVersion, { resetCircuits: codeResetsCircuits })
  const toCurrent = sanitizeSquadsForVersion(rows, currentVersion, { resetCircuits: true })
  const removedToCode = getRemovedNames(rows, toCode.rows)
  const removedToCurrent = getRemovedNames(rows, toCurrent.rows)
  const circuitCount = rows.filter(r => r.circuitBuffId).length
  // 넣은 결과 공명자가 한 명도 남지 않으면 선택 불가
  const blockedToCode = hasAnyMember(rows) && !hasAnyMember(toCode.rows)
  const blockedToCurrent = hasAnyMember(rows) && !hasAnyMember(toCurrent.rows)

  const options = [
    {
      key: 'code' as const,
      title: `${codeVersion} 보드에 넣기`,
      badge: codeResetsCircuits ? '회로 삭제' : '회로 유지',
      blocked: blockedToCode,
      blockedReason: `${codeVersion}에서 편성 가능한 공명자가 없어 넣을 수 없습니다.`,
      notes: [
        assumedVersion === 'inferred'
          ? `회로·공명자·출전 횟수가 모두 맞는 ${codeVersion} 보드로 이동해 그대로 불러옵니다.`
          : assumedVersion === 'live'
            ? `${codeVersion} 코드로 보고 ${codeVersion} 보드로 이동해 불러옵니다. 회로는 버전을 알 수 없어 삭제됩니다.`
            : `코드가 만들어진 ${codeVersion} 보드로 이동해 그대로 불러옵니다.`,
        toCode.clearedCircuits > 0 ? `${codeVersion}에 없는 회로 ${toCode.clearedCircuits}개는 초기화됩니다.` : '',
        removedToCode.length > 0 ? `제외: ${removedToCode.join(', ')}` : '',
        toCode.droppedRows > 0 ? `공명자가 모두 빠지는 파티 ${toCode.droppedRows}개는 삭제됩니다.` : '',
        !isVersionBoardEmpty(codeVersion) ? `${codeVersion} 보드의 기존 파티는 대체됩니다.` : ''
      ]
    },
    {
      key: 'current' as const,
      title: `현재 ${currentVersion} 보드에 넣기`,
      badge: '회로 삭제',
      blocked: blockedToCurrent,
      blockedReason: `${currentVersion}에서 편성 가능한 공명자가 없어 넣을 수 없습니다. (모두 미출시 또는 출전 한도 초과)`,
      notes: [
        `회로 버프${circuitCount > 0 ? ` ${circuitCount}개` : ''}를 지우고 ${currentVersion} 규칙에 맞게 넣습니다.`,
        removedToCurrent.length > 0
          ? `제외: ${removedToCurrent.join(', ')} (${currentVersion} 미출시 또는 출전 한도 초과)`
          : `${currentVersion} 규칙에 맞지 않는 공명자는 없습니다.`,
        toCurrent.droppedRows > 0 ? `공명자가 모두 빠지는 파티 ${toCurrent.droppedRows}개는 삭제됩니다.` : '',
        !isVersionBoardEmpty(currentVersion) ? `${currentVersion} 보드의 기존 파티는 대체됩니다.` : ''
      ]
    }
  ]

  return (
    <div className={COMMON_STYLES.modalOverlay} onClick={onCancel}>
      <div className={`${COMMON_STYLES.modalContainer} max-w-md`} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base sm:text-lg font-bold">
          {assumedVersion ? '버전 정보가 없는 이전 코드입니다' : `${codeVersion} 버전 편성 코드입니다`}
        </h3>
        <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 break-keep">
          {assumedVersion === 'inferred' && `회로·공명자 구성으로 보아 ${codeVersion} 코드로 추정됩니다. `}
          {assumedVersion === 'live' && `버전을 추정할 수 없어 현재 라이브 버전인 ${codeVersion} 코드로 보고 불러옵니다. `}
          지금은 {currentVersion} 보드를 보고 있어요. 어디에 넣을지 골라 주세요.
        </p>

        <div className="flex flex-col gap-2 mt-4">
          {options.map(opt => (
            <button
              key={opt.key}
              type="button"
              disabled={opt.blocked}
              onClick={() => onSelect(opt.key)}
              className="text-left p-3 rounded-xl border border-[#262630] bg-[#14141a] enabled:hover:border-amber-400/70 enabled:hover:bg-amber-950/10 transition-colors enabled:cursor-pointer group disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-zinc-100 group-hover:text-amber-300">{opt.title}</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                    opt.badge === '회로 유지'
                      ? 'text-emerald-400 border-emerald-800/50 bg-emerald-950/30'
                      : 'text-rose-400 border-rose-900/50 bg-rose-950/30'
                  }`}
                >
                  {opt.badge}
                </span>
              </div>
              <ul className="mt-1.5 flex flex-col gap-0.5">
                {(opt.blocked ? [opt.blockedReason] : opt.notes.filter(Boolean)).map((note, i) => (
                  <li key={i} className={`text-[11px] leading-snug break-keep ${opt.blocked ? 'text-rose-400 font-semibold' : 'text-zinc-400'}`}>
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
