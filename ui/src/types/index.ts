export interface ChildDescriptor {
  name?: string
  age?: number
  gender?: string
  height_cm?: number
  weight_kg?: number
  distinguishing_marks?: string
  last_seen_location?: string
  last_seen_date?: string
  clothing_description?: string
  language_used?: string
}

export interface TranscribeResponse {
  descriptor: ChildDescriptor
  raw_transcript: string
  detected_language: string
}

export interface PhotoVariant {
  angle: string
  image_base64: string
  mime_type: string
}

export interface PhotoEnhanceResponse {
  case_id: string
  variants: PhotoVariant[]
}

export interface VideoGenerateRequest {
  case_id: string
  descriptor: ChildDescriptor
  target_ages: number[]
  photo_base64?: string
}

export interface VideoGenerateResponse {
  case_id: string
  video_url: string
  duration_seconds: number
}

export interface PosterGenerateRequest {
  case_id: string
  descriptor: ChildDescriptor
  photo_base64?: string
}

export interface PosterVariant {
  language: string
  language_name: string
  image_base64: string
  mime_type: string
}

export interface PosterGenerateResponse {
  case_id: string
  posters: PosterVariant[]
}

export interface AgeProgressionResult {
  target_age: number
  image_url: string
  filename: string
}

export interface AgeProgressionResponse {
  request_id: string
  child_name?: string
  current_age: number
  results: AgeProgressionResult[]
  grid_url?: string
}

export interface ImageEditResponse {
  request_id: string
  edited_image_url: string
  instruction_applied: string
}

export type DispatchChannel = 'railway' | 'ngo_whatsapp' | 'police'

export interface ChannelStatus {
  channel: DispatchChannel
  sent: number
  total: number
  status: 'pending' | 'in_progress' | 'done' | 'failed'
}

export interface DispatchRequest {
  case_id: string
  descriptor: ChildDescriptor
  channels: DispatchChannel[]
}

export interface DispatchResponse {
  case_id: string
  channel_statuses: ChannelStatus[]
}

export interface DispatchStatusResponse {
  case_id: string
  overall_status: string
  channel_statuses: ChannelStatus[]
  dispatched_at?: string
}

export interface MatchProfile {
  similarity_score: number
  rationale: string
  case_id: string
  name?: string
  age?: number
  gender?: string
  last_seen_location?: string
  last_seen_date?: string
  image_base64: string
}

export interface MatchResponse {
  matches: MatchProfile[]
}
