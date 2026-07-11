import { useRef, useState, useCallback } from 'react'
import type { ChildDescriptor } from '../types'

const OLLAMA_URL = 'http://localhost:11434/v1/chat/completions'
const MODEL = 'gemma3:4b'

const CRITICAL_FIELDS: (keyof ChildDescriptor)[] = [
  'name', 'age', 'last_seen_location', 'last_seen_date',
  'clothing_description', 'distinguishing_marks',
]

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  age: 'Age',
  last_seen_location: 'Last seen location',
  last_seen_date: 'Last seen date',
  clothing_description: 'Clothing description',
  distinguishing_marks: 'Distinguishing marks',
}

export interface ChatMessage {
  role: 'assistant' | 'user'
  content: string
}

function getMissingFields(d: ChildDescriptor): (keyof ChildDescriptor)[] {
  return CRITICAL_FIELDS.filter((f) => d[f] == null || d[f] === '')
}

function validateField(field: string, value: unknown): boolean {
  if (value == null || value === '') return false
  if (field === 'age') {
    const n = Number(value)
    return Number.isInteger(n) && n > 0 && n <= 18
  }
  if (field === 'last_seen_location') {
    const s = String(value).trim().toLowerCase()
    return s.length > 3 && !['here', 'there', 'nearby', 'home', 'outside'].includes(s)
  }
  if (field === 'last_seen_date') {
    const s = String(value).trim()
    return s.length > 2 && (Date.parse(s) > 0 || /\d/.test(s))
  }
  if (field === 'clothing_description') {
    return String(value).trim().split(/\s+/).length >= 2
  }
  return String(value).trim().length > 0
}

function buildSystemPrompt(missing: string[], language: string): string {
  const fieldList = missing.map((f) => FIELD_LABELS[f] ?? f).join(', ')
  return `You are a compassionate intake assistant for a missing child emergency case.
Speak ONLY in ${language || 'English'}. If unsure of the language, use English.
The parent is trying to report a missing child. Several details are missing: ${fieldList}.
Ask about EXACTLY ONE field at a time, following this priority order: ${missing.map((f) => FIELD_LABELS[f] ?? f).join(' → ')}.
After the parent replies, extract the relevant value.

Respond ONLY as valid JSON with no markdown fences:
{
  "extracted_field": "<field key, e.g. age>",
  "extracted_value": <the extracted value, or null>,
  "next_question": "<your next question in ${language || 'English'}, or null if all fields are now covered>"
}`
}

export function useGemmaAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [deferredFields, setDeferredFields] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [ollamaError, setOllamaError] = useState<string | null>(null)

  const descriptorRef = useRef<ChildDescriptor>({})
  const languageRef = useRef('English')
  const historyRef = useRef<{ role: string; content: string }[]>([])
  const failedAttemptsRef = useRef<Record<string, number>>({})

  const appendMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg])
  }

  const callOllama = useCallback(async (history: { role: string; content: string }[]): Promise<string> => {
    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: history,
        stream: false,
        format: 'json',
      }),
    })
    if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  }, [])

  const start = useCallback(async (descriptor: ChildDescriptor, detectedLanguage: string) => {
    descriptorRef.current = { ...descriptor }
    languageRef.current = detectedLanguage || 'English'
    failedAttemptsRef.current = {}

    const missing = getMissingFields(descriptor)
    setMissingFields(missing.map(String))
    setDeferredFields([])
    setMessages([])
    setOllamaError(null)

    if (missing.length === 0) return

    setLoading(true)
    try {
      const systemPrompt = buildSystemPrompt(missing.map(String), languageRef.current)
      const openingHistory = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `The parent has reported their child is missing. Please ask your first question to gather the most important missing detail.`,
        },
      ]
      historyRef.current = openingHistory
      const raw = await callOllama(openingHistory)
      const parsed = JSON.parse(raw)
      const question = parsed.next_question ?? parsed.question ?? 'Can you describe your child?'
      historyRef.current.push({ role: 'assistant', content: raw })
      appendMessage({ role: 'assistant', content: question })
    } catch (e) {
      setOllamaError(String(e))
    } finally {
      setLoading(false)
    }
  }, [callOllama])

  // Returns updated descriptor and whether the interview is done
  const reply = useCallback(async (userText: string): Promise<{ updatedDescriptor: ChildDescriptor; done: boolean }> => {
    appendMessage({ role: 'user', content: userText })

    const userMsg = { role: 'user', content: userText }
    historyRef.current.push(userMsg)

    const currentMissing = getMissingFields(descriptorRef.current)

    setLoading(true)
    setOllamaError(null)
    try {
      const raw = await callOllama(historyRef.current)
      historyRef.current.push({ role: 'assistant', content: raw })

      let parsed: { extracted_field?: string; extracted_value?: unknown; next_question?: string | null }
      try {
        parsed = JSON.parse(raw)
      } catch {
        parsed = {}
      }

      const field = parsed.extracted_field
      const value = parsed.extracted_value
      let updatedDescriptor = { ...descriptorRef.current }
      let updatedMissing = [...currentMissing.map(String)]
      let updatedDeferred = [...deferredFields]

      if (field && value != null) {
        if (validateField(field, value)) {
          // Valid — merge into descriptor
          ;(updatedDescriptor as Record<string, unknown>)[field] =
            field === 'age' ? Number(value) : String(value)
          updatedMissing = updatedMissing.filter((f) => f !== field)
          failedAttemptsRef.current[field] = 0
        } else {
          // Invalid — increment failure count
          failedAttemptsRef.current[field] = (failedAttemptsRef.current[field] ?? 0) + 1
          if (failedAttemptsRef.current[field] >= 2) {
            // Defer to human
            updatedMissing = updatedMissing.filter((f) => f !== field)
            updatedDeferred = [...updatedDeferred, field]
          }
        }
      }

      descriptorRef.current = updatedDescriptor
      setMissingFields(updatedMissing)
      setDeferredFields(updatedDeferred)

      const done = updatedMissing.length === 0 || !parsed.next_question

      const displayQuestion = parsed.next_question
      if (displayQuestion) {
        appendMessage({ role: 'assistant', content: displayQuestion })
      }

      return { updatedDescriptor, done }
    } catch (e) {
      setOllamaError(String(e))
      return { updatedDescriptor: descriptorRef.current, done: false }
    } finally {
      setLoading(false)
    }
  }, [callOllama, deferredFields])

  const setDeferredFieldValue = useCallback((field: string, value: string) => {
    const updated = { ...descriptorRef.current, [field]: field === 'age' ? Number(value) : value }
    descriptorRef.current = updated
    setDeferredFields((prev) => prev.filter((f) => f !== field))
    setMissingFields((prev) => prev.filter((f) => f !== field))
  }, [])

  return {
    messages,
    missingFields,
    deferredFields,
    loading,
    ollamaError,
    fieldLabels: FIELD_LABELS,
    criticalFields: CRITICAL_FIELDS.map(String),
    start,
    reply,
    setDeferredFieldValue,
    getDescriptor: () => descriptorRef.current,
  }
}
