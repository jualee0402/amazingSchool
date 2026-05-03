import { useState } from 'react'
import { backupData, restoreData, resetData } from '../utils/storage'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { generateTalentPDF, type PdfSummaryItem } from '../utils/pdf'
import type { DataPageProps, FixedActivityKey, DayActivities } from '../types'

const ACTIVITY_LABELS: Record<FixedActivityKey, string> = {
  attendance: '출석', prayer: '대표기도', offering: '봉헌', praise: '찬양',
  dance: '율동', memory: '암송', bibleNote: '말씀노트', special: '특송',
  dawnPrayer: '새벽예배',
}

interface SummaryItem extends PdfSummaryItem {
  studentId: string
}

function SettingsPage({ data, setData }: DataPageProps) {
  const [message, setMessage] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7))
  const [selectedStudent, setSelectedStudent] = useState('')
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt()

  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleBackup = () => {
    showMessage(backupData() ? '백업이 완료되었습니다' : '백업에 실패했습니다')
  }

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    restoreData(file).then(restoredData => {
      setData(restoredData)
      showMessage('데이터가 복원되었습니다')
    }).catch((err: Error) => showMessage(err.message))
  }

  const handleReset = () => {
    if (resetData()) {
      setData({ students: [], teachers: [], attendance: {}, talents: {}, events: [], lastBackup: null })
      showMessage('모든 데이터가 초기화되었습니다')
    }
  }

  const handleInstall = async () => {
    const success = await promptInstall()
    if (success) showMessage('앱이 설치되었습니다!')
  }

  const calcTotalForActivities = (activities: DayActivities): number => {
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

  const getTalentSummary = (): SummaryItem[] => {
    const summary: Record<string, SummaryItem> = {}

    Object.entries(data.talents).forEach(([key, activities]) => {
      const [date, studentId] = key.split('_')
      if (!date.startsWith(selectedMonth)) return
      const student = data.students.find(s => s.id === studentId)
      if (!student) return
      if (selectedStudent && studentId !== selectedStudent) return

      if (!summary[studentId]) {
        summary[studentId] = { studentId, name: student.name, total: 0, activities: {} }
      }
      summary[studentId].total += calcTotalForActivities(activities)

      Object.entries(activities).forEach(([act, val]) => {
        if (act === 'custom' && val && typeof val === 'object') {
          summary[studentId].activities['기타'] =
            (summary[studentId].activities['기타'] || 0) + Object.keys(val).length
        } else if (typeof val === 'number') {
          const actName = ACTIVITY_LABELS[act as FixedActivityKey] || act
          summary[studentId].activities[actName] =
            (summary[studentId].activities[actName] || 0) + 1
        }
      })
    })

    return Object.values(summary).sort((a, b) => b.total - a.total)
  }

  const handleGeneratePdf = async () => {
    const summary = getTalentSummary()
    if (summary.length === 0) {
      showMessage('해당 기간의 데이터가 없습니다')
      return
    }

    setGeneratingPdf(true)
    try {
      const monthLabel = selectedMonth.replace('-', '년 ') + '월'
      const studentLabel = selectedStudent
        ? data.students.find(s => s.id === selectedStudent)?.name || '전체 학생'
        : '전체 학생'

      await generateTalentPDF({ summary, monthLabel, studentLabel })
      showMessage('PDF가 생성되었습니다!')
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'PDF 생성에 실패했습니다')
    } finally {
      setGeneratingPdf(false)
    }
  }

  const summary = getTalentSummary()
  const grandTotal = summary.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="text-sm text-slate-500 mt-0.5">달란트 집계, 데이터 백업 등</p>
      </div>

      {message && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full
                        bg-emerald-500 text-white text-sm font-semibold shadow-pop animate-fade-in">
          {message}
        </div>
      )}

      <Section title="달란트 내역 집계">
        <div className="card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input !py-2 text-sm font-semibold"
            />
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="input !py-2 text-sm font-semibold"
            >
              <option value="">전체 학생</option>
              {data.students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <button onClick={handleGeneratePdf} disabled={generatingPdf} className="btn-primary w-full">
            {generatingPdf ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                PDF 생성 중...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/>
                </svg>
                PDF로 출력
              </>
            )}
          </button>

          {summary.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-xs font-semibold text-amber-900">
                {summary.length}명 집계
              </span>
              <span className="text-sm font-bold text-amber-700 tabular">
                합계 {grandTotal} 달란트
              </span>
            </div>
          )}
        </div>

        {summary.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">데이터가 없습니다</p>
        ) : (
          <div className="space-y-2">
            {summary.map((item, index) => (
              <div key={item.studentId} className="card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold tabular
                                   ${index === 0 ? 'bg-amber-400 text-amber-950'
                                                 : index === 1 ? 'bg-slate-300 text-slate-700'
                                                 : index === 2 ? 'bg-orange-300 text-orange-900'
                                                 : 'bg-slate-100 text-slate-500'}`}>
                    {index + 1}
                  </span>
                  <span className="flex-1 font-semibold text-slate-900">{item.name}</span>
                  <span className="font-bold text-amber-600 tabular">{item.total} 달란트</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(item.activities).map(([act, count]) => (
                    <span key={act}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {act} {count}회
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {isInstallable && (
        <Section title="앱 설치">
          <SettingItem
            title="홈 화면에 추가"
            desc={isInstalled ? '이미 설치되어 있어요' : '앱을 설치하면 더 빠르게 접근할 수 있어요'}
          >
            <button onClick={handleInstall} disabled={isInstalled}
                    className={isInstalled ? 'btn-secondary btn-sm' : 'btn-primary btn-sm'}>
              {isInstalled ? '완료' : '설치'}
            </button>
          </SettingItem>
        </Section>
      )}

      <Section title="데이터 관리">
        <SettingItem title="백업" desc="모든 데이터를 파일로 저장">
          <button onClick={handleBackup} className="btn-primary btn-sm">백업</button>
        </SettingItem>
        <SettingItem title="복원" desc="백업 파일에서 불러오기">
          <label className="btn-secondary btn-sm cursor-pointer">
            복원
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>
        </SettingItem>
        <SettingItem title="초기화" desc="모든 데이터 삭제 (되돌릴 수 없음)" danger>
          <button onClick={handleReset} className="btn-danger btn-sm">초기화</button>
        </SettingItem>
      </Section>

      <Section title="앱 정보">
        <div className="card p-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">버전</span><span className="font-semibold tabular">1.1.0</span></div>
          <div className="flex justify-between"><span className="text-slate-500">학생</span><span className="font-semibold tabular">{data.students.length}명</span></div>
          <div className="flex justify-between"><span className="text-slate-500">선생님</span><span className="font-semibold tabular">{data.teachers.length}명</span></div>
        </div>
      </Section>

      <Section title="큰은혜교회">
        <div className="card p-5 text-center space-y-1 text-sm text-slate-600">
          <p className="font-bold text-base text-slate-900 mb-2">큰은혜교회</p>
          <p>서울특별시 관악구 낙성대로3길 5</p>
          <p className="tabular">📞 02-888-1252 · FAX 02-888-1285</p>
          <p>amazing-grace@hanmail.net</p>
          <p className="text-xs text-slate-400 mt-3">담임목사 이규호</p>
          <p className="text-[10px] text-slate-300 pt-2 border-t border-slate-100 mt-3">
            © 큰은혜교회. ALL RIGHTS RESERVED.
          </p>
        </div>
      </Section>
    </div>
  )
}

interface SectionProps { title: string; children: React.ReactNode }
function Section({ title, children }: SectionProps) {
  return (
    <section>
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

interface SettingItemProps {
  title: string
  desc: string
  children: React.ReactNode
  danger?: boolean
}
function SettingItem({ title, desc, children, danger }: SettingItemProps) {
  return (
    <div className={`card p-4 flex items-center justify-between gap-3
                    ${danger ? 'border-rose-200 bg-rose-50/30' : ''}`}>
      <div className="min-w-0">
        <div className={`font-semibold text-sm ${danger ? 'text-rose-700' : 'text-slate-900'}`}>{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
      {children}
    </div>
  )
}

export default SettingsPage
