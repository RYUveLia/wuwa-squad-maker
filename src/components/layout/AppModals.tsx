import type { Character } from '../../types'
import type { SquadState } from '../../hooks/useSquadState'
import { Toast } from '../Toast'
import { ImportModal } from '../ImportModal'
import { ImportTargetModal } from '../ImportTargetModal'
import { VersionMigrationModal } from '../VersionMigrationModal'
import { ResonatorSelectModal } from '../ResonatorSelectModal'
import { CircuitBuffSelectModal } from '../CircuitBuffSelectModal'
import { OwnedResonatorModal } from '../OwnedResonatorModal'
import { ConfirmModal } from '../ConfirmModal'
import { ImageExportModal } from '../ImageExportModal'

/** 앱 전역 모달·시트·토스트 */
export function AppModals({ state }: { state: SquadState }) {
  const { currentVersion, squads, circuitBuffs } = state
  const mobileSquadIdx = state.activeSquadIdxForMobile

  /** 모바일 선택 시트: 해당 파티의 첫 빈 칸에 배치, 3칸이 다 차면 시트 닫기 */
  const handleMobileSelect = (char: Character) => {
    if (mobileSquadIdx === null) return
    const squad = squads[mobileSquadIdx]
    if (squad.some(slot => slot?.id === char.id)) return
    const emptySlotIdx = squad.findIndex(slot => slot === null)
    if (emptySlotIdx === -1) return
    state.handleSelectCharacter(char, mobileSquadIdx, emptySlotIdx)
    if (squad.filter(Boolean).length === 2) state.setActiveSquadIdxForMobile(null)
  }

  return (
    <>
      {/* 다른 버전 편성 코드: 넣을 보드 선택 */}
      {state.pendingImport && (
        <ImportTargetModal
          codeVersion={state.pendingImport.codeVersion}
          assumedVersion={state.pendingImport.assumedVersion}
          currentVersion={currentVersion}
          rows={state.pendingImport.rows}
          isVersionBoardEmpty={state.isVersionBoardEmpty}
          onSelect={state.handleResolveImport}
          onCancel={state.cancelPendingImport}
        />
      )}

      {/* 버전 구분 이전 저장 파티 이관 */}
      {state.pendingMigration && state.pendingMigration.length > 0 && (
        <VersionMigrationModal
          rows={state.pendingMigration}
          onConfirm={state.handleConfirmMigration}
          onDismiss={state.handleDismissMigration}
        />
      )}

      {state.toast && <Toast message={state.toast} />}

      {state.importModalOpen && (
        <ImportModal
          onImport={state.handleImport}
          currentVersion={currentVersion}
          versions={state.selectableVersions}
          getVersionPartyCount={state.getVersionPartyCount}
          canLoadFromVersion={state.canLoadFromVersion}
          onLoadFromVersion={state.handleLoadFromVersion}
          onClose={() => state.setImportModalOpen(false)}
        />
      )}

      {/* 모바일 공명자 선택 시트 */}
      {mobileSquadIdx !== null && (
        <ResonatorSelectModal
          onSelect={handleMobileSelect}
          onClose={() => state.setActiveSquadIdxForMobile(null)}
          getAssignedSquadIndices={state.getAssignedSquadIndices}
          isCharacterMaxedOut={state.isCharacterMaxedOut}
          getMaxDeployment={state.getMaxDeployment}
          filteredCharacters={state.filteredCharacters}
          elements={state.elements}
          selectedElement={state.selectedElement}
          setSelectedElement={state.setSelectedElement}
          activeSquadIdx={mobileSquadIdx}
          currentSquad={squads[mobileSquadIdx]}
          onRemoveSlot={(slotIdx) => state.handleRemoveCharacter(mobileSquadIdx, slotIdx)}
          onOpenOwnedSettings={() => state.setOwnedModalOpen(true)}
          version={currentVersion}
          hideMaxedOut={state.hideMaxedOut}
          setHideMaxedOut={state.setHideMaxedOut}
        />
      )}

      {state.activeCircuitModalSquadIdx !== null && (
        <CircuitBuffSelectModal
          squadIdx={state.activeCircuitModalSquadIdx}
          selectedBuffId={circuitBuffs[state.activeCircuitModalSquadIdx] || null}
          version={currentVersion}
          onSelectBuff={state.handleSelectCircuitBuff}
          onClose={() => state.setActiveCircuitModalSquadIdx(null)}
        />
      )}

      {state.ownedModalOpen && (
        <OwnedResonatorModal
          isOpen={state.ownedModalOpen}
          onClose={() => state.setOwnedModalOpen(false)}
          ownedIds={state.ownedResonatorIds}
          onSave={state.handleSaveOwnedResonators}
          showOnlyOwned={state.showOnlyOwned}
          setShowOnlyOwned={state.setShowOnlyOwned}
          version={state.selectableVersions[state.selectableVersions.length - 1]}
        />
      )}

      {state.confirmModalOpen && state.confirmAction && (
        <ConfirmModal
          isOpen={state.confirmModalOpen}
          message={state.confirmAction.message}
          subMessage={state.confirmAction.subMessage}
          confirmText={state.confirmAction.confirmText}
          onConfirm={() => {
            state.confirmAction?.onConfirm()
            state.setConfirmModalOpen(false)
          }}
          onCancel={() => state.setConfirmModalOpen(false)}
        />
      )}

      {state.imageExportModalOpen && (
        <ImageExportModal
          isOpen={state.imageExportModalOpen}
          squads={squads}
          circuitBuffs={circuitBuffs}
          version={currentVersion}
          onClose={() => state.setImageExportModalOpen(false)}
          showToast={state.showToast}
        />
      )}
    </>
  )
}
