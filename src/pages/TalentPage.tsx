import { useState } from 'react'
import { formatGrade } from '../utils/format'
import type { DataPageProps, FixedActivityKey, ActivityDef, DayActivities } from '../types'

const TALENT_ACTIVITIES: Record<FixedActivityKey, ActivityDef> = {
  attendance: { label: '출석',     points: 10, emoji: '✓' },
  prayer:     { label: '대표기도', points: 10, emoji: '🙏' },
  offering:   { label: '봉헌',     points: 10, emoji: '💝' },
  praise:     { label: '찬양',     points:  5, emoji: '🎵' },
  dance:      { label: '율동',     points:  5, emoji: '💃' },
  memory:     { label: '암송',     points:  5, emoji: '📖' },
  bibleNote:  { label: '말씀노트', points: 10, emoji: '📝' },
  special:    { label: '특송',     points: 20, emoji: '🎤' },
  dawnPrayer: { label: '새벽예배', points: 10, emoji: '🌅' },
}

// pendingChanges value: true=추가, false=삭제, number=커스텀 점수
type PendingValue = boolean | number

function TalentPage({ data, setData }: DataPageProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [pendingChanges, setPendingChanges] = useState<Record<string, PendingValue>>({})
  const [saved, setSaved] = useState(false)

  const today = selectedDate

  const attendedStudents = data.students.filter(s =>
    data.attendance[`${today}_${s.id}`]
  )

  const currentStudentId = selectedStudent || attendedStudents[0]?.id || null

  const isActivityCurrentlyActive = (studentId: string, activityKey: FixedActivityKey): boolean => {
    const savedData = data.talents[`${today}_${studentId}`]
    const savedActive = savedData !== undefined && savedData[activityKey] !== undefined
    const pendingKey = `${studentId}_${activityKey}`
    const pendingValue = pendingChanges[pendingKey]
    if (pendingValue !== undefined) return pendingValue === true
    return savedActive
  }

  const toggleActivity = (activityKey: FixedActivityKey) => {
    if (!currentStudentId) return
    const currentlyActive = isActivityCurrentlyActive(currentStudentId, activityKey)
    setPendingChanges(prev => {
      const newChanges = { ...prev }
      const key = `${currentStudentId}_${activityKey}`
      newChanges[key] = !currentlyActive
      return newChanges
    })
    setSaved(false)
  }

  const addCustomTalent = () => {
    if (!currentStudentId) return
    const points = prompt('부여할 달란트 점수를 입력하세요:', '10')
    if (points && !isNaN(Number(points)) && parseInt(points) > 0) {
      const key = `${currentStudentId}_custom_${Date.now()}`
      setPendingChanges(prev => ({ ...prev, [key]: parseInt(points) }))
      setSaved(false)
    }
  }

  const saveTalents = () => {
    const newTalents = { ...data.talents }
    const todayKey = today

    Object.entries(pendingChanges).forEach(([key, value]) => {
      const parts = key.split('_')

      if (parts.length === 2) {
        const [studentId, activity] = parts as [string, FixedActivityKey]
        const talentKey = `${todayKey}_${studentId}`
        if (!newTalents[talentKey]) newTalents[talentKey] = {}
        if (value === true) {
          newTalents[talentKey][activity] = TALENT_ACTIVITIES[activity]?.points || 0
        } else if (value === false) {
          delete newTalents[talentKey][activity]
        }
        if (Object.keys(newTalents[talentKey]).length === 0) delete newTalents[talentKey]
      } else if (parts.length === 3) {
        const [studentId, , customId] = parts
        const talentKey = `${todayKey}_${studentId}`
        if (!newTalents[talentKey]) newTalents[talentKey] = {}
        if (typeof value === 'number') {
          if (!newTalents[talentKey].custom) newTalents[talentKey].custom = {}
          newTalents[talentKey].custom![customId] = value
        } else if (value === false) {
          if (newTalents[talentKey].custom) {
            delete newTalents[talentKey].custom[customId]
            if (Object.keys(newTalents[talentKey].custom).length === 0) delete newTalents[talentKey].custom
          }
          if (Object.keys(newTalents[talentKey]).length === 0) delete newTalents[talentKey]
        }
      }
    })

    setData({ ...data, talents: newTalents })
    setPendingChanges({})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const getTodayActivities = (studentId: string): DayActivities => {
    const savedActivities = data.talents[`${today}_${studentId}`] || {}
    const activities: DayActivities = { ...savedActivities }
    if (activities.custom) activities.custom = { ...activities.custom }

    Object.entries(pendingChanges).forEach(([key, value]) => {
      const parts = key.split('_')
      if (parts[0] !== studentId) return
      if (parts.length === 2) {
        const activity = parts[1] as FixedActivityKey
        if (value === true) activities[activity] = TALENT_ACTIVITIES[activity]?.points || 0
        else if (value === false) delete activities[activity]
      } else if (parts.length === 3) {
        if (!activities.custom) activities.custom = {}
        if (typeof value === 'number') activities.custom[parts[2]] = value
        else if (value === false) delete activities.custom[parts[2]]
      }
    })

    if (activities.custom && Object.keys(activities.custom).length === 0) delete activities.custom
    return activities
  }

  const calcTotal = (activities: DayActivities): number => {
    let total = 0
    Object.entries(activities).forEach(([key, value]) => {
      if (key === 'custom' && value && typeof value === 'object') {
        total += Object.values(value as Record<string, number>).reduce((a, b) => a + b, 0)
      } else if (typeof value === 'number') {
        total += value
      }
    })
    return total
  }

  const getTodayTotal = (id: string): number => calcTotal(getTodayActivities(id))
  const getMonthTotal = (id: string): number => {
    const cm = today.substring(0, 7)
    let total = 0
    Object.entries(data.talents).forEach(([k, a]) => {
      const [d, sid] = k.split('_')
      if (sid === id && d.startsWith(cm)) total += calcTotal(a)
    })
    return total
  }
  const getAllTotal = (id: string): number => {
    let total = 0
    Object.entries(data.talents).forEach(([k, a]) => {
      const [, sid] = k.split('_')
      if (sid === id) total += calcTotal(a)
    })
    return total
  }

  const todayActivities = currentStudentId ? getTodayActivities(currentStudentId) : {}
  const todayTotal = currentStudentId ? getTodayTotal(currentStudentId) : 0
  const monthTotal = currentStudentId ? getMonthTotal(currentStudentId) : 0
  const allTotal   = currentStudentId ? getAllTotal(currentStudentId) : 0
  const currentStudent = data.students.find(s => s.id === currentStudentId)
  const hasChanges = Object.keys(pendingChanges).length > 0

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">달란트 통장</h1>
          <p className="text-sm text-slate-500 mt-0.5">활동에 따라 달란트를 부여하세요</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value)
            setSelectedStudent(null)
            setPendingChanges({})
          }}
          className="text-sm font-semibold text-slate-700 px-3 py-1.5 rounded-lg
                     border border-slate-200 bg-white focus:outline-none focus:border-ink-900"
        />
      </div>

      {attendedStudents.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-semibold text-slate-700">아직 출석한 학생이 없어요</p>
          <p className="text-sm text-slate-500 mt-1">먼저 출석부에서 출석 체크를 해주세요</p>
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              오늘 출석 학생 ({attendedStudents.length}명)
            </h2>
            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
              {attendedStudents.map(s => {
                const isSelected = currentStudentId === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStudent(s.id)
                      setPendingChanges({})
                    }}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
                               border-2 active:scale-95
                               ${isSelected
                                 ? 'bg-ink-900 text-white border-ink-900 shadow-card'
                                 : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
                  >
                    {s.name}
                    {s.grade && (
                      <span className={`ml-1.5 text-[11px] font-medium ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                        {formatGrade(s.grade)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          {currentStudent && (
            <>
              <div className="rounded-2xl bg-gradient-to-br from-ink-900 to-ink-800 text-white p-5 shadow-card">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <div className="text-xs text-white/60 font-medium">{currentStudent.name} 학생의 오늘 달란트</div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-4xl font-bold tabular text-amber-300">{todayTotal}</span>
                      <span className="text-sm text-white/70">달란트</span>
                    </div>
                  </div>
                  <div className="text-right text-xs space-y-0.5">
                    <div className="text-white/50">이번 달 <span className="text-white/90 font-semibold tabular">{monthTotal}</span></div>
                    <div className="text-white/50">전체 누적 <span className="text-white/90 font-semibold tabular">{allTotal}</span></div>
                  </div>
                </div>
              </div>

              <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  활동 체크
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(TALENT_ACTIVITIES) as [FixedActivityKey, ActivityDef][]).map(([key, activity]) => {
                    const isActive = isActivityCurrentlyActive(currentStudentId!, key)
                    return (
                      <button
                        key={key}
                        onClick={() => toggleActivity(key)}
                        className={`relative p-3 rounded-xl border-2 transition-all active:scale-95
                                   ${isActive
                                     ? 'bg-amber-50 border-amber-400 shadow-card'
                                     : 'bg-white border-slate-200 hover:border-slate-300'}`}
                      >
                        {isActive && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 grid place-items-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"
                                 className="w-2.5 h-2.5"><path d="m5 12 5 5L20 7" strokeLinecap="round"/></svg>
                          </div>
                        )}
                        <div className="text-2xl mb-1">{activity.emoji}</div>
                        <div className={`text-xs font-semibold ${isActive ? 'text-amber-900' : 'text-slate-700'}`}>
                          {activity.label}
                        </div>
                        <div className={`text-[11px] font-bold tabular ${isActive ? 'text-amber-600' : 'text-slate-400'}`}>
                          +{activity.points}
                        </div>
                      </button>
                    )
                  })}
                  <button
                    onClick={addCustomTalent}
                    className="p-3 rounded-xl border-2 border-dashed border-slate-300
                               text-slate-500 hover:border-ink-900 hover:text-ink-900 transition-all active:scale-95"
                  >
                    <div className="text-2xl mb-1">➕</div>
                    <div className="text-xs font-semibold">기타활동</div>
                    <div className="text-[11px] font-bold">+ ?</div>
                  </button>
                </div>
              </section>

              {Object.keys(todayActivities).length > 0 && (
                <section>
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    오늘의 활동 내역
                  </h2>
                  <div className="card divide-y divide-slate-100">
                    {Object.entries(todayActivities).map(([key, value]) => {
                      if (key === 'custom' && value && typeof value === 'object') {
                        return Object.entries(value as Record<string, number>).map(([customId, points]) => (
                          <div key={customId} className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm font-medium text-slate-700">기타활동</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-amber-600 tabular">+{points}</span>
                              <button
                                onClick={() => {
                                  const pendingKey = `${currentStudentId}_custom_${customId}`
                                  setPendingChanges(prev => ({ ...prev, [pendingKey]: false }))
                                  setSaved(false)
                                }}
                                className="text-rose-400 hover:text-rose-600 text-xs"
                              >✕</button>
                            </div>
                          </div>
                        ))
                      }
                      const activity = TALENT_ACTIVITIES[key as FixedActivityKey]
                      return (
                        <div key={key} className="flex items-center justify-between px-4 py-3">
                          <span className="text-sm font-medium text-slate-700">
                            <span className="mr-1.5">{activity?.emoji}</span>{activity?.label}
                          </span>
                          <span className="text-sm font-bold text-amber-600 tabular">
                            +{typeof value === 'number' ? value : activity?.points}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}

      {saved && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full
                        bg-emerald-500 text-white text-sm font-semibold shadow-pop animate-fade-in">
          ✓ 저장되었어요
        </div>
      )}

      {hasChanges && currentStudent && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 px-4 animate-slide-up">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={saveTalents}
              className="w-full bg-ink-900 text-white font-bold py-4 rounded-2xl shadow-pop
                         hover:bg-ink-800 active:scale-[0.98] transition-all"
            >
              변경사항 저장 ({Object.keys(pendingChanges).length}개)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TalentPage
