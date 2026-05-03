// 공통 데이터 모델

export interface Student {
  id: string
  name: string
  grade: string         // "6" 또는 "6학년" 둘 다 OK — formatGrade가 처리
  phone: string
  parentPhone: string
  birthday: string
  notes: string
}

export interface Teacher {
  id: string
  name: string
  role: string
  phone: string
  notes: string
}

export interface ChurchEvent {
  id: string
  title: string
  date: string         // YYYY-MM-DD
  time: string         // HH:MM
  description: string
}

// 달란트 활동 키 — 고정된 9가지 + custom (기타활동)
export type FixedActivityKey =
  | 'attendance' | 'prayer' | 'offering' | 'praise' | 'dance'
  | 'memory' | 'bibleNote' | 'special' | 'dawnPrayer'

// 하루치 활동 데이터
export type DayActivities = {
  [K in FixedActivityKey]?: number
} & {
  custom?: Record<string, number>
}

// 전체 앱 데이터
export interface AppData {
  students: Student[]
  teachers: Teacher[]
  attendance: Record<string, boolean>     // key: "YYYY-MM-DD_studentId"
  talents: Record<string, DayActivities>  // key: "YYYY-MM-DD_studentId"
  events: ChurchEvent[]
  lastBackup: string | null
}

// 페이지 컴포넌트 공통 props
export interface DataPageProps {
  data: AppData
  setData: (data: AppData) => void
}

// 활동 정의 (라벨, 점수, 이모지)
export interface ActivityDef {
  label: string
  points: number
  emoji: string
}
