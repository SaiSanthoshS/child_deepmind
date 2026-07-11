interface Props {
  videoUrl: string
}

export default function AgeProgressVideo({ videoUrl }: Props) {
  const isUrl = videoUrl.startsWith('http')

  return (
    <div className="rounded-xl overflow-hidden bg-black">
      {isUrl ? (
        <video controls className="w-full max-h-72" src={videoUrl}>
          Your browser does not support video playback.
        </video>
      ) : (
        <div className="p-6 text-white text-sm whitespace-pre-wrap leading-relaxed">
          <p className="text-yellow-400 font-semibold mb-2">Age Progression Description</p>
          {videoUrl}
        </div>
      )}
    </div>
  )
}
