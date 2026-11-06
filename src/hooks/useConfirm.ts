import { useState } from 'react'

export interface ConfirmAction {
  message: string
  subMessage?: string
  confirmText?: string
  onConfirm: () => void
}

/** 확인 모달 상태 */
export function useConfirm() {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  const openConfirm = (action: ConfirmAction) => {
    setConfirmAction(action)
    setConfirmModalOpen(true)
  }

  /** 단축형: requestConfirm(메시지, 확인 시 동작, 보조 문구, 확인 버튼 문구) */
  const requestConfirm = (message: string, onConfirm: () => void, subMessage?: string, confirmText?: string) =>
    openConfirm({ message, onConfirm, subMessage, confirmText })

  return { confirmAction, confirmModalOpen, setConfirmModalOpen, openConfirm, requestConfirm }
}

export type ConfirmApi = ReturnType<typeof useConfirm>
