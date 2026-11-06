import { useState } from 'react'
import { COMMON_STYLES } from '../styles/theme'
import { GAME_VERSIONS, LEAK_VERSIONS } from '../constants/versions'
import { resolveCircuitBuff } from '../constants/circuitBuffs'
import type { SquadRow } from '../types'
import type { MigrationAssignment } from '../hooks/useSquadTransfer'
import {
  getAllowedVersions,
  getRequiredVersionLabel,
  inferSetVersion,
  pickPreferred,
  suggestVersion
} from '../utils/versionTransfer'

interface VersionMigrationModalProps {
  rows: SquadRow[]
  onConfirm: (assignments: MigrationAssignment[]) => void
  onDismiss: () => void
}

interface RowChoice {
  include: boolean
  version: string
}

/**
 * 버전 구분 이전에 저장된 파티를 어느 버전 보드로 보낼지 고르는 모달.
 *
 * 이전 데이터의 회로는 아이콘 ID로만 저장되어 있고, 같은 아이콘이 버전마다 다른 효과로 재사용된다.
 * 그래서 회로는 "세트 전체가 손실 없이 맞는 버전(세트 추천 버전)"으로 옮길 때만 유지하고,
 * 그 외 버전으로 옮기거나 세트 추천이 없으면 회로를 삭제한다.
 */
export function VersionMigrationModal({ rows, onConfirm, onDismiss }: VersionMigrationModalProps) {
  const setSuggestion = inferSetVersion(rows)
  const setVersion = setSuggestion?.version ?? null
  const suggestions = rows.map(row => suggestVersion(row))
  // 공명자가 모두 출시된 버전만 선택 가능
  const allowedByRow = rows.map(row => getAllowedVersions(row.characters))

  const initialChoices = (): RowChoice[] =>
    rows.map((_, i) => {
      if (setVersion) return { include: true, version: setVersion }
      const options = allowedByRow[i]
      const version = options.includes(suggestions[i].version)
        ? suggestions[i].version
        : pickPreferred(options) ?? suggestions[i].version
      return { include: true, version }
    })

  const [choices, setChoices] = useState<RowChoice[]>(initialChoices)

  const setChoice = (idx: number, patch: Partial<RowChoice>) =>
    setChoices(prev => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)))

  // 일괄 지정: 공명자가 모두 출시된 파티에만 적용
  const applyAll = (version: string) =>
    setChoices(prev => prev.map((c, i) => (allowedByRow[i].includes(version) ? { ...c, version } : c)))

  /** 회로 유지 여부: 세트 추천 버전으로 옮길 때만 */
  const keepsCircuit = (version: string) => !!setVersion && version === setVersion

  const includedCount = choices.filter(c => c.include).length

  const handleConfirm = () => {
    onConfirm(
      rows
        .map((row, i) => ({ row, choice: choices[i] }))
        .filter(({ choice }) => choice.include)
        .map(({ row, choice }) => ({ row, version: choice.version, resetCircuit: !keepsCircuit(choice.version) }))
    )
  }

  return (
    <div className={COMMON_STYLES.modalOverlay}>
      <div
        className={`${COMMON_STYLES.modalContainer} max-w-2xl p-4 sm:p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pb-3 border-b border-[#262630]">
          <h2 className="text-base sm:text-xl font-black tracking-tight">기존 파티를 버전별로 정리해 주세요</h2>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 leading-relaxed break-keep">
            이제 버전마다 파티가 따로 저장됩니다. 저장돼 있던 파티 {rows.length}개를 보낼 버전을 골라 주세요.
            이전 데이터의 회로는 아이콘만 저장되어 버전마다 효과가 달라질 수 있어,
            <b className="text-zinc-200"> 세트 추천 버전으로 옮길 때만 회로를 유지</b>하고 그 외에는 회로를 삭제합니다.
          </p>
        </div>

        {/* Set-level suggestion */}
        <div
          className={`mt-3 px-3 py-2 rounded-lg border text-[11px] sm:text-xs leading-relaxed break-keep ${
            setSuggestion ? 'border-emerald-800/50 bg-emerald-950/20 text-emerald-300' : 'border-[#262630] bg-[#14141a] text-zinc-400'
          }`}
        >
          {setSuggestion ? (
            <>
              <b>세트 추천: 전체 {setSuggestion.version}</b> · 모든 파티의 회로·공명자·출전 횟수가 그대로 맞는 버전입니다. 이 버전으로 옮기면 회로가 유지됩니다.
              {setSuggestion.candidates.length > 1 && ` (가능: ${setSuggestion.candidates.join(', ')})`}
            </>
          ) : (
            <>세트 전체가 그대로 맞는 버전이 없어 파티별로 추천했습니다. 회로는 모두 삭제되니 옮긴 뒤 다시 골라 주세요.</>
          )}
        </div>

        {/* Bulk actions */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="text-[11px] sm:text-xs font-bold text-zinc-400 mr-1">일괄 지정</span>
          <button type="button" onClick={() => setChoices(initialChoices())} className={COMMON_STYLES.subBtn}>
            추천대로
          </button>
          {GAME_VERSIONS.map(v => (
            <button key={v} type="button" onClick={() => applyAll(v)} className={COMMON_STYLES.subBtn}>
              전체 {v}
              {LEAK_VERSIONS.includes(v) && <span className="text-amber-500/80 text-[9px]">유출</span>}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="mt-3 flex flex-col gap-2 max-h-[52vh] overflow-y-auto pr-1">
          {rows.map((row, i) => {
            const choice = choices[i]
            const resolved = resolveCircuitBuff(row.circuitBuffId)
            const circuitKept = !!resolved && keepsCircuit(choice.version)
            const circuitDropped = !!resolved && !circuitKept
            const required = getRequiredVersionLabel(row.characters)

            return (
              <div
                key={row.id}
                className={`rounded-xl border p-2.5 sm:p-3 transition-colors ${
                  choice.include ? 'bg-[#14141a] border-[#262630]' : 'bg-transparent border-[#1c1c24] opacity-50'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <input
                    type="checkbox"
                    checked={choice.include}
                    onChange={(e) => setChoice(i, { include: e.target.checked })}
                    aria-label={`${i + 1}번 파티 옮기기`}
                    className="w-4 h-4 accent-amber-400 cursor-pointer flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm font-black font-mono text-zinc-500 w-5 flex-shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex gap-1 flex-shrink-0">
                    {row.characters.map((c, slot) => (
                      <div key={slot} className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-[#09090d] border border-[#262630]">
                        {c && <img src={c.img} alt={c.name} title={c.name} className="w-full h-full object-cover" />}
                      </div>
                    ))}
                    <div
                      className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#09090d] border border-[#262630] p-1 flex items-center justify-center"
                      title={resolved ? resolved.buff.name : '회로 미선택'}
                    >
                      {resolved ? (
                        <img
                          src={resolved.buff.iconUrl}
                          alt={resolved.buff.name}
                          className={`w-full h-full object-contain ${circuitDropped && choice.include ? 'opacity-30' : ''}`}
                        />
                      ) : (
                        <span className="text-[8px] text-zinc-600 font-bold">회로 X</span>
                      )}
                      {circuitDropped && choice.include && (
                        <span className="absolute inset-0 flex items-center justify-center text-rose-400 text-lg font-black">✕</span>
                      )}
                    </div>
                  </div>

                  {/* Version choices */}
                  <div role="radiogroup" aria-label={`${i + 1}번 파티 버전`} className="flex flex-nowrap gap-1 w-full sm:w-auto sm:ml-auto justify-end">
                    {GAME_VERSIONS.map(v => {
                      const disabled = !allowedByRow[i].includes(v) || !choice.include
                      const active = choice.version === v
                      return (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          disabled={disabled}
                          onClick={() => setChoice(i, { version: v })}
                          className={`relative px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold border transition-colors select-none ${
                            active
                              ? 'bg-amber-400 text-zinc-950 border-amber-400'
                              : disabled
                                ? 'bg-transparent text-zinc-700 border-[#1c1c24] cursor-not-allowed line-through'
                                : 'bg-[#09090d] text-zinc-400 border-[#262630] hover:text-zinc-200 cursor-pointer'
                          }`}
                        >
                          {v}
                          {v === setVersion && (
                            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" aria-label="세트 추천 버전" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <p className="mt-1.5 text-[10px] sm:text-[11px] text-zinc-500 leading-snug break-keep pl-6">
                  {setVersion ? `세트 추천 ${setVersion}` : `추천 ${suggestions[i].version} · ${suggestions[i].reason}`}
                  {required && ` · 공명자 ${required}+`}
                  {choice.include && circuitKept && <span className="text-emerald-400 font-semibold"> · 회로 유지</span>}
                  {choice.include && circuitDropped && (
                    <span className="text-rose-400 font-semibold">
                      {' '}· 회로 삭제{setVersion ? ` (세트 추천 ${setVersion}이 아니라 효과가 달라질 수 있음)` : ''}
                    </span>
                  )}
                </p>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-[#262630]">
          <button type="button" onClick={onDismiss} className={COMMON_STYLES.cancelBtn}>
            나중에
          </button>
          <button type="button" onClick={handleConfirm} className={COMMON_STYLES.confirmBtn}>
            {includedCount > 0 ? `${includedCount}개 파티 옮기기` : '옮기지 않고 정리'}
          </button>
        </div>
      </div>
    </div>
  )
}
