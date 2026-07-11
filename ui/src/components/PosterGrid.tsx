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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {posters.map((poster) => (
        <div
          key={poster.language}
          className="flex flex-col border border-[var(--border-color)] rounded overflow-hidden shadow-sm"
        >
          <div className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider px-3 py-2 bg-[var(--bg-color)] border-b border-[var(--border-color)]">
            {poster.language_name}
          </div>

          <div className="relative flex-1 bg-[var(--border-color)] flex items-center justify-center overflow-hidden min-h-[200px]">
            {poster.mime_type === 'image/jpeg' || poster.mime_type === 'image/png' ? (
              <img
                src={`data:${poster.mime_type};base64,${poster.image_base64}`}
                alt={`Missing child poster in ${poster.language_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-xs text-[var(--text-primary)] p-3 max-h-48 overflow-y-auto whitespace-pre-wrap w-full bg-[var(--paper-bg)]">
                {atob(poster.image_base64)}
              </div>
            )}
          </div>

          <button
            onClick={() => downloadPoster(poster)}
            className="w-full bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-[#ffffff] text-xs font-semibold py-3 px-3 flex items-center justify-center gap-2 uppercase transition-colors"
          >
            <span className="text-sm">📥</span>
            DOWNLOAD
          </button>
        </div>
      ))}
    </div>
  )
}
