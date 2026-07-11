import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import ReportPage from './pages/ReportPage'
import GeneratePage from './pages/GeneratePage'
import PosterPage from './pages/PosterPage'
import DispatchPage from './pages/DispatchPage'

const STEPS = [
  { path: '/report', label: '1. Report' },
  { path: '/generate', label: '2. Generate' },
  { path: '/posters', label: '3. Posters' },
  { path: '/dispatch', label: '4. Dispatch' },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-6">
          <span className="font-bold text-blue-700 text-lg tracking-tight">MissingMesh</span>
          <nav className="flex gap-2">
            {STEPS.map((s) => (
              <NavLink
                key={s.path}
                to={s.path}
                className={({ isActive }) =>
                  `text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-800'
                  }`
                }
              >
                {s.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/report" replace />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/generate" element={<GeneratePage />} />
            <Route path="/posters" element={<PosterPage />} />
            <Route path="/dispatch" element={<DispatchPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
