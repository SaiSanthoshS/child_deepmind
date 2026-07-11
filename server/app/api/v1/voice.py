from fastapi import APIRouter, UploadFile, File
from app.models.schemas import TranscribeResponse
from app.services.gemini_service import transcribe_voice

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    return await transcribe_voice(audio_bytes, audio.content_type or "audio/webm")
