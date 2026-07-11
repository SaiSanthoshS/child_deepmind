import type { PosterVariant } from '../types'

interface Props {
  posters: PosterVariant[]
}

export default function PosterGrid({ posters }: Props) {
  function downloadPoster(poster: PosterVariant) {
    const isImage = poster.mime_type === 'image/jpeg' || poster.mime_type === 'image/png'
    const link = document.createElement('a')
    link.href = `data:${poster.mime_type};base64,${poster.image_base64}`
    link.download = `missing-child-poster-${poster.language}.${isImage ? 'jpg' : 'txt'}`
    link.click()
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {posters.map((poster) => (
        <div
          key={poster.language}
          className="border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white shadow-sm"
        >
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1 bg-gray-50 border-b border-gray-100">
            {poster.language_name}
          </div>

          {poster.mime_type === 'image/jpeg' || poster.mime_type === 'image/png' ? (
            <img
              src={`data:${poster.mime_type};base64,${poster.image_base64}`}
              alt={`Missing child poster in ${poster.language_name}`}
              className="w-full object-contain"
            />
          ) : (
            <div className="text-xs text-gray-700 bg-white p-2 max-h-40 overflow-y-auto whitespace-pre-wrap flex-1">
              {atob(poster.image_base64)}
            </div>
          )}

          <button
            onClick={() => downloadPoster(poster)}
            className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 text-left border-t border-gray-100 transition-colors"
          >
            ↓ Download
          </button>
        </div>
      ))}
    </div>
  )
}
