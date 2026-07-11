from app.models.schemas import VideoGenerateResponse, ChildDescriptor
from app.services.gemini_service import generate_age_progression_video


async def create_age_progression_video(
    case_id: str, descriptor: ChildDescriptor, image_base64: str, target_ages: list[int]
) -> VideoGenerateResponse:
    video_url = await generate_age_progression_video(descriptor, image_base64, target_ages)

    return VideoGenerateResponse(
        case_id=case_id,
        video_url=video_url,
        duration_seconds=15.0,  # TODO: derive from actual video
    )
