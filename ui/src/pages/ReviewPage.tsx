import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import ChildDescriptorForm from '../components/ChildDescriptorForm'
import type { ChildDescriptor, PhotoEnhanceResponse } from '../types'

export default function ReviewPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [descriptor, setDescriptor] = useState<ChildDescriptor>(state?.descriptor ?? {})
  const photoResult: PhotoEnhanceResponse | null = state?.photoResult ?? null

  function proceed() {
    navigate('/generate', { state: { descriptor, photoResult } })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review & Edit Details</h1>
        <p className="text-gray-500 text-sm mt-1">Step 2 of 4 — Correct any errors from voice transcription</p>
      </div>

      {photoResult && (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Enhanced Photo Variants</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {photoResult.variants.map((v) => (
              <div key={v.angle} className="flex-shrink-0 text-center">
                <img
                  src={`data:${v.mime_type};base64,${v.image_base64}`}
                  alt={v.angle}
                  className="w-28 h-28 object-cover rounded-lg border border-gray-200"
                />
                <p className="text-xs text-gray-500 mt-1 capitalize">{v.angle}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">Child Details</h2>
        <ChildDescriptorForm descriptor={descriptor} onChange={setDescriptor} />
      </section>

      <button
        onClick={proceed}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
      >
        Generate Video & Posters →
      </button>
    </div>
  )
}
