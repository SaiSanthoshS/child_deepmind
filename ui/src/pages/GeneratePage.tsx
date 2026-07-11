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
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="mb-8 text-center pt-8">
        <h1 className="text-4xl font-bold tracking-tight mb-3 text-white">Generate Materials</h1>
        <p className="text-slate-300 text-lg">Create age-progression video & multilingual posters</p>
      </div>

      <section className="mui-paper p-6">
        <h2 className="text-xl font-medium mb-4 pb-2 border-b border-[var(--border-color)]">
          Base Photo
        </h2>
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {photoResult
              ? 'Photo carried over from previous step. You can replace it here.'
              : 'Upload a photo to include in all posters and the age-progression.'}
          </p>
          <div className="flex items-center gap-4">
            {effectivePhotoPreview && (
              <div className="p-1 border border-[var(--border-color)] rounded">
                <img
                  src={effectivePhotoPreview}
                  alt="Child preview"
                  className="w-16 h-16 object-cover rounded"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[var(--primary-color)] border border-[var(--primary-color)] px-4 py-1.5 rounded uppercase text-sm font-medium hover:opacity-80"
            >
              {effectivePhotoPreview ? 'REPLACE PHOTO' : 'UPLOAD PHOTO'}
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
                className="text-[var(--error-text)] text-sm font-medium uppercase hover:opacity-80 px-3 py-1.5 rounded"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </section>

      {!loading && posters.length === 0 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={generate}
            className="mui-btn-primary w-full max-w-sm py-3 text-base"
          >
            GENERATE MATERIALS
          </button>
        </div>
      )}

      {loading && (
        <div className="mui-paper p-8 text-center flex flex-col items-center">
          <p className="text-lg font-medium text-[var(--text-primary)] mb-4">
            Generating materials... please wait.
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-lg mb-4">
            {LANGUAGE_CHIPS.map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 bg-[var(--border-color)] text-[var(--text-primary)] rounded-full text-xs"
              >
                {lang}
              </span>
            ))}
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Building consistent layout in all scripts (~30s)
          </p>
        </div>
      )}

      {error && (
        <div className="bg-[var(--error-bg)] text-[var(--error-text)] rounded px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {videoOutput && (
        <section className="mui-paper p-6">
          <h2 className="text-xl font-medium mb-6 pb-2 border-b border-[var(--border-color)]">
            Age Progression Video
          </h2>
          <AgeProgressVideo videoUrl={videoOutput} />
        </section>
      )}

      {posters.length > 0 && (
        <section className="mui-paper p-6">
          <h2 className="text-xl font-medium mb-6 pb-2 border-b border-[var(--border-color)]">
            Missing Child Posters (12 Languages)
          </h2>
          <PosterGrid posters={posters} />
        </section>
      )}

      {(videoOutput || posters.length > 0) && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => navigate('/dispatch', { state: { descriptor, caseId } })}
            className="mui-btn-primary"
          >
            CONTINUE TO DISPATCH
          </button>
        </div>
      )}
    </div>
  )
}
