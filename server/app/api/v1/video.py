from fastapi import APIRouter, HTTPException
from app.models.schemas import VideoGenerateRequest, VideoGenerateResponse
from app.services.video_service import create_age_progression_video

router = APIRouter(prefix="/video", tags=["video"])


@router.post("/age-progress", response_model=VideoGenerateResponse)
async def age_progress(request: VideoGenerateRequest):
    return await create_age_progression_video(
        case_id=request.case_id,
        descriptor=request.descriptor,
        image_base64=request.photo_base64,
        target_ages=request.target_ages,
    )
