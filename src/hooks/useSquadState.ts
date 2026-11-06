import { useState } from 'react'
import { useConfirm } from './useConfirm'
import { useResonatorPool } from './useResonatorPool'
import { useSquadDnd } from './useSquadDnd'
import { useSquadEditor } from './useSquadEditor'
import { useSquadTransfer } from './useSquadTransfer'
import { useToast } from './useToast'
import { useVersionBoards } from './useVersionBoards'

export type { MigrationAssignment, PendingImport } from './useSquadTransfer'

/**
 * 앱 전체 상태 조합 훅.
 * 세부 로직은 역할별 훅에 있고, 여기서는 조합과 모달 열림 상태만 관리한다.
 * - useVersionBoards: 버전별 보드 / useSquadEditor: 편성 편집 / useSquadDnd: 드래그 앤 드롭
 * - useSquadTransfer: 이관·불러오기·내보내기 / useResonatorPool: 도감 필터 / useToast, useConfirm
 */
export function useSquadState() {
  const { toast, showToast } = useToast()
  const confirm = useConfirm()
  const boards = useVersionBoards()
  const editor = useSquadEditor({ boards, showToast, confirm })
  const dnd = useSquadDnd(editor)
  const pool = useResonatorPool({ currentVersion: boards.currentVersion, isMaxed: editor.isMaxed, showToast })

  // 모달 / 시트 열림 상태
  const [activeSquadIdxForMobile, setActiveSquadIdxForMobile] = useState<number | null>(null)
  const [activeCircuitModalSquadIdx, setActiveCircuitModalSquadIdx] = useState<number | null>(null)
  const [ownedModalOpen, setOwnedModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [imageExportModalOpen, setImageExportModalOpen] = useState(false)

  const transfer = useSquadTransfer({
    boards,
    showToast,
    requestConfirm: confirm.requestConfirm,
    closeImportModal: () => setImportModalOpen(false)
  })

  /** 파티 배치도 이미지 저장 모달 열기 (배치된 공명자가 없으면 안내) */
  const handleCapture = () => {
    if (!editor.squads.some(row => row.some(Boolean))) {
      showToast('배치된 캐릭터가 없습니다.')
      return
    }
    setImageExportModalOpen(true)
  }

  return {
    // 버전 보드
    currentVersion: boards.currentVersion,
    setCurrentVersion: boards.switchVersion,
    selectableVersions: boards.versions,
    squads: editor.squads,
    circuitBuffs: boards.squadsList.map(s => s.circuitBuffId),
    squadIds: boards.squadsList.map(s => s.id),

    // 편성 편집
    handleAddSquad: editor.addSquad,
    handleDeleteSquad: editor.requestDeleteSquad,
    handleSelectCharacter: editor.selectCharacter,
    handleToggleCharacter: editor.toggleCharacter,
    handleRemoveCharacter: editor.requestRemoveCharacter,
    handleSelectCircuitBuff: editor.selectCircuitBuff,
    handleResetSquads: editor.requestResetSquads,
    getAssignedSquadIndices: editor.assignedSquadIndicesOf,
    isCharacterMaxedOut: editor.isMaxed,
    getMaxDeployment: editor.limitOf,

    // 드래그 앤 드롭
    sensors: dnd.sensors,
    activeDragChar: dnd.activeDragChar,
    handleDragStart: dnd.handleDragStart,
    handleDragEnd: dnd.handleDragEnd,

    // 도감
    elements: pool.elements,
    selectedElement: pool.selectedElement,
    setSelectedElement: pool.setSelectedElement,
    filteredCharacters: pool.filteredCharacters,
    ownedResonatorIds: pool.ownedResonatorIds,
    handleSaveOwnedResonators: pool.saveOwnedResonators,
    showOnlyOwned: pool.showOnlyOwned,
    setShowOnlyOwned: pool.setShowOnlyOwned,
    hideMaxedOut: pool.hideMaxedOut,
    setHideMaxedOut: pool.setHideMaxedOut,

    // 이관 / 불러오기 / 내보내기
    pendingMigration: transfer.pendingMigration,
    handleConfirmMigration: transfer.confirmMigration,
    handleDismissMigration: transfer.dismissMigration,
    handleExport: transfer.exportCurrentBoard,
    handleImport: transfer.importCode,
    pendingImport: transfer.pendingImport,
    handleResolveImport: transfer.resolveImport,
    cancelPendingImport: transfer.cancelPendingImport,
    canLoadFromVersion: transfer.canLoadFromVersion,
    handleLoadFromVersion: transfer.loadFromVersion,
    isVersionBoardEmpty: transfer.isVersionBoardEmpty,
    getVersionPartyCount: transfer.getVersionPartyCount,

    // 토스트 / 확인 모달
    toast,
    showToast,
    confirmModalOpen: confirm.confirmModalOpen,
    setConfirmModalOpen: confirm.setConfirmModalOpen,
    confirmAction: confirm.confirmAction,

    // 모달 / 시트
    activeSquadIdxForMobile,
    setActiveSquadIdxForMobile,
    activeCircuitModalSquadIdx,
    setActiveCircuitModalSquadIdx,
    ownedModalOpen,
    setOwnedModalOpen,
    importModalOpen,
    setImportModalOpen,
    imageExportModalOpen,
    setImageExportModalOpen,
    handleCapture
  }
}
