import type { AppData } from '../types'

const STORAGE_KEY = 'amazingGraceSundaySchool'

const initialData: AppData = {
  students: [],
  teachers: [],
  attendance: {},
  talents: {},
  events: [],
  lastBackup: null,
}

export function loadData(): AppData {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return initialData
    const parsed = JSON.parse(data) as Partial<AppData>
    // 누락된 필드는 기본값으로 채워줌 (이전 버전 호환)
    return {
      students:   parsed.students   ?? [],
      teachers:   parsed.teachers   ?? [],
      attendance: parsed.attendance ?? {},
      talents:    parsed.talents    ?? {},
      events:     parsed.events     ?? [],
      lastBackup: parsed.lastBackup ?? null,
    }
  } catch {
    return initialData
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('저장 실패:', error)
  }
}

export function backupData(): boolean {
  try {
    const data = loadData()
    const backup: AppData = { ...data, lastBackup: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `AmazingGrace_Backup_${new Date().toLocaleDateString('ko-KR')}.json`
    a.click()
    URL.revokeObjectURL(url)
    saveData(backup)
    return true
  } catch {
    return false
  }
}

export function restoreData(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result
        if (typeof result !== 'string') {
          reject(new Error('파일 읽기 실패'))
          return
        }
        const data = JSON.parse(result) as Partial<AppData>
        if (data.students !== undefined && data.talents !== undefined) {
          const restored: AppData = {
            students:   data.students   ?? [],
            teachers:   data.teachers   ?? [],
            attendance: data.attendance ?? {},
            talents:    data.talents    ?? {},
            events:     data.events     ?? [],
            lastBackup: data.lastBackup ?? null,
          }
          saveData(restored)
          resolve(restored)
        } else {
          reject(new Error('올바르지 않은 데이터 형식'))
        }
      } catch {
        reject(new Error('파일 읽기 실패'))
      }
    }
    reader.onerror = () => reject(new Error('파일 읽기 오류'))
    reader.readAsText(file)
  })
}

export function resetData(): boolean {
  if (confirm('정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    saveData(initialData)
    return true
  }
  return false
}
