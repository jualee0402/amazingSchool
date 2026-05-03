import { useState } from 'react'
import { formatPhone } from '../utils/format'
import { isContactPickerSupported, pickContact } from '../utils/contacts'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onContactPicked?: (contact: { name: string; phone: string }) => void
  placeholder?: string
  showPicker?: boolean   // 전화번호부 가져오기 버튼 표시 여부
}

/**
 * 전화번호 입력 컴포넌트
 * - 타이핑하면서 자동으로 010-1234-5678 포맷
 * - inputMode="numeric"로 모바일 숫자 키패드 활성화
 * - showPicker=true일 때 전화번호부에서 가져오기 버튼 표시
 *   (Chrome on Android에서만 작동, 그 외엔 버튼 자체 숨김)
 */
function PhoneInput({
  value,
  onChange,
  onContactPicked,
  placeholder = '010-1234-5678',
  showPicker = false,
}: PhoneInputProps) {
  const [picking, setPicking] = useState(false)
  const pickerSupported = showPicker && isContactPickerSupported()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatPhone(e.target.value))
  }

  const handlePick = async () => {
    setPicking(true)
    try {
      const contact = await pickContact()
      if (!contact) return
      const formattedPhone = formatPhone(contact.phone)
      onChange(formattedPhone)
      onContactPicked?.({ name: contact.name, phone: formattedPhone })
    } catch (err) {
      alert(err instanceof Error ? err.message : '연락처를 가져오는데 실패했습니다')
    } finally {
      setPicking(false)
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder={placeholder}
        className="input flex-1 tabular"
        value={formatPhone(value)}
        onChange={handleChange}
        maxLength={13}
      />
      {pickerSupported && (
        <button
          type="button"
          onClick={handlePick}
          disabled={picking}
          className="btn-secondary px-3 flex-shrink-0"
          aria-label="전화번호부에서 가져오기"
          title="전화번호부에서 가져오기"
        >
          {picking ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1"/>
              <circle cx="12" cy="13" r="3"/>
              <path d="M7 20c0-2.5 2.5-4 5-4s5 1.5 5 4"/>
            </svg>
          )}
        </button>
      )}
    </div>
  )
}

export default PhoneInput
