import { phoneDigitsOnly } from './format'

/**
 * Web Contact Picker API 지원 여부.
 * - Chrome on Android: 지원 ✅
 * - iOS Safari: 미지원 ❌ (Apple이 막아놨음)
 * - Desktop 브라우저: 미지원 ❌
 * 그래서 UI에선 이 함수로 체크 후 버튼을 조건부로 표시해야 함.
 */
export function isContactPickerSupported(): boolean {
  return typeof navigator !== 'undefined'
      && 'contacts' in navigator
      && navigator.contacts !== undefined
      && 'ContactsManager' in window
}

export interface PickedContact {
  name: string
  phone: string
}

/**
 * 전화번호부에서 연락처 하나 가져오기.
 * 사용자가 picker를 닫으면 null 반환.
 * 지원 안하는 브라우저에선 throw.
 */
export async function pickContact(): Promise<PickedContact | null> {
  if (!isContactPickerSupported()) {
    throw new Error('이 브라우저에서는 연락처 가져오기를 지원하지 않습니다.\n안드로이드 Chrome에서만 사용 가능합니다.')
  }

  try {
    const contacts = await navigator.contacts!.select(['name', 'tel'], { multiple: false })
    if (contacts.length === 0) return null

    const c = contacts[0]
    return {
      name: c.name?.[0] ?? '',
      phone: c.tel?.[0] ?? '',
    }
  } catch (err) {
    // 사용자가 picker를 취소한 경우
    if (err instanceof Error && err.name === 'AbortError') return null
    throw err
  }
}

/**
 * vCard(.vcf) 파일 다운로드 → 폰의 전화번호부에 저장.
 * iOS Safari, Android Chrome 모두 .vcf 클릭하면 "연락처 추가" 자동 제안.
 */
export interface VCardData {
  name: string
  phone: string
  role?: string       // 직분 / 학년 등
  note?: string       // 메모
  email?: string
  birthday?: string   // YYYY-MM-DD
}

export function downloadVCard(data: VCardData): void {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardValue(data.name)}`,
    `N:${escapeVCardValue(data.name)};;;;`,
  ]

  const tel = phoneDigitsOnly(data.phone)
  if (tel) lines.push(`TEL;TYPE=CELL:${tel}`)
  if (data.role)     lines.push(`TITLE:${escapeVCardValue(data.role)}`)
  if (data.note)     lines.push(`NOTE:${escapeVCardValue(data.note)}`)
  if (data.email)    lines.push(`EMAIL:${data.email}`)
  if (data.birthday) lines.push(`BDAY:${data.birthday.replace(/-/g, '')}`)

  lines.push('END:VCARD')

  // UTF-8 BOM 추가 — iOS에서 한글 깨짐 방지
  const content = '\uFEFF' + lines.join('\r\n')
  const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${data.name}.vcf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

// vCard 값에 들어가면 안 되는 문자 이스케이프
function escapeVCardValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}
