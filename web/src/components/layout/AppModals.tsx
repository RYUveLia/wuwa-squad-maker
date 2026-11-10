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
  const { boards, editor, pool, transfer, toast, confirm, ui } = state
  const { currentVersion, squads, circuitBuffs } = boards
  const mobileSquadIdx = ui.mobileSquadIdx

  /** 모바일 선택 시트: 해당 파티의 첫 빈 칸에 배치, 3칸이 다 차면 시트 닫기 */
  const handleMobileSelect = (char: Character) => {
    if (mobileSquadIdx === null) return
    const squad = squads[mobileSquadIdx]
    if (squad.some(slot => slot?.id === char.id)) return
    const emptySlotIdx = squad.findIndex(slot => slot === null)
    if (emptySlotIdx === -1) return
    editor.selectCharacter(char, mobileSquadIdx, emptySlotIdx)
    if (squad.filter(Boolean).length === 2) ui.setMobileSquadIdx(null)
  }

  return (
    <>
      {/* 다른 버전 편성 코드: 넣을 보드 선택 */}
      {transfer.pendingImport && (
        <ImportTargetModal
          codeVersion={transfer.pendingImport.codeVersion}
          assumedVersion={transfer.pendingImport.assumedVersion}
          currentVersion={currentVersion}
          rows={transfer.pendingImport.rows}
          isVersionBoardEmpty={transfer.isVersionBoardEmpty}
          onSelect={transfer.resolveImport}
          onCancel={transfer.cancelPendingImport}
        />
      )}

      {/* 버전 구분 이전 저장 파티 이관 */}
      {transfer.pendingMigration && transfer.pendingMigration.length > 0 && (
        <VersionMigrationModal
          rows={transfer.pendingMigration}
          onConfirm={transfer.confirmMigration}
          onDismiss={transfer.dismissMigration}
        />
      )}

      {toast.message && <Toast message={toast.message} />}

      {ui.importModalOpen && (
        <ImportModal
          onImport={transfer.importCode}
          currentVersion={currentVersion}
          versions={boards.versions}
          getVersionPartyCount={transfer.getVersionPartyCount}
          canLoadFromVersion={transfer.canLoadFromVersion}
          onLoadFromVersion={transfer.loadFromVersion}
          onClose={() => ui.setImportModalOpen(false)}
        />
      )}

      {/* 모바일 공명자 선택 시트 */}
      {mobileSquadIdx !== null && (
        <ResonatorSelectModal
          onSelect={handleMobileSelect}
          onClose={() => ui.setMobileSquadIdx(null)}
          getAssignedSquadIndices={editor.assignedSquadIndicesOf}
          isCharacterMaxedOut={editor.isMaxed}
          getMaxDeployment={editor.limitOf}
          filteredCharacters={pool.filteredCharacters}
          elements={pool.elements}
          selectedElement={pool.selectedElement}
          setSelectedElement={pool.setSelectedElement}
          activeSquadIdx={mobileSquadIdx}
          currentSquad={squads[mobileSquadIdx]}
          onRemoveSlot={(slotIdx) => editor.requestRemoveCharacter(mobileSquadIdx, slotIdx)}
          onOpenOwnedSettings={() => ui.setOwnedModalOpen(true)}
          version={currentVersion}
          hideMaxedOut={pool.hideMaxedOut}
          setHideMaxedOut={pool.setHideMaxedOut}
        />
      )}

      {ui.circuitModalSquadIdx !== null && (
        <CircuitBuffSelectModal
          squadIdx={ui.circuitModalSquadIdx}
          selectedBuffId={circuitBuffs[ui.circuitModalSquadIdx] || null}
          version={currentVersion}
          onSelectBuff={editor.selectCircuitBuff}
          onClose={() => ui.setCircuitModalSquadIdx(null)}
        />
      )}

      {ui.ownedModalOpen && (
        <OwnedResonatorModal
          isOpen={ui.ownedModalOpen}
          onClose={() => ui.setOwnedModalOpen(false)}
          ownedIds={pool.ownedResonatorIds}
          onSave={pool.saveOwnedResonators}
          showOnlyOwned={pool.showOnlyOwned}
          setShowOnlyOwned={pool.setShowOnlyOwned}
          version={boards.versions[boards.versions.length - 1]}
        />
      )}

      {confirm.action && (
        <ConfirmModal
          isOpen
          message={confirm.action.message}
          subMessage={confirm.action.subMessage}
          confirmText={confirm.action.confirmText}
          onConfirm={confirm.accept}
          onCancel={confirm.close}
        />
      )}

      {ui.imageExportModalOpen && (
        <ImageExportModal
          isOpen={ui.imageExportModalOpen}
          squads={squads}
          circuitBuffs={circuitBuffs}
          version={currentVersion}
          onClose={() => ui.setImageExportModalOpen(false)}
          showToast={toast.showToast}
        />
      )}
    </>
  )
}
