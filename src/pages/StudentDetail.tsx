import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PhoneInput from '../components/PhoneInput'
import { formatGrade, formatPhone, phoneDigitsOnly } from '../utils/format'
import { downloadVCard } from '../utils/contacts'
import type { DataPageProps, Student, FixedActivityKey } from '../types'

const ACTIVITY_NAMES: Record<FixedActivityKey, string> = {
  attendance: '출석', prayer: '대표기도', offering: '봉헌', praise: '찬양',
  dance: '율동', memory: '암송', bibleNote: '말씀노트', special: '특송',
  dawnPrayer: '새벽예배',
}

interface RecentActivity {
  date: string
  activity: string
  points: number
  id: string
}

function StudentDetail({ data, setData }: DataPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const student = data.students.find(s => s.id === id)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Student>>({})

  useEffect(() => {
    if (student) setFormData({ ...student })
  }, [student])

  if (!student || !id) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/')} className="btn-ghost">← 뒤로</button>
        <div className="card p-10 text-center">
          <p className="text-slate-500">학생을 찾을 수 없습니다</p>
        </div>
      </div>
    )
  }

  const handleSave = () => {
    setData({
      ...data,
      students: data.students.map(s => s.id === id ? { ...s, ...formData, id } : s),
    })
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm('이 학생을 삭제하시겠습니까?')) {
      setData({ ...data, students: data.students.filter(s => s.id !== id) })
      navigate('/')
    }
  }

  // 전화번호부에 저장 (vCard)
  const handleSaveToContacts = (phoneType: 'student' | 'parent') => {
    const phone = phoneType === 'student' ? student.phone : student.parentPhone
    if (!phone) {
      alert('저장할 전화번호가 없습니다')
      return
    }
    const name = phoneType === 'student'
      ? student.name
      : `${student.name} 부모님`
    const role = phoneType === 'student'
      ? `큰은혜교회 소년부 ${formatGrade(student.grade)}`
      : `${student.name} 학생 부모님`
    downloadVCard({
      name,
      phone,
      role,
      note: student.notes || undefined,
      birthday: phoneType === 'student' ? student.birthday || undefined : undefined,
    })
  }

  // 달란트 요약
  const getStudentTalentSummary = () => {
    let total = 0
    const currentMonth = new Date().toISOString().substring(0, 7)
    let monthlyTotal = 0
    Object.entries(data.talents).forEach(([key, activities]) => {
      const [date, studentId] = key.split('_')
      if (studentId !== id) return
      let dayTotal = 0
      Object.entries(activities).forEach(([act, val]) => {
        if (act === 'custom' && val && typeof val === 'object') {
          dayTotal += Object.values(val as Record<string, number>).reduce((a, b) => a + b, 0)
        } else if (typeof val === 'number') {
          dayTotal += val
        }
      })
      total += dayTotal
      if (date.startsWith(currentMonth)) monthlyTotal += dayTotal
    })
    return { total, monthlyTotal }
  }

  const talentSummary = getStudentTalentSummary()

  // 최근 활동
  const getRecentActivities = (): RecentActivity[] => {
    const activities: RecentActivity[] = []
    Object.entries(data.talents).forEach(([key, acts]) => {
      const [date, studentId] = key.split('_')
      if (studentId !== id) return
      Object.entries(acts).forEach(([act, val]) => {
        if (act === 'custom' && val && typeof val === 'object') {
          Object.entries(val as Record<string, number>).forEach(([customId, points]) => {
            activities.push({ date, activity: '기타활동', points, id: customId })
          })
        } else if (typeof val === 'number') {
          activities.push({
            date,
            activity: ACTIVITY_NAMES[act as FixedActivityKey] || act,
            points: val,
            id: date + act,
          })
        }
      })
    })
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20)
  }

  const recentActivities = getRecentActivities()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="btn-ghost btn-sm -ml-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               className="w-4 h-4"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          뒤로
        </button>
        {!isEditing && (
          <div className="flex gap-1">
            <button onClick={() => setIsEditing(true)} className="btn-secondary btn-sm">수정</button>
            <button onClick={handleDelete} className="btn-danger btn-sm">삭제</button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="card p-5 space-y-3">
          <h2 className="font-bold text-lg mb-1">정보 수정</h2>
          <div>
            <label className="label">이름</label>
            <input className="input" type="text" value={formData.name || ''}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">학년</label>
              <input className="input" type="text" inputMode="numeric"
                     placeholder="예: 6"
                     value={formData.grade || ''}
                     onChange={(e) => setFormData({ ...formData, grade: e.target.value })} />
            </div>
            <div>
              <label className="label">생일</label>
              <input className="input" type="date" value={formData.birthday || ''}
                     onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">학생 연락처</label>
            <PhoneInput
              value={formData.phone || ''}
              onChange={(v) => setFormData({ ...formData, phone: v })}
              showPicker
              onContactPicked={(c) => setFormData(prev => ({ ...prev, phone: c.phone }))}
            />
          </div>
          <div>
            <label className="label">부모님 연락처</label>
            <PhoneInput
              value={formData.parentPhone || ''}
              onChange={(v) => setFormData({ ...formData, parentPhone: v })}
              showPicker
              onContactPicked={(c) => setFormData(prev => ({ ...prev, parentPhone: c.phone }))}
            />
          </div>
          <div>
            <label className="label">메모</label>
            <textarea className="textarea" rows={3} value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setIsEditing(false)} className="btn-secondary flex-1">취소</button>
            <button onClick={handleSave} className="btn-primary flex-1">저장</button>
          </div>
        </div>
      ) : (
        <>
          {/* 프로필 */}
          <div className="text-center py-3">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-ink-900 to-ink-800
                            text-white text-3xl font-bold grid place-items-center mb-3 shadow-card">
              {student.name.charAt(0)}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{student.name}</h1>
            {student.grade && (
              <span className="inline-block mt-1.5 px-3 py-1 rounded-full bg-slate-100
                               text-slate-600 text-xs font-semibold">
                {formatGrade(student.grade)}
              </span>
            )}
          </div>

          {/* 달란트 요약 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 text-center">
              <div className="text-xs text-slate-500 font-medium">이번 달</div>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold tabular text-amber-600">{talentSummary.monthlyTotal}</span>
                <span className="text-xs text-slate-500">달란트</span>
              </div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs text-slate-500 font-medium">전체 누적</div>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold tabular text-ink-900">{talentSummary.total}</span>
                <span className="text-xs text-slate-500">달란트</span>
              </div>
            </div>
          </div>

          {/* 기본 정보 */}
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">기본 정보</h2>
            <div className="card divide-y divide-slate-100">
              <DetailRow
                label="생일"
                value={student.birthday ? `🎂 ${student.birthday}` : '미입력'}
              />
              <PhoneRow
                label="학생 연락처"
                phone={student.phone}
                onSave={() => handleSaveToContacts('student')}
              />
              <PhoneRow
                label="부모님 연락처"
                phone={student.parentPhone}
                onSave={() => handleSaveToContacts('parent')}
              />
              <DetailRow label="메모" value={student.notes || '없음'} multiline />
            </div>
          </section>

          {/* 최근 활동 */}
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">최근 활동 내역</h2>
            {recentActivities.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-sm text-slate-500">활동 내역이 없어요</p>
              </div>
            ) : (
              <div className="card divide-y divide-slate-100">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[11px] text-slate-400 tabular w-20 flex-shrink-0">{act.date}</span>
                      <span className="font-medium text-sm text-slate-700 truncate">{act.activity}</span>
                    </div>
                    <span className="font-bold text-sm text-amber-600 tabular flex-shrink-0">+{act.points}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

interface DetailRowProps {
  label: string
  value: React.ReactNode
  multiline?: boolean
}
function DetailRow({ label, value, multiline }: DetailRowProps) {
  return (
    <div className={`px-4 py-3 ${multiline ? '' : 'flex items-center justify-between gap-3'}`}>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      <div className={`text-sm text-slate-700 ${multiline ? 'mt-1' : ''}`}>{value}</div>
    </div>
  )
}

interface PhoneRowProps {
  label: string
  phone: string
  onSave: () => void
}
function PhoneRow({ label, phone, onSave }: PhoneRowProps) {
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-3">
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      {phone ? (
        <div className="flex items-center gap-1">
          <a href={`tel:${phoneDigitsOnly(phone)}`}
             className="text-sm text-ink-900 font-semibold tabular hover:underline">
            📞 {formatPhone(phone)}
          </a>
          <button
            onClick={onSave}
            title="전화번호부에 저장"
            aria-label="전화번호부에 저장"
            className="ml-1 w-7 h-7 grid place-items-center rounded-lg text-slate-400
                       hover:bg-slate-100 hover:text-ink-900 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          </button>
        </div>
      ) : (
        <span className="text-sm text-slate-400">미입력</span>
      )}
    </div>
  )
}

export default StudentDetail
