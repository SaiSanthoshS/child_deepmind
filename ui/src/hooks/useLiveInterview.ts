import { useCallback, useRef, useState } from 'react'
import { startInterview, replyInterview } from '../services/api'
import type { ChildDescriptor } from '../types'

export type InterviewPhase =
  | 'idle'
  | 'starting'
  | 'speaking'   // agent is talking (TTS)
  | 'listening'  // mic is open, waiting for user
  | 'processing' // sending to backend
  | 'done'
  | 'error'

export interface Turn {
  role: 'agent' | 'user'
  text: string
}

export function useLiveInterview() {
  const [phase, setPhase] = useState<InterviewPhase>('idle')
  const [turns, setTurns] = useState<Turn[]>([])
  const [descriptor, setDescriptor] = useState<ChildDescriptor>({})
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const sessionIdRef = useRef<string>('')
  const environmentIdRef = useRef<string>('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const stoppedRef = useRef(false)

  const addTurn = (role: Turn['role'], text: string) =>
    setTurns(prev => [...prev, { role, text }])

  // Speak text via TTS, resolve when done
  const speak = useCallback((text: string, lang: string): Promise<void> => {
    return new Promise(resolve => {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = lang
      utt.rate = 0.95
      utt.onend = () => resolve()
      utt.onerror = () => resolve()
      window.speechSynthesis.speak(utt)
    })
  }, [])

  // Open mic and resolve with the transcribed text
  const listen = useCallback((lang: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        reject(new Error('SpeechRecognition not supported in this browser. Use Chrome or Edge.'))
        return
      }
      const recognition: SpeechRecognition = new SpeechRecognition()
      recognition.lang = lang
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognitionRef.current = recognition

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript
        resolve(transcript)
      }
      recognition.onerror = (e) => reject(new Error(`Mic error: ${e.error}`))
      recognition.onend = () => {
        // If no result yet (silence), resolve with empty string
        resolve('')
      }
      recognition.start()
    })
  }, [])

  // Map detected_language string to a BCP-47 tag for Web Speech API
  async function runTurn(question: string, langTag: string, onUpdate: (d: ChildDescriptor) => void, onDone: (d: ChildDescriptor) => void) {
    if (stoppedRef.current) return

    addTurn('agent', question)
    setPhase('speaking')
    await speak(question, langTag)
    if (stoppedRef.current) return

    setPhase('listening')
    let userText = ''
    try {
      userText = await listen(langTag)
    } catch (err) {
      setErrorMsg(String(err))
      setPhase('error')
      return
    }
    if (stoppedRef.current) return
    if (!userText.trim()) {
      await runTurn(question, langTag, onUpdate, onDone)
      return
    }

    addTurn('user', userText)
    setPhase('processing')

    try {
      const res = await replyInterview({
        session_id: sessionIdRef.current,
        environment_id: environmentIdRef.current,
        user_text: userText,
      })
      environmentIdRef.current = res.environment_id
      sessionIdRef.current = res.session_id
      setDescriptor(res.updated_descriptor)
      setMissingFields(res.missing_fields)
      onUpdate(res.updated_descriptor)

      if (res.done || !res.question) {
        const closing = 'Thank you. I have all the details I need.'
        addTurn('agent', closing)
        setPhase('speaking')
        await speak(closing, langTag)
        setPhase('done')
        onDone(res.updated_descriptor)
      } else {
        await runTurn(res.question, langTag, onUpdate, onDone)
      }
    } catch (err) {
      setErrorMsg(String(err))
      setPhase('error')
    }
  }

  const start = useCallback(async (
    initialDescriptor: ChildDescriptor,
    detectedLanguage: string,
    langTag: string,
    onUpdate: (d: ChildDescriptor) => void,
    onDone: (d: ChildDescriptor) => void,
  ) => {
    stoppedRef.current = false
    setTurns([])
    setErrorMsg(null)
    setDescriptor(initialDescriptor)
    setPhase('starting')

    try {
      const res = await startInterview({
        descriptor: initialDescriptor,
        detected_language: detectedLanguage || 'English',
      })
      sessionIdRef.current = res.session_id
      environmentIdRef.current = res.environment_id
      setMissingFields(res.missing_fields)

      if (res.done) {
        setPhase('done')
        onDone(initialDescriptor)
        return
      }

      await runTurn(res.question, langTag, onUpdate, onDone)
    } catch (err) {
      setErrorMsg(String(err))
      setPhase('error')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speak, listen])

  const stop = useCallback(() => {
    stoppedRef.current = true
    window.speechSynthesis.cancel()
    recognitionRef.current?.stop()
    setPhase('idle')
  }, [])

  return { phase, turns, descriptor, missingFields, errorMsg, start, stop }
}
