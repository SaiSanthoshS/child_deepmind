import { useEffect, useRef, useState } from 'react'
import { useLiveInterview } from '../hooks/useLiveInterview'
import type { ChildDescriptor } from '../types'

interface Props {
  descriptor: ChildDescriptor
  detectedLanguage?: string
  onUpdate: (d: ChildDescriptor) => void
  onDone: (d: ChildDescriptor) => void
  onSwitchToForm: () => void
}

const PHASE_LABELS: Record<string, string> = {
  idle: 'Ready',
  starting: 'Connecting…',
  speaking: 'Agent speaking…',
  listening: 'Listening…',
  processing: 'Thinking…',
  done: 'Complete',
  error: 'Error',
}

const PHASE_COLORS: Record<string, string> = {
  idle: 'bg-gray-100 text-gray-500',
  starting: 'bg-blue-50 text-blue-600',
  speaking: 'bg-purple-50 text-purple-700',
  listening: 'bg-green-50 text-green-700',
  processing: 'bg-yellow-50 text-yellow-700',
  done: 'bg-green-100 text-green-800',
  error: 'bg-red-50 text-red-700',
}

const LANGUAGES = [
  { label: 'English',    value: 'English',   bcp47: 'en-IN' },
  { label: 'हिंदी',      value: 'Hindi',     bcp47: 'hi-IN' },
  { label: 'தமிழ்',      value: 'Tamil',     bcp47: 'ta-IN' },
  { label: 'తెలుగు',    value: 'Telugu',    bcp47: 'te-IN' },
  { label: 'বাংলা',      value: 'Bengali',   bcp47: 'bn-IN' },
  { label: 'मराठी',      value: 'Marathi',   bcp47: 'mr-IN' },
  { label: 'ಕನ್ನಡ',      value: 'Kannada',   bcp47: 'kn-IN' },
  { label: 'മലയാളം',    value: 'Malayalam', bcp47: 'ml-IN' },
  { label: 'ਪੰਜਾਬੀ',    value: 'Punjabi',   bcp47: 'pa-IN' },
  { label: 'ગુજરાતી',   value: 'Gujarati',  bcp47: 'gu-IN' },
]

export default function LiveIntakeAgent({ descriptor, detectedLanguage, onUpdate, onDone }: Props) {
  const { phase, turns, missingFields, errorMsg, start, stop } = useLiveInterview()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Pick initial language from detectedLanguage prop, default English
  const initLang = LANGUAGES.find(
    l => l.value.toLowerCase() === (detectedLanguage ?? '').toLowerCase()
  ) ?? LANGUAGES[0]
  const [selectedLang, setSelectedLang] = useState(initLang)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns])

  const isActive = phase === 'speaking' || phase === 'listening' || phase === 'processing' || phase === 'starting'

  function handleStart() {
    start(descriptor, selectedLang.value, selectedLang.bcp47, onUpdate, onDone)
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Language selector — only shown when idle/done/error */}
      {!isActive && (
        <select
          value={selectedLang.value}
          onChange={e => setSelectedLang(LANGUAGES.find(l => l.value === e.target.value) ?? LANGUAGES[0])}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>{l.label} ({l.value})</option>
          ))}
        </select>
      )}

      {/* Phase indicator */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${PHASE_COLORS[phase] ?? PHASE_COLORS.idle}`}>
        {phase === 'listening' && (
          <span className="flex gap-0.5 items-end h-4">
            {[0, 1, 2, 3].map(i => (
              <span key={i} className="w-0.5 bg-green-500 rounded-full animate-pulse"
                style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 100}ms` }} />
            ))}
          </span>
        )}
        {phase === 'speaking' && (
          <span className="w-3 h-3 rounded-full bg-purple-400 animate-ping flex-shrink-0" />
        )}
        {(phase === 'starting' || phase === 'processing') && (
          <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        )}
        <span>{PHASE_LABELS[phase] ?? phase}</span>
        {phase === 'listening' && <span className="text-xs font-normal ml-auto">speak now</span>}
      </div>

      {/* Conversation transcript */}
      {turns.length > 0 && (
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {turns.map((t, i) => (
            <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] px-3 py-2 rounded-2xl text-sm leading-snug ${
                t.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                {t.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Missing fields pills */}
      {missingFields.length > 0 && phase !== 'idle' && (
        <div className="flex flex-wrap gap-1">
          {missingFields.map(f => (
            <span key={f} className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
              {f.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Done */}
      {phase === 'done' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs text-green-700 font-medium text-center">
          All details collected — review and edit in the form →
        </div>
      )}

      {/* Controls */}
      {(phase === 'idle' || phase === 'error' || phase === 'done') && (
        <button
          onClick={handleStart}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          {phase === 'done' ? 'Restart Interview' : '🎤 Start Voice Interview'}
        </button>
      )}
      {isActive && (
        <button
          onClick={stop}
          className="w-full py-2.5 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors"
        >
          Stop
        </button>
      )}
    </div>
  )
}
