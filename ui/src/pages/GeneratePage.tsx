import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import AgeProgressVideo from '../components/AgeProgressVideo'
import PosterGrid from '../components/PosterGrid'
import { generateAgeProgressVideo, generatePosters } from '../services/api'
import type { ChildDescriptor, PhotoEnhanceResponse, PosterVariant } from '../types'

export default function GeneratePage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const descriptor: ChildDescriptor = state?.descriptor ?? {}
  const photoResult: PhotoEnhanceResponse | null = state?.photoResult ?? null
  const caseId: string = photoResult?.case_id ?? crypto.randomUUID()

  const [videoOutput, setVideoOutput] = useState<string | null>(null)
  const [posters, setPosters] = useState<PosterVariant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const [videoRes, posterRes] = await Promise.all([
        generateAgeProgressVideo({ case_id: caseId, descriptor, target_ages: [12, 14, 16] }),
        generatePosters({ case_id: caseId, descriptor }),
      ])
      setVideoOutput(videoRes.video_url)
      setPosters(posterRes.posters)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  function proceed() {
    navigate('/dispatch', { state: { descriptor, caseId } })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generate Materials</h1>
        <p className="text-gray-500 text-sm mt-1">Step 3 of 4 — Age-progression video & multilingual posters</p>
      </div>

      {!videoOutput && !loading && (
        <button
          onClick={generate}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Generate Age-Progression Video + 12 Posters
        </button>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 mt-3">Generating with Gemini… this may take a moment</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {videoOutput && (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-3">Age Progression</h2>
          <AgeProgressVideo videoUrl={videoOutput} />
        </section>
      )}

      {posters.length > 0 && (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Missing Child Posters — 12 Languages</h2>
          <PosterGrid posters={posters} />
        </section>
      )}

      {(videoOutput || posters.length > 0) && (
        <button
          onClick={proceed}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Dispatch Alerts →
        </button>
      )}
    </div>
  )
}
