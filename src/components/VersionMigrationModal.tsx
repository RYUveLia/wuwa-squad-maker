import { useState } from 'react'
import { COMMON_STYLES } from '../styles/theme'
import { GAME_VERSIONS, LEAK_VERSIONS } from '../constants/versions'
import { resolveCircuitBuff } from '../constants/circuitBuffs'
import type { MigrationAssignment, SquadRowData } from '../hooks/useSquadState'
import {
  getAllowedVersions,
  getCircuitVersions,
  getRequiredVersionLabel,
  pickPreferred,
  suggestVersion
} from '../utils/versionTransfer'

interface VersionMigrationModalProps {
  rows: SquadRowData[]
  onConfirm: (assignments: MigrationAssignment[]) => void
  onDismiss: () => void
}

/** circuit: 회로 버전에 넣기(회로 유지) / free: 회로 삭제 후 원하는 버전에 넣기 */
type MoveMode = 'circuit' | 'free'

interface RowChoice {
  include: boolean
  mode: MoveMode
  version: string
}

/** 버전 구분 이전에 저장된 파티를 어느 버전 보드로 보낼지 고르는 모달 */
export function VersionMigrationModal({ rows, onConfirm, onDismiss }: VersionMigrationModalProps) {
  const suggestions = rows.map(row => suggestVersion(row))
  // 공명자가 모두 출시된 버전 (원하는 버전 모드의 선택지)
  const allowedByRow = rows.map(row => getAllowedVersions(row.characters))
  // 회로가 존재하면서 공명자도 출시된 버전 (회로 버전 모드의 선택지)
  const circuitByRow = rows.map((row, i) =>
    getCircuitVersions(row.circuitBuffId).filter(v => allowedByRow[i].includes(v))
  )
  const optionsOf = (i: number, mode: MoveMode) => (mode === 'circuit' ? circuitByRow[i] : allowedByRow[i])

  const initialChoices = (): RowChoice[] =>
    rows.map((_, i) => {
      const mode: MoveMode = circuitByRow[i].length > 0 ? 'circuit' : 'free'
      const options = optionsOf(i, mode)
      const version = options.includes(suggestions[i].version)
        ? suggestions[i].version
        : pickPreferred(options) ?? suggestions[i].version
      return { include: true, mode, version }
    })

  const [choices, setChoices] = useState<RowChoice[]>(initialChoices)

  const setChoice = (idx: number, patch: Partial<RowChoice>) =>
    setChoices(prev => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)))

  const setMode = (idx: number, mode: MoveMode) =>
    setChoices(prev =>
      prev.map((c, i) => {
        if (i !== idx) return c
        const options = optionsOf(i, mode)
        return { ...c, mode, version: options.includes(c.version) ? c.version : pickPreferred(options) ?? c.version }
      })
    )

  // 일괄: 회로가 있는 파티는 모두 회로 버전으로
  const applyAllCircuit = () =>
    setChoices(prev =>
      prev.map((c, i) =>
        circuitByRow[i].length > 0
          ? { ...c, mode: 'circuit', version: circuitByRow[i].includes(c.version) ? c.version : pickPreferred(circuitByRow[i])! }
          : c
      )
    )

  // 일괄: 회로 삭제 후 지정 버전으로 (공명자가 모두 출시된 파티에만 적용)
  const applyAllFree = (version: string) =>
    setChoices(prev => prev.map((c, i) => (allowedByRow[i].includes(version) ? { ...c, mode: 'free', version } : c)))

  const includedCount = choices.filter(c => c.include).length

  const handleConfirm = () => {
    onConfirm(
      rows
        .map((row, i) => ({ row, choice: choices[i] }))
        .filter(({ choice }) => choice.include)
        .map(({ row, choice }) => ({ row, version: choice.version, resetCircuit: choice.mode === 'free' }))
    )
  }

  const modeBtn = (active: boolean, disabled = false) =>
    `px-2 py-0.5 rounded-md text-[10.5px] sm:text-[11px] font-bold border transition-colors select-none whitespace-nowrap ${
      active
        ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
        : disabled
          ? 'text-zinc-700 border-[#1c1c24] cursor-not-allowed'
          : 'bg-[#09090d] text-zinc-400 border-[#262630] hover:text-zinc-200 cursor-pointer'
    }`

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
            이제 버전마다 파티가 따로 저장됩니다. 저장돼 있던 파티 {rows.length}개를
            <b className="text-zinc-200"> 회로 버전에 넣을지</b>, <b className="text-zinc-200">회로를 삭제하고 원하는 버전에 넣을지</b> 골라 주세요.
            회로를 고르지 않은 파티는 최신 버전으로 안내합니다.
          </p>
        </div>

        {/* Bulk actions */}
        <div className="flex flex-col gap-1.5 mt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] sm:text-xs font-bold text-zinc-400 w-16">일괄 지정</span>
            <button type="button" onClick={() => setChoices(initialChoices())} className={COMMON_STYLES.subBtn}>
              추천대로
            </button>
            <button type="button" onClick={applyAllCircuit} className={COMMON_STYLES.subBtn}>
              전체 회로 버전으로
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] sm:text-xs font-bold text-zinc-400 w-16">회로 삭제</span>
            {GAME_VERSIONS.map(v => (
              <button key={v} type="button" onClick={() => applyAllFree(v)} className={COMMON_STYLES.subBtn}>
                전체 {v}
                {LEAK_VERSIONS.includes(v) && <span className="text-amber-500/80 text-[9px]">유출</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="mt-3 flex flex-col gap-2 max-h-[52vh] overflow-y-auto pr-1">
          {rows.map((row, i) => {
            const choice = choices[i]
            const resolved = resolveCircuitBuff(row.circuitBuffId)
            const hasCircuitOption = circuitByRow[i].length > 0
            const options = optionsOf(i, choice.mode)
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
                      className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#09090d] border border-[#262630] p-1 flex items-center justify-center ${
                        choice.mode === 'free' && resolved ? 'opacity-30' : ''
                      }`}
                      title={resolved ? resolved.buff.name : '회로 미선택'}
                    >
                      {resolved ? (
                        <img src={resolved.buff.iconUrl} alt={resolved.buff.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[8px] text-zinc-600 font-bold">회로 X</span>
                      )}
                      {choice.mode === 'free' && resolved && (
                        <span className="absolute inset-0 flex items-center justify-center text-rose-400 text-lg font-black">✕</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 w-full sm:w-auto sm:ml-auto items-end">
                    {/* Move mode */}
                    {resolved && (
                      <div role="radiogroup" aria-label={`${i + 1}번 파티 이동 방식`} className="flex gap-1">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={choice.mode === 'circuit'}
                          disabled={!hasCircuitOption || !choice.include}
                          onClick={() => setMode(i, 'circuit')}
                          className={modeBtn(choice.mode === 'circuit', !hasCircuitOption)}
                        >
                          회로 버전에 넣기
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={choice.mode === 'free'}
                          disabled={!choice.include}
                          onClick={() => setMode(i, 'free')}
                          className={modeBtn(choice.mode === 'free')}
                        >
                          회로 삭제 후 원하는 버전
                        </button>
                      </div>
                    )}
                    {/* Version choices */}
                    <div role="radiogroup" aria-label={`${i + 1}번 파티 버전`} className="flex flex-nowrap gap-1">
                      {GAME_VERSIONS.map(v => {
                        const disabled = !options.includes(v) || !choice.include
                        const active = choice.version === v
                        return (
                          <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={disabled}
                            onClick={() => setChoice(i, { version: v })}
                            className={`px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold border transition-colors select-none ${
                              active
                                ? 'bg-amber-400 text-zinc-950 border-amber-400'
                                : disabled
                                  ? 'bg-transparent text-zinc-700 border-[#1c1c24] cursor-not-allowed line-through'
                                  : 'bg-[#09090d] text-zinc-400 border-[#262630] hover:text-zinc-200 cursor-pointer'
                            }`}
                          >
                            {v}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <p className="mt-1.5 text-[10px] sm:text-[11px] text-zinc-500 leading-snug break-keep pl-6">
                  추천 {suggestions[i].version} · {suggestions[i].reason}
                  {required && ` · 공명자 ${required}+`}
                  {resolved && !hasCircuitOption && ' · 공명자 출시 버전에 이 회로가 없어 회로 삭제만 가능'}
                  {choice.include && choice.mode === 'free' && resolved && (
                    <span className="text-rose-400 font-semibold"> · 회로 삭제 후 {choice.version}에 넣습니다</span>
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
