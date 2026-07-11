from fastapi import APIRouter, File, UploadFile, Form, HTTPException
import os
import base64
from typing import List, Optional
from pydantic import BaseModel
from app.services import gemini_service, image_utils
from app.core.config import get_settings

router = APIRouter(prefix="/match", tags=["matcher"])
settings = get_settings()

class MatchProfile(BaseModel):
    similarity_score: int
    case_detail: str
    image_base64: str

class MatchResponse(BaseModel):
    matches: List[MatchProfile]

@router.post("-found-child", response_model=MatchResponse)
async def match_found_child(
    photo: UploadFile = File(...),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None)
):
    try:
        uploaded_bytes = await photo.read()
        uploaded_bytes = image_utils.validate_and_resize(uploaded_bytes)
        uploaded_bytes = image_utils.convert_format(uploaded_bytes, "JPEG")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    outputs_dir = settings.output_dir
    matches = []

    if not os.path.exists(outputs_dir):
        return MatchResponse(matches=[])

    for filename in os.listdir(outputs_dir):
        if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
            
        filepath = os.path.join(outputs_dir, filename)
        try:
            with open(filepath, "rb") as f:
                db_image_bytes = f.read()
                
            # Call Gemini to compare faces
            result = await gemini_service.compare_faces(uploaded_bytes, db_image_bytes)
            similarity = result.get("similarity_score", 0)
            
            if similarity > 60:
                base64_img = base64.b64encode(db_image_bytes).decode('utf-8')
                matches.append(MatchProfile(
                    similarity_score=similarity,
                    case_detail=filename,
                    image_base64=f"data:image/jpeg;base64,{base64_img}"
                ))
        except Exception as e:
            print(f"Failed to process {filename}: {e}")
            continue

    # Sort matches by similarity score descending
    matches.sort(key=lambda x: x.similarity_score, reverse=True)
    
    return MatchResponse(matches=matches)
