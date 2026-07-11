import type { PosterVariant } from '../types'

interface Props {
  posters: PosterVariant[]
}

export default function PosterGrid({ posters }: Props) {
  function downloadPoster(poster: PosterVariant) {
    const link = document.createElement('a')
    link.href = `data:image/jpeg;base64,${poster.image_base64}`
    link.download = `missing-child-poster-${poster.language}.jpg`
    link.click()
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {posters.map((poster) => (
        <div
          key={poster.language}
          className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-white shadow-sm"
        >
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {poster.language_name}
          </div>
          <div className="text-xs text-gray-700 bg-gray-50 rounded p-2 max-h-28 overflow-y-auto whitespace-pre-wrap">
            {atob(poster.image_base64)}
          </div>
          <button
            onClick={() => downloadPoster(poster)}
            className="text-xs text-blue-600 hover:underline text-left"
          >
            Download poster
          </button>
        </div>
      ))}
    </div>
  )
}
