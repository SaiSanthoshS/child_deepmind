import type { AgeProgressionResult } from '../types'

interface Props {
  results: AgeProgressionResult[]
  gridUrl?: string
  currentAge: number
}

const SERVER = 'http://localhost:8000'

export default function AgeProgressionGrid({ results, gridUrl, currentAge }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {gridUrl && (
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Comparison grid</p>
          <img
            src={`${SERVER}${gridUrl}`}
            alt="Age progression comparison grid"
            className="w-full rounded-xl border border-gray-200 object-contain"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {results.map((r) => (
          <div key={r.target_age} className="flex flex-col gap-1">
            <img
              src={`${SERVER}${r.image_url}`}
              alt={`Age ${r.target_age}`}
              className="w-full aspect-square object-cover rounded-xl border border-gray-200"
            />
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-gray-700">Age {r.target_age}</span>
              <span className="text-xs text-gray-400">+{r.target_age - currentAge} yrs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
