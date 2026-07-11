import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ReportPage from './pages/ReportPage'
import ReviewPage from './pages/ReviewPage'
import GeneratePage from './pages/GeneratePage'
import DispatchPage from './pages/DispatchPage'

const STEPS = [
  { path: '/report', label: '1. Report' },
  { path: '/review', label: '2. Review' },
  { path: '/generate', label: '3. Generate' },
  { path: '/dispatch', label: '4. Dispatch' },
]

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  return (
    <BrowserRouter>
      <div className={`min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)] font-sans flex flex-col transition-colors duration-300 relative ${darkMode ? 'dark' : ''}`}>
        {/* Deep Premium Hero Background */}
        <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none" style={{ background: 'var(--hero-bg)' }}></div>

        {/* Floating App Bar */}
        <header className="relative mt-6 mx-auto w-full max-w-7xl px-4 z-50">
          <div className="bg-[var(--paper-bg)] border border-[var(--border-color)] shadow-[var(--paper-shadow)] rounded-full px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[var(--primary-color)]">
                <path d="M2 12h3l3 -9 5 18 3 -9h6" />
              </svg>
              <span className="font-bold text-xl tracking-tight text-[var(--text-primary)]">
                MissingMesh
              </span>
            </div>
            
            <nav className="flex gap-4 items-center">
              {STEPS.map((s) => (
                <NavLink
                  key={s.path}
                  to={s.path}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full text-sm font-semibold uppercase transition-colors ${
                      isActive 
                        ? 'bg-[var(--primary-color)] text-[#ffffff] shadow-md' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] hover:bg-opacity-30'
                    }`
                  }
                >
                  {s.label}
                </NavLink>
              ))}
              
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="ml-4 p-2 rounded-full hover:bg-[var(--border-color)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Toggle dark mode"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </nav>
          </div>
        </header>

        {/* Main Content Area Overlapping Hero */}
        <main className="relative flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 mt-16 z-10">
          <Routes>
            <Route path="/" element={<Navigate to="/report" replace />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/generate" element={<GeneratePage />} />
            <Route path="/dispatch" element={<DispatchPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
