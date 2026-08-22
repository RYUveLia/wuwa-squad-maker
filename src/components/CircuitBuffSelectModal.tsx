import { CIRCUIT_BUFFS, type CircuitBuff } from '../constants/circuitBuffs'
import { COMMON_STYLES } from '../styles/theme'

interface CircuitBuffSelectModalProps {
  squadIdx: number
  selectedBuffId: string | null
  onSelectBuff: (squadIdx: number, buffId: string | null) => void
  onClose: () => void
}

export function CircuitBuffSelectModal({
  squadIdx,
  selectedBuffId,
  onSelectBuff,
  onClose
}: CircuitBuffSelectModalProps) {
  const handleSelect = (buff: CircuitBuff) => {
    // 이미 선택된 버프를 다시 누르면 토글 해제하거나 다시 선택
    if (selectedBuffId === buff.id) {
      onSelectBuff(squadIdx, null)
    } else {
      onSelectBuff(squadIdx, buff.id)
    }
    onClose()
  }

  const handleClear = () => {
    onSelectBuff(squadIdx, null)
    onClose()
  }

  return (
    <div className={COMMON_STYLES.modalOverlay} onClick={onClose}>
      <div 
        className={`${COMMON_STYLES.modalContainer} max-w-2xl w-full p-4 sm:p-6 animate-scale-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#262630]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-xs sm:text-sm px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40">
                {squadIdx + 1}번 파티
              </span>
              <h2 className="text-base sm:text-xl font-black text-zinc-100 tracking-tight">
                특이점 확장 회로 버프 선택
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-1">
              파티에 적용할 특이점 확장 시즌 회로 버프를 선택해 주세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 text-lg sm:text-xl transition-colors cursor-pointer px-1 leading-none select-none"
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* Buff Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 my-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {CIRCUIT_BUFFS.map((buff) => {
            const isSelected = selectedBuffId === buff.id

            return (
              <button
                key={buff.id}
                type="button"
                onClick={() => handleSelect(buff)}
                className={`flex flex-col text-left p-3 sm:p-3.5 rounded-xl border transition-all duration-200 cursor-pointer relative group ${
                  isSelected
                    ? 'bg-amber-950/20 border-amber-400 shadow-[0_0_15px_rgba(251,189,35,0.15)] ring-1 ring-amber-400/50'
                    : 'bg-[#14141a] border-[#262630] hover:bg-[#1a1a22] hover:border-zinc-700'
                }`}
              >
                {/* Header with Icon & Title */}
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center p-1.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    isSelected ? 'bg-amber-400/20 border border-amber-400/50' : 'bg-[#09090d] border border-[#262630]'
                  }`}>
                    <img 
                      src={buff.iconUrl} 
                      alt={buff.name} 
                      className="w-full h-full object-contain filter drop-shadow"
                      crossOrigin="anonymous"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className={`text-xs sm:text-sm font-bold truncate ${
                        isSelected ? 'text-amber-400' : 'text-zinc-100 group-hover:text-amber-300'
                      }`}>
                        {buff.name}
                      </h3>
                      {isSelected && (
                        <span className="text-[10px] font-extrabold text-amber-400 bg-amber-950/50 border border-amber-500/40 px-1.5 py-0.5 rounded">
                          선택됨
                        </span>
                      )}
                    </div>
                    <p className="text-[9.5px] sm:text-[10px] text-zinc-500 font-mono truncate">
                      {buff.nameEn}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-2.5 pt-2 border-t border-[#262630]/60 flex-1">
                  <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed break-keep whitespace-pre-line">
                    {buff.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#262630]">
          {selectedBuffId ? (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 rounded-lg cursor-pointer transition-colors"
            >
              버프 선택 해제
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className={COMMON_STYLES.confirmBtn}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
