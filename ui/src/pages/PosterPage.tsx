import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import PosterGrid from '../components/PosterGrid'
import { generatePosters } from '../services/api'
import type { ChildDescriptor, PosterVariant } from '../types'

const LANGUAGE_CHIPS = [
  'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi',
  'Tamil', 'Urdu', 'Gujarati', 'Kannada', 'Odia', 'Punjabi', 'Malayalam',
]

export default function PosterPage() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const descriptor: ChildDescriptor = state?.descriptor ?? {}
  const caseId: string = state?.caseId ?? crypto.randomUUID()
  const photoB64: string = state?.photoB64 ?? ''

  const [posters, setPosters] = useState<PosterVariant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await generatePosters({ case_id: caseId, descriptor, photo_base64: photoB64 })
      setPosters(res.posters)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  // Auto-start on mount
  useEffect(() => { generate() }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Missing Child Posters</h1>
          <p className="text-gray-500 text-sm mt-1">Step 2 of 3 — 12 languages generated from the edited image</p>
        </div>
        {posters.length > 0 && (
          <button
            onClick={generate}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-300 rounded-lg px-3 py-1.5 transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-700">Generating 12 posters in 12 languages…</p>
            <span className="text-xs text-gray-400">~30–40 s</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_CHIPS.map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-400 animate-pulse"
              >
                {lang}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-xs text-gray-500">
              Building consistent layout in all scripts — each poster shares the same template
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-start gap-3">
          <span className="text-red-400 mt-0.5">⚠</span>
          <div>
            <p className="font-medium mb-1">Failed to generate posters</p>
            <p className="text-xs">{error}</p>
            <button onClick={generate} className="mt-2 text-xs text-red-600 underline hover:no-underline">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Poster grid */}
      {posters.length > 0 && (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">{posters.length} posters ready</p>
            <p className="text-xs text-gray-400">Click any poster to download</p>
          </div>
          <PosterGrid posters={posters} />
        </section>
      )}

      {/* Navigation */}
      {posters.length > 0 && (
        <button
          onClick={() => navigate('/dispatch', { state: { descriptor, caseId } })}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors shadow-sm"
        >
          Dispatch Alerts →
        </button>
      )}
    </div>
  )
}
