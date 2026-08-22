interface ToastProps {
  message: string
}

export function Toast({ message }: ToastProps) {
  return (
    <div className={TOAST_STYLES.container}>
      <span className={TOAST_STYLES.pingIcon}></span>
      <span className={TOAST_STYLES.text}>{message}</span>
    </div>
  )
}

// STYLES
const TOAST_STYLES = {
  container: 'fixed bottom-6 right-6 z-50 bg-[#14141a] border border-amber-500/50 text-amber-300 px-4 py-2.5 rounded-xl shadow-2xl animate-fade-in flex items-center gap-2 select-none',
  pingIcon: 'w-2 h-2 bg-amber-400 rounded-full animate-ping',
  text: 'text-xs md:text-sm font-bold'
}
