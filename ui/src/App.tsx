import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import GeneratePage from './pages/GeneratePage'
import PosterPage from './pages/PosterPage'
import DispatchPage from './pages/DispatchPage'
import FoundChildPage from './pages/FoundChildPage'
import DashboardPage from './pages/DashboardPage'

const STEPS = [
  { path: '/generate', label: 'Details & Photo' },
  { path: '/posters', label: 'Posters' },
  { path: '/dispatch', label: 'Dispatch' },
]

function StepHeader() {
  const { pathname } = useLocation()
  const currentIndex = STEPS.findIndex((s) => s.path === pathname)
  if (currentIndex === -1) return null

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <span className="font-bold text-blue-700 text-base tracking-tight">MissingMesh</span>
      <nav className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const done = i < currentIndex
          const active = i === currentIndex
          return (
            <div key={s.path} className="flex items-center gap-1">
              {i > 0 && (
                <span className={`w-6 h-px ${done ? 'bg-blue-400' : 'bg-gray-200'}`} />
              )}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active
                  ? 'bg-blue-100 text-blue-700'
                  : done
                  ? 'bg-green-50 text-green-600'
                  : 'text-gray-400'
              }`}>
                <span className={`w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold ${
                  active ? 'bg-blue-600 text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {done ? '✓' : i + 1}
                </span>
                {s.label}
              </div>
            </div>
          )
        })}
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <StepHeader />
        <main>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/generate" element={<GeneratePage />} />
            <Route path="/posters" element={<PosterPage />} />
            <Route path="/dispatch" element={<DispatchPage />} />
            <Route path="/found-child" element={<FoundChildPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
