import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../components/Modal'
import PhoneInput from '../components/PhoneInput'
import { formatGrade, formatPhone } from '../utils/format'
import type { DataPageProps, Student, Teacher } from '../types'

type StudentForm = Omit<Student, 'id'>
type TeacherForm = Omit<Teacher, 'id'>

const emptyStudentForm: StudentForm = {
  name: '', grade: '', phone: '', parentPhone: '', birthday: '', notes: '',
}
const emptyTeacherForm: TeacherForm = {
  name: '', role: '', phone: '', notes: '',
}

function AttendancePage({ data, setData }: DataPageProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [studentForm, setStudentForm] = useState<StudentForm>(emptyStudentForm)
  const [teacherForm, setTeacherForm] = useState<TeacherForm>(emptyTeacherForm)

  const today = selectedDate

  const toggleAttendance = (studentId: string) => {
    const key = `${today}_${studentId}`
    const newAttendance = { ...data.attendance }
    if (newAttendance[key]) {
      delete newAttendance[key]
      const newTalents = { ...data.talents }
      if (newTalents[key]) {
        delete newTalents[key].attendance
        if (Object.keys(newTalents[key]).length === 0) delete newTalents[key]
      }
      setData({ ...data, attendance: newAttendance, talents: newTalents })
    } else {
      newAttendance[key] = true
      const newTalents = { ...data.talents }
      newTalents[key] = { ...newTalents[key], attendance: 10 }
      setData({ ...data, attendance: newAttendance, talents: newTalents })
    }
  }

  // ==== 학생 ====
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingStudent) {
      setData({
        ...data,
        students: data.students.map(s => s.id === editingStudent.id ? { ...studentForm, id: s.id } : s),
      })
    } else {
      setData({
        ...data,
        students: [...data.students, { ...studentForm, id: Date.now().toString() }],
      })
    }
    resetStudentForm()
  }

  const editStudent = (student: Student) => {
    setEditingStudent(student)
    setStudentForm(student)
    setShowAddStudent(true)
  }

  const deleteStudent = (id: string) => {
    if (confirm('이 학생을 삭제하시겠습니까?')) {
      setData({ ...data, students: data.students.filter(s => s.id !== id) })
    }
  }

  const resetStudentForm = () => {
    setStudentForm(emptyStudentForm)
    setEditingStudent(null)
    setShowAddStudent(false)
  }

  // ==== 선생님 ====
  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTeacher) {
      setData({
        ...data,
        teachers: data.teachers.map(t => t.id === editingTeacher.id ? { ...teacherForm, id: t.id } : t),
      })
    } else {
      setData({
        ...data,
        teachers: [...data.teachers, { ...teacherForm, id: Date.now().toString() }],
      })
    }
    resetTeacherForm()
  }

  const editTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setTeacherForm(teacher)
    setShowAddTeacher(true)
  }

  const deleteTeacher = (id: string) => {
    if (confirm('이 선생님을 삭제하시겠습니까?')) {
      setData({ ...data, teachers: data.teachers.filter(t => t.id !== id) })
    }
  }

  const resetTeacherForm = () => {
    setTeacherForm(emptyTeacherForm)
    setEditingTeacher(null)
    setShowAddTeacher(false)
  }

  const isPresent = (id: string): boolean => data.attendance[`${today}_${id}`] || false
  const presentCount = data.students.filter(s => isPresent(s.id)).length
  const totalCount   = data.students.length
  const absentCount  = totalCount - presentCount

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">출석부</h1>
        <p className="text-sm text-slate-500 mt-0.5">오늘 예배에 누가 왔는지 체크해주세요</p>
      </div>

      {/* 출석 요약 카드 */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-semibold text-slate-700 px-3 py-1.5 rounded-lg
                       border border-slate-200 bg-slate-50 focus:outline-none focus:border-ink-900"
          />
          <span className="text-xs text-slate-500 tabular">
            {presentCount} / {totalCount} 명 출석
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white grid place-items-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                   className="w-4 h-4"><path d="m5 12 5 5L20 7" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div className="text-[11px] text-emerald-700 font-medium">출석</div>
              <div className="text-lg font-bold text-emerald-900 tabular leading-tight">{presentCount}명</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-100">
            <div className="w-9 h-9 rounded-full bg-slate-400 text-white grid place-items-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                   className="w-4 h-4"><path d="M6 6l12 12M6 18L18 6" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div className="text-[11px] text-slate-600 font-medium">결석</div>
              <div className="text-lg font-bold text-slate-700 tabular leading-tight">{absentCount}명</div>
            </div>
          </div>
        </div>
      </div>

      {/* 학생 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">학생</h2>
          <button onClick={() => setShowAddStudent(true)} className="btn-primary btn-sm">
            <span className="text-base leading-none">+</span> 학생 추가
          </button>
        </div>

        {data.students.length === 0 ? (
          <EmptyState text="등록된 학생이 없어요" hint="우측 상단 버튼으로 추가해보세요" />
        ) : (
          <div className="space-y-2">
            {data.students.map(student => {
              const present = isPresent(student.id)
              return (
                <div key={student.id}
                     className={`card p-3 flex items-center gap-3 transition-all
                                ${present ? 'ring-2 ring-emerald-400 bg-emerald-50/30' : ''}`}>
                  <button
                    onClick={() => toggleAttendance(student.id)}
                    className={`w-11 h-11 rounded-xl grid place-items-center transition-all active:scale-90
                               ${present
                                 ? 'bg-emerald-500 text-white shadow-sm'
                                 : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                    aria-label="출석 체크"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                         className="w-5 h-5"><path d="m5 12 5 5L20 7" strokeLinecap="round"/></svg>
                  </button>

                  <Link to={`/student/${student.id}`} className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{student.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {student.grade && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {formatGrade(student.grade)}
                        </span>
                      )}
                      {student.birthday && (
                        <span className="text-[11px] text-slate-400 tabular">🎂 {student.birthday.slice(5)}</span>
                      )}
                    </div>
                  </Link>

                  <div className="flex gap-1">
                    <IconBtn onClick={() => editStudent(student)} label="수정">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </IconBtn>
                    <IconBtn onClick={() => deleteStudent(student.id)} label="삭제" danger>
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                    </IconBtn>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 선생님 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">선생님</h2>
          <button onClick={() => setShowAddTeacher(true)} className="btn-secondary btn-sm">
            <span className="text-base leading-none">+</span> 선생님 추가
          </button>
        </div>

        {data.teachers.length === 0 ? (
          <EmptyState text="등록된 선생님이 없어요" />
        ) : (
          <div className="space-y-2">
            {data.teachers.map(teacher => (
              <div key={teacher.id} className="card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-ink-900 text-white grid place-items-center font-bold">
                  {teacher.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">
                    {teacher.name}
                    {teacher.role && <span className="ml-1.5 text-xs text-slate-500 font-normal">· {teacher.role}</span>}
                  </div>
                  {teacher.phone && (
                    <a href={`tel:${teacher.phone}`} className="text-xs text-ink-900 tabular hover:underline">
                      📞 {formatPhone(teacher.phone)}
                    </a>
                  )}
                </div>
                <div className="flex gap-1">
                  <IconBtn onClick={() => editTeacher(teacher)} label="수정">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </IconBtn>
                  <IconBtn onClick={() => deleteTeacher(teacher.id)} label="삭제" danger>
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                  </IconBtn>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 학생 추가/수정 모달 */}
      <Modal open={showAddStudent} onClose={resetStudentForm}
             title={editingStudent ? '학생 정보 수정' : '학생 추가'}>
        <form onSubmit={handleStudentSubmit} className="space-y-3">
          <div>
            <label className="label">이름 *</label>
            <input className="input" type="text" required
                   value={studentForm.name}
                   onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">학년</label>
              <input className="input" type="text" inputMode="numeric"
                     placeholder="예: 6"
                     value={studentForm.grade}
                     onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })} />
              <p className="text-[10px] text-slate-400 mt-1">숫자만 입력해도 자동으로 'X학년'으로 표시돼요</p>
            </div>
            <div>
              <label className="label">생일</label>
              <input className="input" type="date"
                     value={studentForm.birthday}
                     onChange={(e) => setStudentForm({ ...studentForm, birthday: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">학생 연락처</label>
            <PhoneInput
              value={studentForm.phone}
              onChange={(v) => setStudentForm({ ...studentForm, phone: v })}
              showPicker
              onContactPicked={(c) => {
                // 연락처 가져왔을 때 이름이 비어있으면 같이 채워주기
                setStudentForm(prev => ({
                  ...prev,
                  phone: c.phone,
                  name: prev.name || c.name,
                }))
              }}
            />
          </div>
          <div>
            <label className="label">부모님 연락처</label>
            <PhoneInput
              value={studentForm.parentPhone}
              onChange={(v) => setStudentForm({ ...studentForm, parentPhone: v })}
              showPicker
              onContactPicked={(c) => setStudentForm(prev => ({ ...prev, parentPhone: c.phone }))}
            />
          </div>
          <div>
            <label className="label">메모</label>
            <textarea className="textarea" rows={2}
                      value={studentForm.notes}
                      onChange={(e) => setStudentForm({ ...studentForm, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={resetStudentForm} className="btn-secondary flex-1">취소</button>
            <button type="submit" className="btn-primary flex-1">
              {editingStudent ? '수정' : '저장'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 선생님 추가/수정 모달 */}
      <Modal open={showAddTeacher} onClose={resetTeacherForm}
             title={editingTeacher ? '선생님 정보 수정' : '선생님 추가'}>
        <form onSubmit={handleTeacherSubmit} className="space-y-3">
          <div>
            <label className="label">이름 *</label>
            <input className="input" type="text" required
                   value={teacherForm.name}
                   onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">직분</label>
            <input className="input" type="text" placeholder="예: 6학년 담임"
                   value={teacherForm.role}
                   onChange={(e) => setTeacherForm({ ...teacherForm, role: e.target.value })} />
          </div>
          <div>
            <label className="label">연락처</label>
            <PhoneInput
              value={teacherForm.phone}
              onChange={(v) => setTeacherForm({ ...teacherForm, phone: v })}
              showPicker
              onContactPicked={(c) => {
                setTeacherForm(prev => ({
                  ...prev,
                  phone: c.phone,
                  name: prev.name || c.name,
                }))
              }}
            />
          </div>
          <div>
            <label className="label">메모</label>
            <textarea className="textarea" rows={2}
                      value={teacherForm.notes}
                      onChange={(e) => setTeacherForm({ ...teacherForm, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={resetTeacherForm} className="btn-secondary flex-1">취소</button>
            <button type="submit" className="btn-primary flex-1">
              {editingTeacher ? '수정' : '저장'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

interface IconBtnProps {
  onClick: () => void
  label: string
  children: React.ReactNode
  danger?: boolean
}

function IconBtn({ onClick, label, children, danger }: IconBtnProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-9 h-9 grid place-items-center rounded-lg transition-colors
                 ${danger ? 'text-rose-500 hover:bg-rose-50'
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        {children}
      </svg>
    </button>
  )
}

function EmptyState({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="card p-8 text-center">
      <p className="text-sm text-slate-500">{text}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

export default AttendancePage
