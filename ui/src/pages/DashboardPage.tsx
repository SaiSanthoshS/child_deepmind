import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllCases } from '../services/api'
import type { CaseRecord } from '../types'

function CitySection({ city, cases }: { city: string; cases: CaseRecord[] }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h2 className="text-base font-bold text-gray-800">{city}</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{cases.length} case{cases.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {cases.map((c) => (
          <div key={c.case_id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="w-full aspect-square bg-gray-100">
              {c.photo_base64 ? (
                <img
                  src={`data:image/jpeg;base64,${c.photo_base64}`}
                  alt={c.name || 'Child'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-3 flex flex-col gap-1 flex-1">
              <p className="font-bold text-sm text-gray-900 truncate">{c.name || 'Unknown'}</p>
              <p className="text-xs text-gray-500">
                {c.age ? `${c.age} yrs` : ''}
                {c.age && c.gender ? ' · ' : ''}
                {c.gender || ''}
              </p>
              {(c.height_cm || c.weight_kg) && (
                <p className="text-xs text-gray-400">
                  {c.height_cm ? `${c.height_cm}cm` : ''}
                  {c.height_cm && c.weight_kg ? ' · ' : ''}
                  {c.weight_kg ? `${c.weight_kg}kg` : ''}
                </p>
              )}
              {c.last_seen_location && (
                <p className="text-xs text-gray-400 truncate">{c.last_seen_location}</p>
              )}
              {c.last_seen_date && (
                <p className="text-xs text-blue-500 font-medium mt-auto pt-1">{c.last_seen_date}</p>
              )}
              {c.distinguishing_marks && (
                <p className="text-xs text-orange-500 truncate">{c.distinguishing_marks}</p>
              )}
              {c.clothing_description && (
                <p className="text-xs text-gray-400 truncate italic">{c.clothing_description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAllCases()
      .then((res) => setCases(res.cases))
      .catch(() => setError('Failed to load cases.'))
      .finally(() => setLoading(false))
  }, [])

  // Group by city; cases with no city go under "Unknown"
  const grouped = cases.reduce<Record<string, CaseRecord[]>>((acc, c) => {
    const key = c.city || 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  const cityKeys = Object.keys(grouped).sort((a, b) => {
    if (a === 'Unknown') return 1
    if (b === 'Unknown') return -1
    return a.localeCompare(b)
  })

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="font-bold text-blue-600 text-xl tracking-tight">MissingMesh</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Missing Children Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">All registered cases, grouped by city</p>
          </div>
          {!loading && (
            <span className="text-sm text-gray-400 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
              {cases.length} total case{cases.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && cases.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
            <p className="text-gray-400 font-medium">No cases registered yet.</p>
            <p className="text-xs text-gray-300 mt-1">Cases will appear here after reports are submitted.</p>
          </div>
        )}

        {!loading && cityKeys.map((city) => (
          <CitySection key={city} city={city} cases={grouped[city]} />
        ))}
      </div>
    </div>
  )
}
