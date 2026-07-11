from fastapi import APIRouter
from app.models.schemas import PosterGenerateRequest, PosterGenerateResponse
from app.services.poster_service import generate_posters

router = APIRouter(prefix="/poster", tags=["poster"])


@router.post("/generate", response_model=PosterGenerateResponse)
async def generate_poster(request: PosterGenerateRequest):
    return await generate_posters(request.case_id, request.descriptor)
