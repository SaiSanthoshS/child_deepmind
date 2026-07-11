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
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors shadow-md ${
          recording
            ? 'bg-[var(--error-text)] text-[#ffffff] hover:opacity-80'
            : 'bg-[var(--primary-color)] text-[#ffffff] hover:bg-[var(--primary-hover)]'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="text-3xl">{recording ? '⏹' : '🎤'}</span>
      </button>
      <div className="text-center">
        <p className={`text-lg font-medium ${recording ? 'text-[var(--error-text)]' : 'text-[var(--text-primary)]'}`}>
          {recording ? 'Recording in progress...' : 'Tap to speak'}
        </p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Speak in any language
        </p>
      </div>
    </div>
  )
}
