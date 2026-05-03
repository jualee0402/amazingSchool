/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// PWA 설치 prompt 이벤트 — 표준 lib에 없음
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent
  appinstalled: Event
}

// Web Contact Picker API — Chrome on Android에서만 지원
interface ContactInfo {
  name?: string[]
  tel?: string[]
  email?: string[]
  address?: unknown[]
  icon?: Blob[]
}

interface ContactsManager {
  select(properties: string[], options?: { multiple?: boolean }): Promise<ContactInfo[]>
  getProperties(): Promise<string[]>
}

interface Navigator {
  contacts?: ContactsManager
}
