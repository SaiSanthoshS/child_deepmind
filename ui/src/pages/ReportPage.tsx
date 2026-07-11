import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VoiceRecorder from '../components/VoiceRecorder'
import PhotoUpload from '../components/PhotoUpload'
import { transcribeVoice, enhancePhoto } from '../services/api'
import type { ChildDescriptor, PhotoEnhanceResponse } from '../types'

export default function ReportPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [descriptor, setDescriptor] = useState<ChildDescriptor | null>(null)
  const [photoResult, setPhotoResult] = useState<PhotoEnhanceResponse | null>(null)

  async function handleAudio(blob: Blob) {
    setLoading(true)
    setError(null)
    try {
      const result = await transcribeVoice(blob)
      setDescriptor(result.descriptor)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handlePhoto(file: File) {
    setLoading(true)
    setError(null)
    try {
      const result = await enhancePhoto(file, photoResult?.case_id)
      setPhotoResult(result)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  function proceed() {
    navigate('/generate', { state: { descriptor, photoResult } })
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Missing Child</h1>
        <p className="text-gray-500 text-sm mt-1">Step 1 of 4 — Voice description & photo</p>
      </div>

      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">Describe your child (any language)</h2>
        <VoiceRecorder onRecorded={handleAudio} disabled={loading} />
        {descriptor && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            Detected: {descriptor.name ?? 'Unknown'}, Age {descriptor.age ?? '?'} — language: {descriptor.language_used ?? 'auto'}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">Upload a photo</h2>
        <PhotoUpload onFile={handlePhoto} disabled={loading} />
        {photoResult && (
          <p className="mt-3 text-sm text-green-600">
            Photo enhanced — {photoResult.variants.length} angle variants generated
          </p>
        )}
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {loading && (
        <p className="text-center text-sm text-blue-600 animate-pulse">Processing…</p>
      )}

      <button
        onClick={proceed}
        disabled={!descriptor && !photoResult}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
      >
        Continue →
      </button>
    </div>
  )
}
