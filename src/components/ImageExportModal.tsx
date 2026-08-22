import { useState, useRef, useEffect } from 'react'
import { COMMON_STYLES } from '../styles/theme'
import type { Character } from '../types'
import { CIRCUIT_BUFFS } from '../constants/circuitBuffs'
import { getElementBorderClass } from './DroppableSquadSlot'

interface ImageExportModalProps {
  isOpen: boolean
  squads: (Character | null)[][]
  circuitBuffs?: (string | null)[]
  onClose: () => void
  showToast: (msg: string) => void
}

export function ImageExportModal({
  isOpen,
  squads,
  circuitBuffs,
  onClose,
  showToast
}: ImageExportModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // 비어있지 않은 파티 목록 필터링 (모두 비어있는 경우 최소 1개 파티 표시)
  const activeSquadsWithIndex = squads
    .map((squad, idx) => ({ squad, idx }))
    .filter(({ squad }) => squad.some((char) => char !== null))

  const displaySquads = activeSquadsWithIndex.length > 0
    ? activeSquadsWithIndex
    : [{ squad: [null, null, null], idx: 0 }]

  const currentDateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  // PNG 다운로드 핸들러
  const handleDownload = async () => {
    if (!boardRef.current || isProcessing) return
    setIsProcessing(true)
    showToast('파티 배치도 이미지 생성 중...')

    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(boardRef.current, {
        backgroundColor: '#09090d', // WuWa Tracker dark background
        pixelRatio: 2,
        cacheBust: true
      })

      const link = document.createElement('a')
      link.download = `wuwa-matrix-squad-${new Date().toISOString().slice(0, 10)}.png`
      link.href = dataUrl
      link.click()
      showToast('파티 배치도가 이미지(PNG)로 저장되었습니다!')
    } catch (err) {
      console.error(err)
      showToast('이미지 저장 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  // 클립보드 복사 핸들러
  const handleCopyClipboard = async () => {
    if (!boardRef.current || isProcessing) return
    setIsProcessing(true)
    showToast('이미지를 클립보드에 복사하는 중...')

    try {
      const { toBlob } = await import('html-to-image')
      const blob = await toBlob(boardRef.current, {
        backgroundColor: '#09090d',
        pixelRatio: 2,
        cacheBust: true
      })

      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        showToast('이미지가 클립보드에 복사되었습니다!')
      } else {
        throw new Error('Clipboard API unsupported')
      }
    } catch (err) {
      console.error(err)
      showToast('클립보드 복사를 지원하지 않는 브라우저입니다. 다운로드를 이용해 주세요.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={COMMON_STYLES.modalOverlay} onClick={onClose}>
      <div
        className={`${COMMON_STYLES.modalContainer} max-w-4xl max-h-[92vh] overflow-hidden p-3.5 sm:p-5`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={MODAL_STYLES.header}>
          <h3 className={MODAL_STYLES.title}>📸 파티 배치도 이미지 저장</h3>
          <button
            onClick={onClose}
            className={MODAL_STYLES.closeButton}
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className={MODAL_STYLES.previewArea}>
          <div className="flex justify-center min-w-full p-2 sm:p-4">
            {/* Renderable Capture Board (Fixed 2xN Layout) */}
            <div
              ref={boardRef}
              className={MODAL_STYLES.boardContainer}
            >
              {/* Header Branding Banner */}
              <div className={MODAL_STYLES.boardHeader}>
                <div>
                  <h4 className={MODAL_STYLES.boardTitle}>
                    WuWa Matrix Squad Maker
                  </h4>
                  <p className={MODAL_STYLES.boardSubtitle}>
                    명조: 워더링 웨이브 종말 매트릭스 파티 편성표
                  </p>
                </div>
                <div className={MODAL_STYLES.boardDateBadge}>
                  {currentDateStr}
                </div>
              </div>

              {/* Squads 2xN Grid */}
              <div className={MODAL_STYLES.squadsGrid}>
                {displaySquads.map(({ squad, idx }) => {
                  const numStr = String(idx + 1).padStart(2, '0')
                  const buffId = circuitBuffs ? circuitBuffs[idx] : null
                  const buff = buffId ? CIRCUIT_BUFFS.find((b) => b.id === buffId) : null

                  return (
                    <div
                      key={idx}
                      className={MODAL_STYLES.squadCard}
                    >
                      {/* Left: Squad Number */}
                      <div className={MODAL_STYLES.squadNumberArea}>
                        <span className={MODAL_STYLES.squadNumberText}>
                          {numStr}
                        </span>
                      </div>

                      {/* Center/Right: 3 Character Slots + Circuit Buff */}
                      <div className={MODAL_STYLES.slotsRow}>
                        {squad.map((char, slotIdx) => (
                          <div
                            key={slotIdx}
                            className={MODAL_STYLES.slotItem}
                          >
                            <div className={`${MODAL_STYLES.slotBox} ${char ? getElementBorderClass(char.element) : 'border-dashed border-[#262630]'}`}>
                              {char ? (
                                <img
                                  src={char.img}
                                  alt={char.name}
                                  className={MODAL_STYLES.charImage}
                                  draggable="false"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center select-none">
                                  <img
                                    src="/SP_FuncIconRole.webp"
                                    alt="공명자 슬롯"
                                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain opacity-25"
                                  />
                                </div>
                              )}
                            </div>
                            <span className={MODAL_STYLES.slotNameText}>
                              {char ? char.name : '-'}
                            </span>
                          </div>
                        ))}

                        {/* Circuit Buff Slot (Always rendered for consistent alignment) */}
                        <div className="flex items-center justify-center pl-1 sm:pl-1.5 border-l border-[#262630]/80">
                          <div className={MODAL_STYLES.slotItem}>
                            {buff ? (
                              <>
                                <div className={MODAL_STYLES.circuitBox}>
                                  <img
                                    src={buff.iconUrl}
                                    alt={buff.name}
                                    className="w-full h-full object-contain filter drop-shadow"
                                  />
                                </div>
                                <span className={MODAL_STYLES.circuitNameText}>
                                  {buff.name.replace(' 강화', '')}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className={`${MODAL_STYLES.slotBox} border-dashed border-[#262630] bg-[#0e0e13]`}>
                                  <img
                                    src="/circuits/T_Iconpropertyredattack_UI.webp"
                                    alt="미선택 회로"
                                    className="w-4 h-4 sm:w-5 sm:h-5 object-contain opacity-20"
                                  />
                                </div>
                                <span className="mt-1 text-[10px] sm:text-[11px] font-bold text-zinc-600 truncate w-full text-center whitespace-nowrap leading-tight">
                                  -
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className={MODAL_STYLES.footer}>
          <p className={MODAL_STYLES.infoText}>
            💡 2열(2×N) 배치로 이미지의 세로 길이를 줄여 깔끔하게 저장 및 공유할 수 있습니다.
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={onClose}
              className={COMMON_STYLES.cancelBtn}
            >
              닫기
            </button>
            <button
              onClick={handleCopyClipboard}
              disabled={isProcessing}
              className={COMMON_STYLES.cancelBtn}
              title="클립보드로 복사"
            >
              📋 클립보드 복사
            </button>
            <button
              onClick={handleDownload}
              disabled={isProcessing}
              className={COMMON_STYLES.confirmBtn}
            >
              {isProcessing ? '처리 중...' : '💾 PNG 다운로드'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const MODAL_STYLES = {
  header: 'flex items-center justify-between pb-3 border-b border-[#262630] select-none gap-2 shrink-0',
  title: 'text-sm sm:text-base font-bold text-zinc-200 flex items-center gap-1.5',
  closeButton: 'text-zinc-400 hover:text-zinc-200 transition-colors p-1.5 rounded-lg text-sm select-none cursor-pointer',
  previewArea: 'flex-1 overflow-auto my-3 bg-[#09090d]/80 rounded-xl border border-[#262630] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent',
  
  // Capture Board Styles (Fixed 2xN Width)
  boardContainer: 'bg-[#09090d] text-zinc-100 p-5 sm:p-6 rounded-2xl border border-[#262630] shadow-2xl flex flex-col gap-4 select-none w-[920px]',
  boardHeader: 'flex items-center justify-between border-b border-[#262630] pb-3',
  boardTitle: 'text-lg sm:text-xl font-extrabold text-white tracking-tight',
  boardSubtitle: 'text-xs text-zinc-400 font-semibold mt-0.5',
  boardDateBadge: 'text-xs font-mono font-bold text-amber-400 bg-[#14141a] border border-[#262630] px-2.5 py-1 rounded-md',
  
  squadsGrid: 'grid grid-cols-2 gap-3.5',
  squadCard: 'bg-[#14141a] border border-[#262630] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-md overflow-hidden',
  squadNumberArea: 'flex items-center justify-center flex-shrink-0 w-8 sm:w-9',
  squadNumberText: 'text-lg sm:text-xl font-black font-mono text-zinc-500 tracking-wider',
  slotsRow: 'flex flex-row gap-1.5 sm:gap-2 items-center justify-center flex-1',
  slotItem: 'flex flex-col items-center w-[64px] sm:w-[70px] flex-shrink-0',
  slotBox: 'w-full aspect-square rounded-xl bg-[#09090d] border border-[#262630] relative overflow-hidden flex flex-col items-center justify-center shadow-inner',
  slotNameText: 'mt-1 text-[10px] sm:text-[11px] font-bold text-zinc-200 truncate w-full text-center whitespace-nowrap leading-tight',
  circuitBox: 'w-full aspect-square rounded-xl border border-amber-400/50 bg-amber-950/15 p-1 flex items-center justify-center shadow-inner',
  circuitNameText: 'mt-1 text-[9.5px] sm:text-[10px] font-extrabold text-amber-400 truncate w-full text-center whitespace-nowrap leading-tight',
  charImage: 'w-full h-full object-cover',
  emptySlot: 'flex flex-col items-center justify-center text-zinc-600',
  emptyPlus: 'text-base sm:text-lg leading-none',
  emptyLabel: 'text-[9.5px] font-bold mt-0.5 text-zinc-500',
  
  footer: 'flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-[#262630] shrink-0 select-none',
  infoText: 'text-[11px] sm:text-xs text-zinc-400 text-center sm:text-left break-keep'
}
