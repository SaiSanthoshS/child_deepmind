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
  AgeProgressionResponse,
  ImageEditResponse,
  InterviewStartRequest,
  InterviewStartResponse,
  InterviewReplyRequest,
  InterviewReplyResponse,
  MatchResponse,
  CasesResponse,
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

export async function generateAgeProgression(
  file: File,
  currentAge: number,
  targetAges: number[],
  gender: string,
  description: string,
  childName?: string,
): Promise<AgeProgressionResponse> {
  const form = new FormData()
  form.append('file', file)
  form.append('current_age', String(currentAge))
  form.append('target_ages', targetAges.join(','))
  form.append('gender', gender)
  form.append('description', description)
  if (childName) form.append('child_name', childName)
  return request<AgeProgressionResponse>('/age-progress', { method: 'POST', body: form })
}

export async function editImage(file: File, instruction: string): Promise<ImageEditResponse> {
  const form = new FormData()
  form.append('file', file)
  form.append('instruction', instruction)
  return request<ImageEditResponse>('/edit', { method: 'POST', body: form })
}

export async function matchFoundChild(photo: File, lat?: number, lng?: number): Promise<MatchResponse> {
  const form = new FormData()
  form.append('photo', photo)
  if (lat !== undefined) form.append('lat', String(lat))
  if (lng !== undefined) form.append('lng', String(lng))
  return request<MatchResponse>('/match-found-child', { method: 'POST', body: form })
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

export async function getDispatchLocations(city: string): Promise<{ railway_stations: {name:string,location:string,contact:string}[], ngos: {name:string,location:string,contact:string}[] }> {
  return request('/dispatch/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city }),
  })
}

export async function startInterview(body: InterviewStartRequest): Promise<InterviewStartResponse> {
  return request<InterviewStartResponse>('/interview/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function replyInterview(body: InterviewReplyRequest): Promise<InterviewReplyResponse> {
  return request<InterviewReplyResponse>('/interview/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function sendFamilyEmail(caseId: string, name: string, foundLocation: string, uploadedImageBase64: string): Promise<{ status: string }> {
  return request<{ status: string }>('/send-family-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      case_id: caseId,
      name,
      found_location: foundLocation,
      uploaded_image_base64: uploadedImageBase64
    }),
  })
}

export async function getAllCases(): Promise<CasesResponse> {
  return request<CasesResponse>('/cases')
}
