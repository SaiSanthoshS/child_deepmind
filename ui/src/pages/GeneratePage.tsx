import { useLocation, useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import AgeProgressionGrid from '../components/AgeProgressionGrid'
import ImageEditor from '../components/ImageEditor'
import ChildDescriptorForm from '../components/ChildDescriptorForm'
import { generateAgeProgression } from '../services/api'
import type { ChildDescriptor, PhotoEnhanceResponse, AgeProgressionResponse, AgeProgressionResult } from '../types'

const TARGET_AGE_OPTIONS = [10, 12, 14, 16, 18, 20, 25]

export default function GeneratePage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const photoResult: PhotoEnhanceResponse | null = state?.photoResult ?? null
  const caseId: string = photoResult?.case_id ?? crypto.randomUUID()

  // ── Single source of truth for all child details ──────────────────────────
  const [descriptor, setDescriptor] = useState<ChildDescriptor>(state?.descriptor ?? {})

  // ── Photo ─────────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [customPhotoB64, setCustomPhotoB64] = useState('')
  const [customPhotoPreview, setCustomPhotoPreview] = useState('')

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
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

  // ── Age Progression — pulled from descriptor, only target ages needed here ─
  const [selectedTargetAges, setSelectedTargetAges] = useState<number[]>([12, 16])

  function toggleTargetAge(age: number) {
    setSelectedTargetAges((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age].sort((a, b) => a - b)
    )
  }

  const [ageProgressResult, setAgeProgressResult] = useState<AgeProgressionResponse | null>(null)
  const [loadingAge, setLoadingAge] = useState(false)
  const [errorAge, setErrorAge] = useState<string | null>(null)

  async function runAgeProgression() {
    if (!photoFile && !effectivePhotoB64) { setErrorAge('Please upload a photo first.'); return }
    if (selectedTargetAges.length === 0) { setErrorAge('Select at least one target age.'); return }
    if (!descriptor.age) { setErrorAge("Please enter the child's current age in the details above."); return }

    setLoadingAge(true); setErrorAge(null)
    try {
      let file = photoFile
      if (!file) {
        const bytes = atob(effectivePhotoB64)
        const arr = new Uint8Array(bytes.length)
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
        file = new File([arr], 'photo.jpg', { type: 'image/jpeg' })
      }
      const res = await generateAgeProgression(
        file,
        descriptor.age,
        selectedTargetAges.filter((a) => a > descriptor.age!),
        descriptor.gender || 'unknown',
        descriptor.distinguishing_marks || `${descriptor.gender || 'child'}, age ${descriptor.age}`,
        descriptor.name ?? undefined,
      )
      setAgeProgressResult(res)
      setSelectedBase(null)
      setEditedImageUrl(null)
      setEditedImageFile(null)
    } catch (e) {
      setErrorAge(String(e))
    } finally {
      setLoadingAge(false)
    }
  }

  // ── Image Editor ──────────────────────────────────────────────────────────
  const [selectedBase, setSelectedBase] = useState<AgeProgressionResult | null>(null)
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null)
  const [editedImageFile, setEditedImageFile] = useState<File | null>(null)

  function selectBase(result: AgeProgressionResult) {
    setSelectedBase(result)
    setEditedImageUrl(null)
    setEditedImageFile(null)
  }

  // ── Navigate to posters ───────────────────────────────────────────────────
  async function goToPosters() {
    let finalPhotoB64 = effectivePhotoB64

    if (editedImageFile) {
      finalPhotoB64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
        reader.readAsDataURL(editedImageFile)
      })
    } else if (editedImageUrl) {
      const res = await fetch(editedImageUrl)
      const blob = await res.blob()
      finalPhotoB64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
        reader.readAsDataURL(blob)
      })
    }

    navigate('/posters', { state: { descriptor, caseId, photoB64: finalPhotoB64 } })
  }

  // Derived: target ages must be greater than the current age
  const currentAge = descriptor.age ?? 0
  const validTargetAges = TARGET_AGE_OPTIONS.filter((a) => a > currentAge)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Child Details & Photo</h1>
        <p className="text-gray-500 text-sm mt-1">Step 1 of 3 — Enter details and generate age-progression images</p>
      </div>

      {/* ── Section 1: Child Details + Photo ── */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-5">
        <h2 className="font-semibold text-gray-800">Child Details</h2>

        <ChildDescriptorForm descriptor={descriptor} onChange={setDescriptor} />

        {/* Photo inline with details */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Photo</p>
          <div className="flex items-center gap-4">
            {effectivePhotoPreview ? (
              <img src={effectivePhotoPreview} alt="Child" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
            ) : (
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs text-center">
                No photo
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                {effectivePhotoPreview ? 'Replace photo' : 'Upload photo'}
              </button>
              {customPhotoB64 && (
                <button type="button" onClick={() => { setPhotoFile(null); setCustomPhotoB64(''); setCustomPhotoPreview('') }}
                  className="text-xs text-red-500 hover:underline text-left">Remove</button>
              )}
              {photoResult && !customPhotoB64 && (
                <p className="text-xs text-gray-400">Carried over from report step</p>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
        </div>
      </section>

      {/* ── Section 2: Age Progression ── */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-800">Age Progression</h2>

        {!descriptor.age && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Enter the child's age above to enable age progression.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-600">
            Generate images at these future ages
            {descriptor.age ? <span className="text-gray-400 font-normal"> (current: {descriptor.age})</span> : null}
          </label>
          <div className="flex flex-wrap gap-2">
            {validTargetAges.length > 0 ? validTargetAges.map((age) => (
              <button key={age} type="button" onClick={() => toggleTargetAge(age)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedTargetAges.includes(age)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}>
                Age {age}
              </button>
            )) : (
              <p className="text-xs text-gray-400">Enter an age above to see options</p>
            )}
          </div>
        </div>

        {!loadingAge && (
          <button onClick={runAgeProgression} disabled={!descriptor.age || selectedTargetAges.length === 0}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors">
            {ageProgressResult ? 'Regenerate' : 'Generate Age-Progression Images'}
          </button>
        )}

        {loadingAge && (
          <div className="flex items-center gap-3 py-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-sm text-gray-500">
              Generating {selectedTargetAges.length} image{selectedTargetAges.length > 1 ? 's' : ''}… ~20–40 s
            </p>
          </div>
        )}

        {errorAge && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{errorAge}</div>}

        {ageProgressResult && (
          <AgeProgressionGrid
            results={ageProgressResult.results}
            gridUrl={ageProgressResult.grid_url}
            currentAge={ageProgressResult.current_age}
          />
        )}
      </section>

      {/* ── Section 3: Edit Image ── */}
      {ageProgressResult && ageProgressResult.results.length > 0 && (
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
          <div>
            <h2 className="font-semibold text-gray-800">Edit Image</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select one of the age-progressed images to edit before generating posters. Optional.
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {ageProgressResult.results.map((r) => (
              <button key={r.target_age} type="button" onClick={() => selectBase(r)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-colors ${
                  selectedBase?.target_age === r.target_age
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300 bg-white'
                }`}>
                <img src={r.image_url} alt={`Age ${r.target_age}`} className="w-20 h-20 object-cover rounded-lg" />
                <span className="text-xs font-medium text-gray-600">Age {r.target_age}</span>
              </button>
            ))}
          </div>

          {!selectedBase && (
            <p className="text-xs text-gray-400 text-center py-1">Select an image above to begin editing</p>
          )}

          {selectedBase && (
            <ImageEditor imageUrl={selectedBase.image_url} onEdited={(url, file) => { setEditedImageUrl(url); setEditedImageFile(file) }} />
          )}

          {editedImageUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700 font-medium">
              ✓ Edited image ready — posters will use this version
            </div>
          )}
        </section>
      )}

      {/* ── Generate Posters CTA ── */}
      {ageProgressResult && (
        <button onClick={goToPosters}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors shadow-sm">
          Generate Posters →
        </button>
      )}
    </div>
  )
}
