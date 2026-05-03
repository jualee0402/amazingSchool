/**
 * 학년 표시 포맷:
 * - 숫자만 있으면 "X학년" 자동 추가 ("6" → "6학년")
 * - 이미 "학년"이 들어가 있거나 다른 텍스트면 그대로 ("유치부" → "유치부")
 * - 빈 값이면 빈 문자열
 */
export function formatGrade(grade: string | undefined | null): string {
  if (!grade) return ''
  const trimmed = grade.trim()
  if (/^\d+$/.test(trimmed)) return `${trimmed}학년`
  return trimmed
}

/**
 * 한국 전화번호 자동 포맷팅:
 * - 02 (서울 지역번호): 02-XXX-XXXX 또는 02-XXXX-XXXX
 * - 010, 070, 031 등: XXX-XXXX-XXXX 또는 XXX-XXX-XXXX
 * 입력 도중에도 부분 포맷팅이 자연스럽게 되도록 작성됨.
 */
export function formatPhone(value: string | undefined | null): string {
  if (!value) return ''
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''

  // 02 (서울)
  if (numbers.startsWith('02')) {
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
  }

  // 010, 011, 070, 031, 032 등 3자리 시작
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}

/**
 * 전화번호에서 숫자만 추출 (tel: 링크나 vCard용)
 */
export function phoneDigitsOnly(value: string | undefined | null): string {
  return (value ?? '').replace(/\D/g, '')
}
