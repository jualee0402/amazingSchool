import { useState, useEffect } from 'react'

interface UseInstallPromptReturn {
  isInstallable: boolean
  isInstalled: boolean
  promptInstall: () => Promise<boolean>
  dismissPrompt: () => void
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      showInstallGuide()
      return false
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
      }

      setDeferredPrompt(null)
      return outcome === 'accepted'
    } catch (error) {
      console.error('설치 오류:', error)
      return false
    }
  }

  const showInstallGuide = (): void => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)

    let message = ''
    if (isIOS) {
      message = 'iOS: Safari 브라우저의 공유 버튼을 누른 후 "홈 화면에 추가"를 선택해주세요.'
    } else if (isAndroid) {
      message = 'Android: Chrome 메뉴에서 "홈 화면에 추가" 또는 "앱 설치"를 선택해주세요.'
    } else {
      message = '브라우저 주소창 오른쪽의 설치 아이콘을 클릭해주세요.'
    }
    alert(message)
  }

  const dismissPrompt = (): void => {
    setIsInstallable(false)
    localStorage.setItem('installPromptDismissed', Date.now().toString())
  }

  const checkDismissed = (): boolean => {
    const dismissed = localStorage.getItem('installPromptDismissed')
    if (dismissed) {
      const hoursSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60)
      return hoursSince < 24
    }
    return false
  }

  return {
    isInstallable: isInstallable && !checkDismissed(),
    isInstalled,
    promptInstall,
    dismissPrompt,
  }
}
