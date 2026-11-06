import { useRef, useState } from 'react'

const TOAST_DURATION_MS = 2500

/** 하단 토스트 메시지 (연속 호출 시 이전 타이머가 새 토스트를 일찍 지우지 않도록 재설정) */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (text: string) => {
    setMessage(text)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setMessage(null), TOAST_DURATION_MS)
  }

  return { message, showToast }
}
