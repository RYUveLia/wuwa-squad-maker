import { DndContext } from '@dnd-kit/core'

// 타입, 상수, 데이터 및 하위 컴포넌트 가져오기
import { ELEMENT_KR_MAP } from './constants'
import { Toast } from './components/Toast'
import { DraggableCharacterCard } from './components/DraggableCharacterCard'
import { DroppableSquadSlot } from './components/DroppableSquadSlot'
import { DroppableCharacterPool } from './components/DroppableCharacterPool'

// 커스텀 훅 가져오기
import { useSquadState } from './hooks/useSquadState'

function App() {
  const {
    squads,
    selectedElement,
    setSelectedElement,
    toast,
    sensors,
    handleAddSquad,
    handleDeleteSquad,
    handleSelectCharacter,
    handleRemoveCharacter,
    handleExport,
    handleImport,
    handleCapture,
    handleDragEnd,
    getAssignedSquadIndices,
    elements,
    filteredCharacters,
    isCharacterMaxedOut,
    getMaxDeployment
  } = useSquadState()

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={LAYOUT_STYLES.wrapper}>
        
        {/* Header */}
        <header className={HEADER_STYLES.container}>
          <h1 className={HEADER_STYLES.title}>
            WuWa Matrix Squad Maker
          </h1>
          <p className={HEADER_STYLES.description}>
            명조: 워더링 웨이브 종말 매트릭스 다중 파티 구성 시뮬레이터 <br />
            일부 공명자<span className="text-purple-400 font-semibold">(설지, 복링, 벨리나, 파수인, 모니에, 수수)</span> 및 <span className="text-amber-400 font-bold">3.5 시즌 버프 대상인 치사</span>는 최대 2회까지 중복 편성이 허용됩니다.
          </p>
        </header>

        {/* 2-Column Split Layout */}
        <div className={LAYOUT_STYLES.splitGrid}>
          
          {/* LEFT COLUMN: Character Pool */}
          <section className={LAYOUT_STYLES.leftColumn}>
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
                    onClick={() => {
                      let targetSquadIdx = -1
                      let targetSlotIdx = -1
                      
                      for (let s = 0; s < squads.length; s++) {
                        if (squads[s].some(slot => slot && slot.id === char.id)) {
                          continue
                        }
                        const emptySlot = squads[s].findIndex(slot => slot === null)
                        if (emptySlot !== -1) {
                          targetSquadIdx = s
                          targetSlotIdx = emptySlot
                          break
                        }
                      }

                      if (targetSquadIdx !== -1 && targetSlotIdx !== -1) {
                        handleSelectCharacter(char, targetSquadIdx, targetSlotIdx)
                      } else {
                        handleSelectCharacter(char, 0, 0)
                      }
                    }}
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
                  onClick={handleImport}
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
              {squads.map((squad, squadIdx) => {
                const numStr = String(squadIdx + 1).padStart(2, '0')

                return (
                  <div 
                    key={squadIdx}
                    className={SQUAD_LIST_STYLES.row}
                  >
                    {/* Left: Squad Number Badge */}
                    <div className={SQUAD_LIST_STYLES.numberBadgeArea}>
                      <span className={SQUAD_LIST_STYLES.numberText}>
                        {numStr}
                      </span>
                    </div>

                    {/* Center: Slots Row */}
                    <div className={SQUAD_LIST_STYLES.slotsArea}>
                      {squad.map((char, slotIdx) => {
                        const slotName = slotIdx === 0 ? '메인 딜러' : slotIdx === 1 ? '서브 딜러' : '서포터'
                        return (
                          <DroppableSquadSlot
                            key={slotIdx}
                            id={`party-${squadIdx}-slot-${slotIdx}`}
                            char={char}
                            slotName={slotName}
                            onRemove={() => handleRemoveCharacter(squadIdx, slotIdx)}
                            squadIdx={squadIdx}
                            slotIdx={slotIdx}
                          />
                        )
                      })}
                    </div>

                    {/* Right: Actions and Status */}
                    <div className={SQUAD_LIST_STYLES.actionArea}>
                      <span className={SQUAD_LIST_STYLES.squadLabel}>
                        {squadIdx + 1}번 파티
                      </span>
                      {squads.length > 1 && (
                        <button
                          onClick={() => handleDeleteSquad(squadIdx)}
                          className={SQUAD_LIST_STYLES.deleteBtn}
                          title="파티 제거"
                        >
                          제거
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* [+ 새로운 파티 추가] 가로 슬라이드형 바 */}
              <div 
                onClick={handleAddSquad}
                className={SQUAD_LIST_STYLES.addSquadBar}
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

      </div>
    </DndContext>
  )
}

export default App

// STYLES (ads-admin Colocation Style Pattern)
const LAYOUT_STYLES = {
  wrapper: 'min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-6 px-4 font-sans selection:bg-purple-500 selection:text-white animate-fade-in max-w-full',
  splitGrid: 'w-full max-w-7xl flex flex-col lg:flex-row gap-6 items-stretch flex-1',
  leftColumn: 'w-full lg:w-[45%] bg-slate-900/30 border border-slate-800/40 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col max-h-[76vh]',
  rightColumn: 'w-full lg:w-[55%] flex flex-col gap-4 max-h-[76vh]'
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
  }`
}

const SQUAD_LIST_STYLES = {
  toolbar: 'flex items-center justify-between bg-slate-900/30 border border-slate-800/40 p-3 rounded-2xl select-none flex-shrink-0',
  toolbarTitle: 'text-xs md:text-sm font-bold text-slate-300 px-1',
  toolbarBtnArea: 'flex gap-2',
  toolbarBtn: 'px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 rounded-lg cursor-pointer transition-colors',
  scroller: 'flex flex-col gap-4 overflow-y-auto pr-1 flex-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent p-1',
  row: 'bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md shadow-md flex flex-row items-center justify-between gap-4 animate-scale-up select-none',
  numberBadgeArea: 'flex items-center gap-3 select-none flex-shrink-0',
  numberText: 'text-2xl md:text-3xl font-black font-mono text-slate-500 tracking-wider',
  slotsArea: 'flex flex-row gap-3 flex-1 justify-center max-w-md',
  actionArea: 'flex flex-col items-end gap-1.5 select-none flex-shrink-0 min-w-[85px]',
  squadLabel: 'text-[11px] md:text-xs font-bold px-2.5 py-0.5 rounded border tracking-wide uppercase text-purple-400 bg-purple-950/20 border-purple-900/50',
  deleteBtn: 'text-[11px] md:text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 px-2.5 py-0.5 rounded cursor-pointer transition-colors',
  addSquadBar: 'bg-slate-900/10 border-2 border-dashed border-slate-800/60 hover:border-purple-500/50 hover:bg-slate-900/25 rounded-2xl py-4 flex flex-row items-center justify-center cursor-pointer group transition-all duration-300 select-none flex-shrink-0 gap-2',
  addSquadPlus: 'text-xl text-slate-500 group-hover:text-purple-400 group-hover:scale-110 transition-all duration-300',
  addSquadText: 'text-sm font-bold text-slate-400 group-hover:text-purple-300 transition-colors'
}
