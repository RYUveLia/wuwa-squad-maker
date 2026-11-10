import { useState } from 'react'

export interface ConfirmAction {
  message: string
  subMessage?: string
  confirmText?: string
  onConfirm: () => void
}

/** 확인 모달 상태 (내용이 있으면 열린 상태) */
export function useConfirm() {
  const [action, setAction] = useState<ConfirmAction | null>(null)

  const openConfirm = (next: ConfirmAction) => setAction(next)

  /** 단축형: requestConfirm(메시지, 확인 시 동작, 보조 문구, 확인 버튼 문구) */
  const requestConfirm = (message: string, onConfirm: () => void, subMessage?: string, confirmText?: string) =>
    openConfirm({ message, onConfirm, subMessage, confirmText })

  /** 확인: 동작 실행 후 닫기 */
  const accept = () => {
    action?.onConfirm()
    setAction(null)
  }

  const close = () => setAction(null)

  return { action, openConfirm, requestConfirm, accept, close }
}

export type ConfirmApi = ReturnType<typeof useConfirm>
