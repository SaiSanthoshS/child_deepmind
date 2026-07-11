from pydantic import BaseModel
from typing import Optional
from enum import Enum


class ChildDescriptor(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    distinguishing_marks: Optional[str] = None
    last_seen_location: Optional[str] = None
    last_seen_date: Optional[str] = None
    clothing_description: Optional[str] = None
    language_used: Optional[str] = None


class TranscribeResponse(BaseModel):
    descriptor: ChildDescriptor
    raw_transcript: str
    detected_language: str


class PhotoVariant(BaseModel):
    angle: str  # front, left, right
    image_base64: str
    mime_type: str = "image/jpeg"


class PhotoEnhanceResponse(BaseModel):
    variants: list[PhotoVariant]
    case_id: str


class VideoGenerateRequest(BaseModel):
    case_id: str
    descriptor: ChildDescriptor
    target_ages: list[int] = [12, 14, 16]


class VideoGenerateResponse(BaseModel):
    case_id: str
    video_url: str
    duration_seconds: float


class PosterGenerateRequest(BaseModel):
    case_id: str
    descriptor: ChildDescriptor


class Language(str, Enum):
    hindi = "hi"
    bengali = "bn"
    telugu = "te"
    marathi = "mr"
    tamil = "ta"
    urdu = "ur"
    gujarati = "gu"
    kannada = "kn"
    odia = "or"
    punjabi = "pa"
    malayalam = "ml"
    english = "en"


class PosterVariant(BaseModel):
    language: Language
    language_name: str
    image_base64: str


class PosterGenerateResponse(BaseModel):
    case_id: str
    posters: list[PosterVariant]


class DispatchChannel(str, Enum):
    railway = "railway"
    ngo_whatsapp = "ngo_whatsapp"
    police = "police"


class DispatchRequest(BaseModel):
    case_id: str
    descriptor: ChildDescriptor
    channels: list[DispatchChannel] = list(DispatchChannel)


class ChannelStatus(BaseModel):
    channel: DispatchChannel
    sent: int
    total: int
    status: str  # pending, in_progress, done, failed


class DispatchResponse(BaseModel):
    case_id: str
    channel_statuses: list[ChannelStatus]


class DispatchStatusResponse(BaseModel):
    case_id: str
    overall_status: str
    channel_statuses: list[ChannelStatus]
    dispatched_at: Optional[str] = None
