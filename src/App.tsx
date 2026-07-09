import { useState } from 'react'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

// 공용 스타일 시스템 가져오기
import { COMMON_STYLES } from './styles/theme'

// 타입, 상수, 데이터 및 하위 컴포넌트 가져오기
import { ELEMENT_KR_MAP } from './constants'
import { Toast } from './components/Toast'
import { DraggableCharacterCard } from './components/DraggableCharacterCard'
import { DroppableCharacterPool } from './components/DroppableCharacterPool'
import { SortableSquadRow } from './components/SortableSquadRow'
import { ImportModal } from './components/ImportModal'
import { ResonatorSelectModal } from './components/ResonatorSelectModal'
import { OwnedResonatorModal } from './components/OwnedResonatorModal'
import { TurnstileGate } from './components/TurnstileGate'
import { ConfirmModal } from './components/ConfirmModal'

// 커스텀 훅 및 유틸리티 가져오기
import { useSquadState } from './hooks/useSquadState'
import { getDoubleDeploymentNamesText } from './utils/character'

function App() {
  const {
    squads,
    selectedElement,
    setSelectedElement,
    toast,
    sensors,
    handleAddSquad,
    handleDeleteSquad,
    handleToggleCharacter,
    handleRemoveCharacter,
    handleExport,
    handleImport,
    handleCapture,
    handleDragStart,
    handleDragEnd,
    getAssignedSquadIndices,
    elements,
    filteredCharacters,
    isCharacterMaxedOut,
    getMaxDeployment,
    squadIds,
    importModalOpen,
    setImportModalOpen,
    activeSquadIdxForMobile,
    setActiveSquadIdxForMobile,
    handleSelectCharacter,
    ownedResonatorIds,
    showOnlyOwned,
    setShowOnlyOwned,
    ownedModalOpen,
    setOwnedModalOpen,
    handleResetSquads,
    handleSaveOwnedResonators,
    confirmModalOpen,
    setConfirmModalOpen,
    confirmAction,
    activeDragChar,
    showLeakInfo,
    setShowLeakInfo
  } = useSquadState()

  const [isVerified, setIsVerified] = useState<boolean>(false)

  if (!isVerified) {
    return <TurnstileGate onVerify={() => setIsVerified(true)} />
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={LAYOUT_STYLES.wrapper}>
        
        {/* Header */}
        <header className={HEADER_STYLES.container}>
          <h1 className={HEADER_STYLES.title}>
            WuWa Matrix Squad Maker
          </h1>
          <p className={HEADER_STYLES.description}>
            명조: 워더링 웨이브 종말 매트릭스 다중 파티 구성 시뮬레이터 <br />
            일부 공명자<span className="text-purple-400 font-semibold">{getDoubleDeploymentNamesText(showLeakInfo)}</span> 및 <span className="text-amber-400 font-bold">3.5 시즌 버프 대상인 치사</span>는 최대 2회까지 중복 편성이 허용됩니다.
          </p>
        </header>

        {/* 2-Column Split Layout */}
        <div className={LAYOUT_STYLES.splitGrid}>
          
          {/* LEFT COLUMN: Character Pool */}
          <section className={`${LAYOUT_STYLES.leftColumn} hidden lg:flex`}>
            <div className={RESONATOR_POOL_STYLES.header}>
              <div className={RESONATOR_POOL_STYLES.titleArea}>
                <h3 className={RESONATOR_POOL_STYLES.title}>공명자 도감 ({filteredCharacters.length})</h3>
                <span className={RESONATOR_POOL_STYLES.subtitle}>최신순 정렬 (치사는 3.5 시즌 임시 2회 적용)</span>
              </div>
              
              {/* Element Filter */}
              <div className={RESONATOR_POOL_STYLES.filterBar}>
                {elements.map((elem) => (
                  <button
                    key={elem}
                    onClick={() => setSelectedElement(elem)}
                    className={RESONATOR_POOL_STYLES.filterButton(selectedElement === elem)}
                  >
                    {ELEMENT_KR_MAP[elem] || elem}
                  </button>
                ))}
              </div>

              {/* Owned Resonators Filtering bar */}
              <div className={RESONATOR_POOL_STYLES.ownedFilterBar}>
                <button
                  onClick={() => setOwnedModalOpen(true)}
                  className={RESONATOR_POOL_STYLES.ownedSettingsBtn}
                >
                  ⚙️ 보유 공명자 설정
                </button>
                <div className="flex items-center gap-3.5">
                  <label className={RESONATOR_POOL_STYLES.ownedFilterLabel}>
                    <input
                      type="checkbox"
                      checked={showOnlyOwned}
                      onChange={(e) => setShowOnlyOwned(e.target.checked)}
                      className={RESONATOR_POOL_STYLES.ownedCheckbox}
                    />
                    보유한 공명자만 보기
                  </label>

                  {/* Leak Filter Toggle Button */}
                  <div className="flex items-center gap-2 border-l border-slate-800/80 pl-3.5">
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-400 select-none">유출 정보</span>
                    <button
                      role="switch"
                      aria-checked={showLeakInfo}
                      onClick={() => setShowLeakInfo(!showLeakInfo)}
                      className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full items-center transition-colors duration-200 ease-in-out focus:outline-none select-none border border-slate-700/60 ${
                        showLeakInfo 
                          ? 'bg-purple-600/90 shadow-[0_0_8px_rgba(168,85,247,0.35)]' 
                          : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow ring-0 transition-all duration-200 ease-in-out ${
                          showLeakInfo ? 'translate-x-5 bg-white' : 'translate-x-0.5 bg-slate-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Droppable Scroller Container */}
            <DroppableCharacterPool>
              {filteredCharacters.map((char) => {
                const assignedSquadIndices = getAssignedSquadIndices(char.id)
                const maxAllowed = getMaxDeployment(char.id)
                const isMaxedOut = isCharacterMaxedOut(char.id)

                return (
                  <DraggableCharacterCard
                    key={char.id}
                    char={char}
                    assignedSquadIndices={assignedSquadIndices}
                    isMaxedOut={isMaxedOut}
                    maxAllowed={maxAllowed}
                    onClick={() => handleToggleCharacter(char)}
                  />
                )
              })}
            </DroppableCharacterPool>
          </section>

          {/* RIGHT COLUMN: Squads List */}
          <main className={LAYOUT_STYLES.rightColumn}>
            
            {/* Top Toolbar */}
            <div className={SQUAD_LIST_STYLES.toolbar}>
              <span className={SQUAD_LIST_STYLES.toolbarTitle}>파티 편성 현황</span>
              <div className={SQUAD_LIST_STYLES.toolbarBtnArea}>
                <button
                  onClick={handleResetSquads}
                  className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                >
                  초기화
                </button>
                <button
                  onClick={handleCapture}
                  className={SQUAD_LIST_STYLES.toolbarBtn}
                >
                  이미지로 저장
                </button>
                <button
                  onClick={handleExport}
                  className={SQUAD_LIST_STYLES.toolbarBtn}
                >
                  내보내기
                </button>
                <button
                  onClick={() => setImportModalOpen(true)}
                  className={SQUAD_LIST_STYLES.toolbarBtn}
                >
                  불러오기
                </button>
              </div>
            </div>

            {/* Scrollable Container */}
            <div 
              id="squads-container" 
              className={SQUAD_LIST_STYLES.scroller}
            >
              <SortableContext items={squadIds} strategy={verticalListSortingStrategy}>
                {squads.map((squad, squadIdx) => (
                  <SortableSquadRow
                    key={squadIds[squadIdx]}
                    id={squadIds[squadIdx]}
                    squadIdx={squadIdx}
                    squad={squad}
                    squadsLength={squads.length}
                    handleRemoveCharacter={handleRemoveCharacter}
                    handleDeleteSquad={handleDeleteSquad}
                    onSlotClick={(sIdx, _slotIdx) => {
                      if (window.innerWidth < 1024) {
                        setActiveSquadIdxForMobile(sIdx)
                      }
                    }}
                  />
                ))}
              </SortableContext>

              {/* [+ 새로운 파티 추가] 가로 슬라이드형 바 */}
              <div 
                onClick={handleAddSquad}
                className={SQUAD_LIST_STYLES.addSquadBar}
                data-capture-exclude="true"
              >
                <span className={SQUAD_LIST_STYLES.addSquadPlus}>
                  ＋
                </span>
                <span className={SQUAD_LIST_STYLES.addSquadText}>
                  새로운 파티 추가
                </span>
              </div>
            </div>
          </main>
          
        </div>

        {/* Toast Popup Notification */}
        {toast && <Toast message={toast} />}

        {/* Import Modal */}
        {importModalOpen && (
          <ImportModal
            onImport={handleImport}
            onClose={() => setImportModalOpen(false)}
          />
        )}

        {/* Mobile Resonator Selector Bottom Sheet */}
        {activeSquadIdxForMobile !== null && (
          <ResonatorSelectModal
            onSelect={(char) => {
              const currentSquad = squads[activeSquadIdxForMobile]
              if (currentSquad.some(slot => slot && slot.id === char.id)) {
                return
              }
              const emptySlotIdx = currentSquad.findIndex(slot => slot === null)
              if (emptySlotIdx !== -1) {
                const alreadyDeployedCount = currentSquad.filter(Boolean).length
                handleSelectCharacter(char, activeSquadIdxForMobile, emptySlotIdx)
                if (alreadyDeployedCount === 2) {
                  setActiveSquadIdxForMobile(null)
                }
              }
            }}
            onClose={() => setActiveSquadIdxForMobile(null)}
            getAssignedSquadIndices={getAssignedSquadIndices}
            isCharacterMaxedOut={isCharacterMaxedOut}
            getMaxDeployment={getMaxDeployment}
            filteredCharacters={filteredCharacters}
            elements={elements}
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
            activeSquadIdx={activeSquadIdxForMobile}
            currentSquad={squads[activeSquadIdxForMobile]}
            onRemoveSlot={(slotIdx) => handleRemoveCharacter(activeSquadIdxForMobile, slotIdx)}
            showOnlyOwned={showOnlyOwned}
            setShowOnlyOwned={setShowOnlyOwned}
            onOpenOwnedSettings={() => setOwnedModalOpen(true)}
          />
        )}
        {/* Owned Resonators Selector Modal */}
        {ownedModalOpen && (
          <OwnedResonatorModal
            isOpen={ownedModalOpen}
            onClose={() => setOwnedModalOpen(false)}
            ownedIds={ownedResonatorIds}
            onSave={handleSaveOwnedResonators}
          />
        )}
        
        {/* Confirm Action Modal */}
        {confirmModalOpen && confirmAction && (
          <ConfirmModal
            isOpen={confirmModalOpen}
            message={confirmAction.message}
            subMessage={confirmAction.subMessage}
            confirmText={confirmAction.confirmText}
            onConfirm={() => {
              confirmAction.onConfirm()
              setConfirmModalOpen(false)
            }}
            onCancel={() => setConfirmModalOpen(false)}
          />
        )}
      </div>

      {/* Drag Overlay — 마우스 커서를 정확히 따라다니는 프리뷰 카드 */}
      <DragOverlay dropAnimation={null}>
        {activeDragChar ? (
          <div className="w-20 h-24 bg-slate-900 border-2 border-purple-500 rounded-xl p-1.5 flex flex-col items-center shadow-2xl shadow-purple-500/30 pointer-events-none">
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-800">
              <img src={activeDragChar.img} alt={activeDragChar.name} className="w-full h-full object-cover" />
            </div>
            <span className="mt-1 text-[9px] font-bold text-slate-200 truncate w-full text-center">{activeDragChar.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default App

// STYLES (ads-admin Colocation Style Pattern)
const LAYOUT_STYLES = {
  wrapper: 'min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-3 px-2 sm:py-6 sm:px-4 font-sans selection:bg-purple-500 selection:text-white animate-fade-in max-w-full',
  splitGrid: 'w-full max-w-7xl flex flex-col lg:flex-row gap-3 lg:gap-6 items-stretch flex-1',
  leftColumn: 'w-full lg:w-[43%] bg-slate-900/30 border border-slate-800/40 rounded-2xl p-4 md:p-5 backdrop-blur-sm shadow-xl flex flex-col max-h-none lg:max-h-[76vh] lg:overflow-hidden',
  rightColumn: 'w-full lg:w-[57%] flex flex-col gap-3 lg:gap-4 max-h-none lg:max-h-[76vh] lg:overflow-hidden'
}

const HEADER_STYLES = {
  container: 'text-center mb-8 max-w-xl select-none',
  title: 'text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-cyan-400 to-amber-500 bg-clip-text text-transparent drop-shadow-sm',
  description: 'text-slate-400 mt-2 text-sm md:text-base leading-relaxed'
}

const RESONATOR_POOL_STYLES = {
  header: 'flex flex-col gap-4 select-none flex-shrink-0',
  titleArea: 'flex items-baseline justify-between',
  title: 'text-base md:text-lg font-bold text-slate-200',
  subtitle: 'text-xs text-slate-500',
  filterBar: 'flex flex-wrap gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80',
  filterButton: (isActive: boolean) => `px-3 py-1 text-xs md:text-sm font-semibold rounded-md transition-all duration-200 cursor-pointer ${
    isActive ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
  }`,
  ownedFilterBar: 'flex items-center justify-between px-1.5 py-1 mb-3.5 select-none bg-slate-950/20 border border-slate-900 rounded-xl',
  ownedSettingsBtn: COMMON_STYLES.subBtn,
  ownedFilterLabel: COMMON_STYLES.checkboxLabel,
  ownedCheckbox: COMMON_STYLES.checkboxInput
}

const SQUAD_LIST_STYLES = {
  toolbar: 'flex items-center justify-between bg-slate-900/30 border border-slate-800/40 p-2 sm:p-3 rounded-2xl select-none flex-shrink-0 gap-1.5 sm:gap-2',
  toolbarTitle: 'text-[11px] sm:text-xs md:text-sm font-bold text-slate-300 px-1 whitespace-nowrap flex-shrink-0',
  toolbarBtnArea: 'flex gap-1 sm:gap-2',
  toolbarBtn: 'px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9.5px] sm:text-[11px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 rounded-lg cursor-pointer transition-colors whitespace-nowrap',
  scroller: 'flex flex-col gap-4 overflow-y-visible lg:overflow-y-auto pr-1 flex-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent p-1',
  addSquadBar: 'bg-slate-900/10 border-2 border-dashed border-slate-800/60 hover:border-purple-500/50 hover:bg-slate-900/25 rounded-2xl py-4 flex flex-row items-center justify-center cursor-pointer group transition-all duration-300 select-none flex-shrink-0 gap-2',
  addSquadPlus: 'text-xl text-slate-500 group-hover:text-purple-400 group-hover:scale-110 transition-all duration-300',
  addSquadText: 'text-sm font-bold text-slate-400 group-hover:text-purple-300 transition-colors'
}
