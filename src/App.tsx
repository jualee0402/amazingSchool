import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AttendancePage from './pages/AttendancePage'
import TalentPage from './pages/TalentPage'
import EventPage from './pages/EventPage'
import SettingsPage from './pages/SettingsPage'
import StudentDetail from './pages/StudentDetail'
import Navbar from './components/Navbar'
import InstallPrompt from './components/InstallPrompt'
import { loadData, saveData } from './utils/storage'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import type { AppData } from './types'

function App() {
  const [data, setData] = useState<AppData>(() => loadData())
  const { isInstallable, isInstalled, promptInstall, dismissPrompt } = useInstallPrompt()

  useEffect(() => {
    saveData(data)
  }, [data])

  const handleInstall = async (): Promise<void> => {
    await promptInstall()
  }

  return (
    <Router>
      <div className="min-h-full flex flex-col bg-slate-50">
        <header className="sticky top-0 z-30 bg-ink-900 text-white">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white grid place-items-center overflow-hidden shadow-sm">
              <img
                src="/logo-original.png"
                alt="큰은혜교회"
                className="w-full h-full object-contain p-0.5"
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement | null
                  if (fallback) fallback.style.display = 'block'
                }}
              />
              <span className="hidden text-base text-ink-900">✝</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[15px] font-bold leading-tight tracking-tight">큰은혜교회</h1>
              <p className="text-[11px] text-white/60 leading-tight">소년부 출석부 · 달란트 통장</p>
            </div>
          </div>
        </header>

        {isInstallable && !isInstalled && (
          <InstallPrompt onInstall={handleInstall} onDismiss={dismissPrompt} />
        )}

        <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
          <Routes>
            <Route path="/"            element={<AttendancePage  data={data} setData={setData} />} />
            <Route path="/talent"      element={<TalentPage      data={data} setData={setData} />} />
            <Route path="/events"      element={<EventPage       data={data} setData={setData} />} />
            <Route path="/settings"    element={<SettingsPage    data={data} setData={setData} />} />
            <Route path="/student/:id" element={<StudentDetail   data={data} setData={setData} />} />
          </Routes>
        </main>

        <Navbar />
      </div>
    </Router>
  )
}

export default App
