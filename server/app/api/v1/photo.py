import uuid
from fastapi import APIRouter, UploadFile, File, Form
from app.models.schemas import PhotoEnhanceResponse
from app.services.photo_service import enhance_and_generate_variants

router = APIRouter(prefix="/photo", tags=["photo"])


@router.post("/enhance", response_model=PhotoEnhanceResponse)
async def enhance_photo(
    photo: UploadFile = File(...),
    case_id: str = Form(default=None),
):
    image_bytes = await photo.read()
    cid = case_id or str(uuid.uuid4())
    return await enhance_and_generate_variants(image_bytes, cid)
