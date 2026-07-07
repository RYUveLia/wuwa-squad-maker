interface ToastProps {
  message: string
}

export function Toast({ message }: ToastProps) {
  return (
    <div className={TOAST_CLASS}>
      <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></span>
      <span className="text-xs md:text-sm font-bold">{message}</span>
    </div>
  )
}

// STYLES
const TOAST_CLASS = 'fixed bottom-6 right-6 z-50 bg-slate-900 border border-purple-500/50 text-purple-300 px-4 py-2.5 rounded-xl shadow-2xl animate-fade-in flex items-center gap-2 select-none'
