import { useState, useEffect, useRef } from 'react'
import VoiceRecorder from './VoiceRecorder'
import { transcribeVoice } from '../services/api'
import { useGemmaAgent } from '../hooks/useGemmaAgent'
import type { ChildDescriptor } from '../types'

interface Props {
  descriptor: ChildDescriptor
  detectedLanguage?: string
  onUpdate: (d: ChildDescriptor) => void
  onDone: (d: ChildDescriptor) => void
  onSwitchToForm: () => void
}

export default function IntakeAgent({ descriptor, detectedLanguage, onUpdate, onDone, onSwitchToForm }: Props) {
  const {
    messages, missingFields, deferredFields, loading, ollamaError,
    fieldLabels, criticalFields, start, reply, setDeferredFieldValue, getDescriptor,
  } = useGemmaAgent()

  const [input, setInput] = useState('')
  const [showVoice, setShowVoice] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [deferInputs, setDeferInputs] = useState<Record<string, string>>({})
  const [isDone, setIsDone] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    start(descriptor, detectedLanguage ?? 'English')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const { updatedDescriptor, done } = await reply(text)
    onUpdate(updatedDescriptor)
    if (done) {
      setIsDone(true)
      onDone(updatedDescriptor)
    }
  }

  async function handleVoiceBlob(blob: Blob) {
    setShowVoice(false)
    setTranscribing(true)
    try {
      const result = await transcribeVoice(blob)
      const text = result.raw_transcript?.trim()
      if (text) {
        const { updatedDescriptor, done } = await reply(text)
        onUpdate(updatedDescriptor)
        if (done) {
          setIsDone(true)
          onDone(updatedDescriptor)
        }
      }
    } catch {
      // ignore transcription error — user can retry
    } finally {
      setTranscribing(false)
    }
  }

  function handleDeferSubmit(field: string) {
    const val = deferInputs[field]?.trim()
    if (!val) return
    setDeferredFieldValue(field, val)
    const updated = { ...getDescriptor(), [field]: field === 'age' ? Number(val) : val }
    onUpdate(updated)
    const remaining = missingFields.filter((f) => f !== field)
    const remainingDeferred = deferredFields.filter((f) => f !== field)
    if (remaining.length === 0 && remainingDeferred.length <= 1) {
      setIsDone(true)
      onDone(updated)
    }
  }

  const currentDescriptor = getDescriptor()
  const filledFields = criticalFields.filter((f) => {
    const v = (currentDescriptor as Record<string, unknown>)[f]
    return v != null && v !== ''
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Field progress pills */}
      <div className="flex flex-wrap gap-1.5">
        {criticalFields.map((f) => {
          const filled = filledFields.includes(f)
          const deferred = deferredFields.includes(f)
          return (
            <span
              key={f}
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                filled
                  ? 'bg-green-100 text-green-700'
                  : deferred
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {filled ? '✓ ' : deferred ? '⚠ ' : ''}{fieldLabels[f] ?? f}
            </span>
          )
        })}
      </div>

      {/* Ollama error */}
      {ollamaError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <strong>Ollama error:</strong> {ollamaError}
          <br />
          <span className="text-xs text-red-500">Make sure Ollama is running: <code>ollama serve</code> and <code>ollama pull gemma3:4b</code></span>
        </div>
      )}

      {/* Chat bubbles */}
      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Deferred field inline inputs */}
        {deferredFields.map((field) => (
          <div key={field} className="flex justify-start">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl rounded-bl-sm px-3 py-2 max-w-[80%]">
              <p className="text-xs text-orange-700 mb-1 font-medium">
                I had trouble understanding {fieldLabels[field] ?? field}. Please type it directly:
              </p>
              <div className="flex gap-2">
                <input
                  type={field === 'age' ? 'number' : 'text'}
                  placeholder={fieldLabels[field] ?? field}
                  value={deferInputs[field] ?? ''}
                  onChange={(e) => setDeferInputs((p) => ({ ...p, [field]: e.target.value }))}
                  className="flex-1 text-sm border border-orange-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <button
                  onClick={() => handleDeferSubmit(field)}
                  className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ))}

        {(loading || transcribing) && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Done state */}
      {isDone && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 font-medium text-center">
          All details collected — you can proceed below.
        </div>
      )}

      {/* Reply area */}
      {!isDone && (
        <div className="flex flex-col gap-2">
          {showVoice ? (
            <div className="border border-blue-200 rounded-xl p-3 bg-blue-50">
              <VoiceRecorder onRecorded={handleVoiceBlob} disabled={transcribing} />
              <button
                onClick={() => setShowVoice(false)}
                className="mt-2 text-xs text-gray-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your reply…"
                disabled={loading || transcribing}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading || transcribing}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Send
              </button>
              <button
                onClick={() => setShowVoice(true)}
                disabled={loading || transcribing}
                className="px-3 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                title="Record reply"
              >
                🎤
              </button>
            </div>
          )}
        </div>
      )}

      {/* Escape hatch */}
      <button
        onClick={onSwitchToForm}
        className="text-xs text-gray-400 hover:text-gray-600 hover:underline text-center"
      >
        Skip interview — fill form manually instead
      </button>
    </div>
  )
}
