import base64
import uuid
from app.models.schemas import PhotoEnhanceResponse, PhotoVariant


async def enhance_and_generate_variants(
    image_bytes: bytes, case_id: str | None = None
) -> PhotoEnhanceResponse:
    # TODO: Integrate NB2 Lite for:
    # 1. Upscale/enhance low-quality photo
    # 2. Generate front, left-side, right-side angle variants
    # For now returns the original image as a stub for all 3 angles

    if case_id is None:
        case_id = str(uuid.uuid4())

    b64 = base64.b64encode(image_bytes).decode()

    variants = [
        PhotoVariant(angle="front", image_base64=b64),
        PhotoVariant(angle="left", image_base64=b64),
        PhotoVariant(angle="right", image_base64=b64),
    ]

    return PhotoEnhanceResponse(case_id=case_id, variants=variants)
