import { useState } from 'react'
import { useConfirm } from './useConfirm'
import { useResonatorPool } from './useResonatorPool'
import { useSquadDnd } from './useSquadDnd'
import { useSquadEditor } from './useSquadEditor'
import { useSquadTransfer } from './useSquadTransfer'
import { useToast } from './useToast'
import { useVersionBoards } from './useVersionBoards'

/**
 * 앱 전체 상태 조합 훅.
 * 역할별 훅을 만들어 묶어서 돌려준다 (이름을 바꿔 다시 내보내지 않는다).
 * - boards: 버전별 보드 / editor: 편성 편집 / dnd: 드래그 앤 드롭
 * - transfer: 이관·불러오기·내보내기 / pool: 도감 필터 / toast, confirm / ui: 모달·시트 열림 상태
 */
export function useSquadState() {
  const toast = useToast()
  const confirm = useConfirm()
  const boards = useVersionBoards()
  const editor = useSquadEditor({ boards, showToast: toast.showToast, confirm })
  const dnd = useSquadDnd(editor)
  const pool = useResonatorPool({ currentVersion: boards.currentVersion, isMaxed: editor.isMaxed, showToast: toast.showToast })
  const ui = useModalState()
  const transfer = useSquadTransfer({
    boards,
    showToast: toast.showToast,
    requestConfirm: confirm.requestConfirm,
    closeImportModal: () => ui.setImportModalOpen(false)
  })

  /** 파티 배치도 이미지 저장 모달 열기 (배치된 공명자가 없으면 안내) */
  const openImageExport = () => {
    if (!boards.squads.some(row => row.some(Boolean))) {
      toast.showToast('배치된 캐릭터가 없습니다.')
      return
    }
    ui.setImageExportModalOpen(true)
  }

  return { boards, editor, dnd, pool, transfer, toast, confirm, ui: { ...ui, openImageExport } }
}

/** 모달 / 시트 열림 상태 */
function useModalState() {
  const [mobileSquadIdx, setMobileSquadIdx] = useState<number | null>(null)
  const [circuitModalSquadIdx, setCircuitModalSquadIdx] = useState<number | null>(null)
  const [ownedModalOpen, setOwnedModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [imageExportModalOpen, setImageExportModalOpen] = useState(false)

  return {
    /** 모바일 공명자 선택 시트가 열린 파티 (null이면 닫힘) */
    mobileSquadIdx,
    setMobileSquadIdx,
    /** 회로 선택 모달이 열린 파티 (null이면 닫힘) */
    circuitModalSquadIdx,
    setCircuitModalSquadIdx,
    ownedModalOpen,
    setOwnedModalOpen,
    importModalOpen,
    setImportModalOpen,
    imageExportModalOpen,
    setImageExportModalOpen
  }
}

/** 앱 전체 상태 (패널/모달 컴포넌트에 그대로 전달) */
export type SquadState = ReturnType<typeof useSquadState>
