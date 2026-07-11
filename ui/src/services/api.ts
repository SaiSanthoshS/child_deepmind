import type {
  TranscribeResponse,
  PhotoEnhanceResponse,
  VideoGenerateRequest,
  VideoGenerateResponse,
  PosterGenerateRequest,
  PosterGenerateResponse,
  DispatchRequest,
  DispatchResponse,
  DispatchStatusResponse,
} from '../types'

const BASE = '/api/v1'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function transcribeVoice(audioBlob: Blob): Promise<TranscribeResponse> {
  const form = new FormData()
  form.append('audio', audioBlob, 'recording.webm')
  return request<TranscribeResponse>('/voice/transcribe', { method: 'POST', body: form })
}

export async function enhancePhoto(file: File, caseId?: string): Promise<PhotoEnhanceResponse> {
  const form = new FormData()
  form.append('photo', file)
  if (caseId) form.append('case_id', caseId)
  return request<PhotoEnhanceResponse>('/photo/enhance', { method: 'POST', body: form })
}

export async function generateAgeProgressVideo(
  body: VideoGenerateRequest
): Promise<VideoGenerateResponse> {
  return request<VideoGenerateResponse>('/video/age-progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function generatePosters(
  body: PosterGenerateRequest
): Promise<PosterGenerateResponse> {
  return request<PosterGenerateResponse>('/poster/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function dispatchAlert(body: DispatchRequest): Promise<DispatchResponse> {
  return request<DispatchResponse>('/dispatch/alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function getDispatchStatus(caseId: string): Promise<DispatchStatusResponse> {
  return request<DispatchStatusResponse>(`/dispatch/status/${caseId}`)
}
