import { useRef, useState } from 'react'

interface Props {
  onRecorded: (blob: Blob) => void
  disabled?: boolean
}

export default function VoiceRecorder({ onRecorded, disabled }: Props) {
  const [recording, setRecording] = useState(false)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    chunksRef.current = []
    mr.ondataavailable = (e) => chunksRef.current.push(e.data)
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      onRecorded(blob)
      stream.getTracks().forEach((t) => t.stop())
    }
    mr.start()
    mediaRef.current = mr
    setRecording(true)
  }

  function stopRecording() {
    mediaRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled}
        className={`w-20 h-20 rounded-full text-white font-semibold shadow-lg transition-all
          ${recording
            ? 'bg-red-500 animate-pulse scale-110'
            : 'bg-blue-600 hover:bg-blue-700'
          } disabled:opacity-40`}
      >
        {recording ? 'Stop' : 'Record'}
      </button>
      <p className="text-sm text-gray-500">
        {recording ? 'Recording… speak in any language' : 'Tap to record your child\'s description'}
      </p>
    </div>
  )
}
