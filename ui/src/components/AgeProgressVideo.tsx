interface Props {
  videoUrl: string
}

export default function AgeProgressVideo({ videoUrl }: Props) {
  const isUrl = videoUrl.startsWith('http')

  return (
    <div className="rounded overflow-hidden border border-[var(--border-color)]">
      {isUrl ? (
        <video controls className="w-full max-h-96 object-cover bg-black" src={videoUrl}>
          Your browser does not support video playback.
        </video>
      ) : (
        <div className="p-6 bg-[var(--bg-color)] text-[var(--text-primary)] text-sm whitespace-pre-wrap leading-relaxed font-mono">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--border-color)]">
            <span className="font-medium text-[var(--primary-color)] uppercase tracking-wider text-xs">Video Sequence Data</span>
          </div>
          <div className="bg-[var(--paper-bg)] p-4 border border-[var(--border-color)] rounded">
             {videoUrl}
          </div>
        </div>
      )}
    </div>
  )
}
