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
    navigate('/review', { state: { descriptor, photoResult } })
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="mb-8 text-center pt-8">
        <h1 className="text-4xl font-bold tracking-tight mb-3 text-white">Report Missing Child</h1>
        <p className="text-slate-300 text-lg">Provide voice description and upload a recent photo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="mui-paper p-6 h-full flex flex-col">
          <h2 className="text-xl font-medium mb-6 pb-2 border-b border-[var(--border-color)]">
            1. Describe your child (any language)
          </h2>
          <div className="flex-1 flex flex-col justify-center">
            <VoiceRecorder onRecorded={handleAudio} disabled={loading} />
            {descriptor && (
              <div className="mt-6 bg-[var(--success-bg)] text-[var(--success-text)] rounded px-4 py-3 flex items-start gap-3">
                <div>
                  <p className="font-medium">Description Detected</p>
                  <p className="text-sm mt-1">
                    Name: {descriptor.name ?? 'Unknown'} • Age: {descriptor.age ?? '?'} • Language: {descriptor.language_used ?? 'auto'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mui-paper p-6 h-full flex flex-col">
          <h2 className="text-xl font-medium mb-6 pb-2 border-b border-[var(--border-color)]">
            2. Upload a photo
          </h2>
          <div className="flex-1 flex flex-col justify-center">
            <PhotoUpload onFile={handlePhoto} disabled={loading} />
            {photoResult && (
               <div className="mt-6 bg-[var(--success-bg)] text-[var(--success-text)] rounded px-4 py-3 flex items-center gap-3">
                 <p className="text-sm">
                   Photo enhanced — <span className="font-bold">{photoResult.variants.length}</span> angle variants generated
                 </p>
               </div>
            )}
          </div>
        </section>
      </div>

      {error && (
        <div className="bg-[var(--error-bg)] text-[var(--error-text)] rounded px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center my-4">
          <div className="text-[var(--text-secondary)]">Processing...</div>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={proceed}
          disabled={!descriptor && !photoResult}
          className="mui-btn-primary"
        >
          CONTINUE TO REVIEW
        </button>
      </div>
    </div>
  )
}
