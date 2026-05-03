import { useState, useEffect } from 'react'

interface InstallPromptProps {
  onInstall: () => Promise<void>
  onDismiss: () => void
}

function InstallPrompt({ onInstall, onDismiss }: InstallPromptProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss(), 250)
  }

  const handleInstall = async () => {
    await onInstall()
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 px-4 animate-slide-up">
      <div className="max-w-2xl mx-auto card p-4 shadow-pop border-slate-200">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 grid place-items-center text-2xl flex-shrink-0">
            📱
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm">홈 화면에 설치하기</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              앱처럼 빠르게 실행 · 오프라인 사용 가능
            </p>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="닫기"
            className="w-7 h-7 -m-1 grid place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 className="w-4 h-4"><path d="M6 6l12 12M6 18L18 6" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleDismiss} className="btn-secondary btn-sm flex-1">나중에</button>
          <button onClick={handleInstall} className="btn-primary btn-sm flex-1">설치하기</button>
        </div>
      </div>
    </div>
  )
}

export default InstallPrompt
