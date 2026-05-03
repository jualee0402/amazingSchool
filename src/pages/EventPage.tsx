import { useState } from 'react'
import Modal from '../components/Modal'
import type { DataPageProps, ChurchEvent } from '../types'

type EventForm = Omit<ChurchEvent, 'id'>

const emptyForm: EventForm = { title: '', date: '', time: '', description: '' }

function EventPage({ data, setData }: DataPageProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7))
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null)
  const [formData, setFormData] = useState<EventForm>(emptyForm)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingEvent) {
      setData({
        ...data,
        events: data.events.map(ev =>
          ev.id === editingEvent.id ? { ...formData, id: ev.id } : ev
        ),
      })
    } else {
      setData({
        ...data,
        events: [...data.events, { ...formData, id: Date.now().toString() }],
      })
    }
    resetForm()
  }

  const editEvent = (event: ChurchEvent) => {
    setEditingEvent(event)
    setFormData(event)
    setShowForm(true)
  }

  const deleteEvent = (id: string) => {
    if (confirm('이 행사를 삭제하시겠습니까?')) {
      setData({ ...data, events: data.events.filter(e => e.id !== id) })
    }
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingEvent(null)
    setShowForm(false)
  }

  const monthEvents = data.events
    .filter(e => e.date && e.date.startsWith(selectedMonth))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">교회 행사</h1>
          <p className="text-sm text-slate-500 mt-0.5">월별로 행사를 관리하세요</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary btn-sm">
          <span className="text-base leading-none">+</span> 행사 추가
        </button>
      </div>

      <div className="card p-3 flex items-center gap-3">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-sm font-semibold text-slate-700 px-3 py-1.5 rounded-lg
                     border border-slate-200 bg-slate-50 focus:outline-none focus:border-ink-900"
        />
        <span className="text-xs text-slate-500 tabular">
          {monthEvents.length}개 행사
        </span>
      </div>

      {monthEvents.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="font-semibold text-slate-700">이번 달 등록된 행사가 없어요</p>
          <p className="text-sm text-slate-500 mt-1">우측 상단 버튼으로 추가해보세요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {monthEvents.map(event => {
            const d = new Date(event.date)
            return (
              <div key={event.id} className="card p-4 flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-ink-900 text-white grid place-items-center">
                  <div className="text-center leading-none">
                    <div className="text-[10px] text-white/60 font-medium">{dayNames[d.getDay()]}</div>
                    <div className="text-xl font-bold tabular mt-0.5">{d.getDate()}</div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{event.title}</h3>
                  {event.time && (
                    <div className="text-xs text-slate-500 tabular mt-0.5">🕐 {event.time}</div>
                  )}
                  {event.description && (
                    <p className="text-sm text-slate-600 mt-1.5 line-clamp-2">{event.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => editEvent(event)}
                          className="w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </button>
                  <button onClick={() => deleteEvent(event.id)}
                          className="w-8 h-8 grid place-items-center rounded-lg text-rose-400 hover:bg-rose-50">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showForm} onClose={resetForm}
             title={editingEvent ? '행사 수정' : '행사 추가'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">행사명 *</label>
            <input className="input" type="text" required
                   value={formData.title}
                   onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">날짜 *</label>
              <input className="input" type="date" required
                     value={formData.date}
                     onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div>
              <label className="label">시간</label>
              <input className="input" type="time"
                     value={formData.time}
                     onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">설명</label>
            <textarea className="textarea" rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={resetForm} className="btn-secondary flex-1">취소</button>
            <button type="submit" className="btn-primary flex-1">
              {editingEvent ? '수정' : '저장'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default EventPage
