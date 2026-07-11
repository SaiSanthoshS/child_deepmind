import { useLocation, useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import AgeProgressVideo from '../components/AgeProgressVideo'
import PosterGrid from '../components/PosterGrid'
import { generateAgeProgressVideo, generatePosters } from '../services/api'
import type { ChildDescriptor, PhotoEnhanceResponse, PosterVariant } from '../types'

const LANGUAGE_CHIPS = [
  'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi',
  'Tamil', 'Urdu', 'Gujarati', 'Kannada', 'Odia', 'Punjabi', 'Malayalam',
]

export default function GeneratePage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const descriptor: ChildDescriptor = state?.descriptor ?? {}
  const photoResult: PhotoEnhanceResponse | null = state?.photoResult ?? null
  const caseId: string = photoResult?.case_id ?? crypto.randomUUID()

  // custom photo upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [customPhotoB64, setCustomPhotoB64] = useState('')
  const [customPhotoPreview, setCustomPhotoPreview] = useState('')

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setCustomPhotoB64(dataUrl.split(',')[1] ?? '')
      setCustomPhotoPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const effectivePhotoB64 = customPhotoB64 || photoResult?.variants[0]?.image_base64 || ''
  const effectivePhotoPreview =
    customPhotoPreview ||
    (photoResult?.variants[0] ? `data:image/jpeg;base64,${photoResult.variants[0].image_base64}` : '')

  const [videoOutput, setVideoOutput] = useState<string | null>(null)
  const [posters, setPosters] = useState<PosterVariant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const [videoRes, posterRes] = await Promise.all([
        generateAgeProgressVideo({
          case_id: caseId,
          descriptor,
          target_ages: [12, 14, 16],
          photo_base64: effectivePhotoB64,
        }),
        generatePosters({
          case_id: caseId,
          descriptor,
          photo_base64: effectivePhotoB64,
        }),
      ])
      setVideoOutput(videoRes.video_url)
      setPosters(posterRes.posters)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generate Materials</h1>
        <p className="text-gray-500 text-sm mt-1">Step 3 of 4 — Age-progression video & multilingual posters</p>
      </div>

      {/* Photo upload */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-1">Child's Photo</h2>
        <p className="text-xs text-gray-500 mb-3">
          {photoResult
            ? 'Photo carried over from previous step. You can replace it here.'
            : 'Upload a photo to include in all posters and the age-progression.'}
        </p>
        <div className="flex items-center gap-4">
          {effectivePhotoPreview && (
            <img
              src={effectivePhotoPreview}
              alt="Child preview"
              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
            />
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {effectivePhotoPreview ? 'Replace photo' : 'Upload photo'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          {customPhotoB64 && (
            <button
              type="button"
              onClick={() => { setCustomPhotoB64(''); setCustomPhotoPreview('') }}
              className="text-xs text-red-500 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      </section>

      {/* Generate button */}
      {!loading && posters.length === 0 && (
        <button
          onClick={generate}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Generate Age-Progression + 12 Language Posters
        </button>
      )}

      {/* Loading state: language chips + spinner */}
      {loading && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Generating 12 posters in 12 languages…</p>
            <span className="text-xs text-gray-400">~30–40 s</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
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
          onClick={() => navigate('/dispatch', { state: { descriptor, caseId } })}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Dispatch Alerts →
        </button>
      )}
    </div>
  )
}
