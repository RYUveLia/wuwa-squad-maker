import { useState, useRef, useEffect } from 'react'
import { COMMON_STYLES } from '../styles/theme'
import type { Character } from '../types'

interface ImageExportModalProps {
  isOpen: boolean
  squads: (Character | null)[][]
  onClose: () => void
  showToast: (msg: string) => void
}

export function ImageExportModal({
  isOpen,
  squads,
  onClose,
  showToast
}: ImageExportModalProps) {
  const [layout, setLayout] = useState<'2col' | '1col'>('2col')
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
    : squads.slice(0, 1).map((squad, idx) => ({ squad, idx }))

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
        backgroundColor: '#020617', // slate-950
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
        backgroundColor: '#020617',
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
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h3 className={MODAL_STYLES.title}>📸 파티 배치도 이미지 저장</h3>
            {/* 2열 / 1열 전환 탭 */}
            <div className={MODAL_STYLES.tabBar}>
              <button
                type="button"
                onClick={() => setLayout('2col')}
                className={MODAL_STYLES.tabButton(layout === '2col')}
              >
                2열 (2×N)
              </button>
              <button
                type="button"
                onClick={() => setLayout('1col')}
                className={MODAL_STYLES.tabButton(layout === '1col')}
              >
                1열 (1×N)
              </button>
            </div>
          </div>
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
            {/* Renderable Capture Board */}
            <div
              ref={boardRef}
              className={MODAL_STYLES.boardContainer(layout === '2col')}
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

              {/* Squads Grid (2xN or 1xN) */}
              <div className={MODAL_STYLES.squadsGrid(layout === '2col')}>
                {displaySquads.map(({ squad, idx }) => {
                  const numStr = String(idx + 1).padStart(2, '0')
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

                      {/* Center: 3 Character Slots */}
                      <div className={MODAL_STYLES.slotsRow}>
                        {squad.map((char, slotIdx) => (
                          <div
                            key={slotIdx}
                            className={MODAL_STYLES.slotBox}
                          >
                            {char ? (
                              <>
                                <img
                                  src={char.img}
                                  alt={char.name}
                                  className={MODAL_STYLES.charImage}
                                  draggable="false"
                                />
                                <div className={MODAL_STYLES.charNameOverlay}>
                                  {char.name}
                                </div>
                              </>
                            ) : (
                              <div className={MODAL_STYLES.emptySlot}>
                                <span className={MODAL_STYLES.emptyPlus}>＋</span>
                                <span className={MODAL_STYLES.emptyLabel}>
                                  {slotIdx + 1}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Right: Squad Label Badge */}
                      <div className={MODAL_STYLES.squadLabelArea}>
                        <span className={MODAL_STYLES.squadBadge}>
                          {idx + 1}번 파티
                        </span>
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
  header: 'flex items-center justify-between pb-3 border-b border-slate-800/80 select-none gap-2 shrink-0',
  title: 'text-sm sm:text-base font-bold text-slate-200 flex items-center gap-1.5',
  tabBar: 'flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 select-none',
  tabButton: (isActive: boolean) =>
    `px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
      isActive
        ? 'bg-purple-600 text-white shadow-sm'
        : 'text-slate-400 hover:text-slate-200'
    }`,
  closeButton: 'text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg text-sm select-none cursor-pointer',
  previewArea: 'flex-1 overflow-auto my-3 bg-slate-950/60 rounded-xl border border-slate-900 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent',
  
  // Capture Board Styles
  boardContainer: (is2Col: boolean) =>
    `bg-slate-950 text-slate-100 p-5 sm:p-6 rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col gap-4 select-none ${
      is2Col ? 'w-[960px]' : 'w-[520px]'
    }`,
  boardHeader: 'flex items-center justify-between border-b border-slate-800/80 pb-3',
  boardTitle: 'text-lg sm:text-xl font-extrabold bg-gradient-to-r from-purple-400 via-cyan-400 to-amber-400 bg-clip-text text-transparent tracking-tight',
  boardSubtitle: 'text-xs text-slate-400 font-semibold mt-0.5',
  boardDateBadge: 'text-xs font-mono font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md',
  
  squadsGrid: (is2Col: boolean) =>
    is2Col ? 'grid grid-cols-2 gap-3.5' : 'flex flex-col gap-3.5',
  squadCard: 'bg-slate-900/70 border border-slate-800/90 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-md',
  squadNumberArea: 'flex items-center justify-center flex-shrink-0 w-8',
  squadNumberText: 'text-xl sm:text-2xl font-black font-mono text-slate-500 tracking-wider',
  slotsRow: 'flex flex-row gap-2.5 justify-center flex-1',
  slotBox: 'w-18 h-18 sm:w-20 sm:h-20 aspect-square rounded-xl bg-slate-950/80 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center shadow-inner',
  charImage: 'w-full h-full object-cover',
  charNameOverlay: 'absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-[2px] text-[10px] sm:text-[11px] font-bold text-slate-200 text-center py-0.5 truncate px-1 border-t border-slate-800/60',
  emptySlot: 'flex flex-col items-center justify-center text-slate-600',
  emptyPlus: 'text-base sm:text-lg leading-none',
  emptyLabel: 'text-[9.5px] font-bold mt-0.5 text-slate-500',
  squadLabelArea: 'flex flex-col items-end flex-shrink-0 min-w-[65px]',
  squadBadge: 'text-[10.5px] sm:text-[11.5px] font-bold px-2 py-0.5 rounded border tracking-wide uppercase text-purple-400 bg-purple-950/30 border-purple-900/60 whitespace-nowrap',
  
  footer: 'flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-800/80 shrink-0 select-none',
  infoText: 'text-[11px] sm:text-xs text-slate-400 text-center sm:text-left break-keep'
}
