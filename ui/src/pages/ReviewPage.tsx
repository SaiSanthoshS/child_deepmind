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
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="mb-8 text-center pt-8">
        <h1 className="text-4xl font-bold tracking-tight mb-3 text-white">Review & Edit Details</h1>
        <p className="text-slate-300 text-lg">Correct any errors from voice transcription</p>
      </div>

      {photoResult && (
        <section className="mui-paper p-6">
          <h2 className="text-xl font-medium mb-6 pb-2 border-b border-[var(--border-color)]">
            Enhanced Photo Variants
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {photoResult.variants.map((v) => (
              <div key={v.angle} className="flex-shrink-0 text-center w-32 md:w-40">
                <img
                  src={`data:${v.mime_type};base64,${v.image_base64}`}
                  alt={v.angle}
                  className="w-full h-32 md:h-40 object-cover rounded shadow-sm border border-[var(--border-color)]"
                />
                <p className="text-sm text-[var(--text-secondary)] mt-2 capitalize font-medium">{v.angle}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mui-paper p-6">
        <h2 className="text-xl font-medium mb-6 pb-2 border-b border-[var(--border-color)]">
          Child Details
        </h2>
        <div>
          <ChildDescriptorForm descriptor={descriptor} onChange={setDescriptor} />
        </div>
      </section>

      <div className="mt-4 flex justify-end">
        <button
          onClick={proceed}
          className="mui-btn-primary"
        >
          GENERATE VIDEO & POSTERS
        </button>
      </div>
    </div>
  )
}
