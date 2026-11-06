import { useState } from 'react'
import { DndContext, DragOverlay } from '@dnd-kit/core'

import { useSquadState } from './hooks/useSquadState'
import { TurnstileGate } from './components/TurnstileGate'
import { AppHeader } from './components/layout/AppHeader'
import { ResonatorPoolPanel } from './components/layout/ResonatorPoolPanel'
import { SquadBoardPanel } from './components/layout/SquadBoardPanel'
import { AppModals } from './components/layout/AppModals'
import { DragPreview } from './components/layout/DragPreview'

function App() {
  const state = useSquadState()
  const [isVerified, setIsVerified] = useState(false)

  if (!isVerified) {
    return <TurnstileGate onVerify={() => setIsVerified(true)} />
  }

  return (
    <DndContext sensors={state.sensors} onDragStart={state.handleDragStart} onDragEnd={state.handleDragEnd}>
      <div className={LAYOUT_STYLES.wrapper}>
        <AppHeader
          currentVersion={state.currentVersion}
          versions={state.selectableVersions}
          onSelectVersion={state.setCurrentVersion}
        />

        <div className={LAYOUT_STYLES.splitGrid}>
          <ResonatorPoolPanel state={state} className={LAYOUT_STYLES.leftColumn} />
          <SquadBoardPanel state={state} className={LAYOUT_STYLES.rightColumn} />
        </div>

        <AppModals state={state} />
      </div>

      <DragOverlay dropAnimation={null}>
        {state.activeDragChar ? <DragPreview char={state.activeDragChar} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

export default App

// STYLES (ads-admin Colocation Style Pattern)
const LAYOUT_STYLES = {
  wrapper: 'min-h-screen bg-[#09090d] text-zinc-100 flex flex-col items-center py-3 px-2 sm:py-6 sm:px-4 font-sans selection:bg-amber-400 selection:text-black animate-fade-in max-w-full',
  splitGrid: 'w-full max-w-7xl flex flex-col lg:flex-row gap-3 lg:gap-6 items-stretch flex-1',
  leftColumn: 'w-full lg:w-[43%] bg-[#121217]/70 border border-[#262630] rounded-2xl p-4 md:p-5 backdrop-blur-sm shadow-xl flex flex-col max-h-none lg:max-h-[76vh] lg:overflow-hidden',
  rightColumn: 'w-full lg:w-[57%] flex flex-col gap-3 lg:gap-4 max-h-none lg:max-h-[76vh] lg:overflow-hidden'
}
