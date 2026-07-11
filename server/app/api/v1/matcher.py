from fastapi import APIRouter, File, UploadFile, Form, HTTPException
import base64
from typing import List, Optional
from pydantic import BaseModel
from app.services import case_store, gemini_service, mail_service
from app.core.config import get_settings
from datetime import datetime

router = APIRouter(tags=["Matcher"])

class MatchProfile(BaseModel):
    similarity_score: int
    rationale: str
    case_id: str
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    last_seen_location: Optional[str] = None
    last_seen_date: Optional[str] = None
    image_base64: str

class MatchResponse(BaseModel):
    matches: List[MatchProfile]

class EmailRequest(BaseModel):
    case_id: str
    name: str
    found_location: str
    uploaded_image_base64: str

@router.post("/send-family-email")
async def send_family_email(req: EmailRequest):
    found_time = datetime.now().strftime("%I:%M %p Today")
    success = mail_service.send_found_child_email(
        child_name=req.name,
        case_id=req.case_id,
        found_location=req.found_location,
        uploaded_image_base64=req.uploaded_image_base64,
        found_time=found_time
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email notification")
    return {"status": "sent"}

@router.post("/match-found-child", response_model=MatchResponse)
async def match_found_child(
    photo: UploadFile = File(...),
    lat: float = Form(None),
    lng: float = Form(None),
):
    try:
        uploaded_bytes = await photo.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    settings = get_settings()
    
    # 1. Discover all images in server/cases/ (recursive)
    # Folders are structured as: cases/<case_id>/...
    image_pool = []
    if settings.cases_dir.exists():
        for case_dir in settings.cases_dir.iterdir():
            if case_dir.is_dir():
                case_id = case_dir.name
                # Find all images in this case folder and subfolders (like 'posters')
                for ext in ("*.jpg", "*.jpeg", "*.png"):
                    for img_path in case_dir.rglob(ext):
                        image_pool.append({
                            "case_id": case_id,
                            "path": img_path
                        })
    
    print(f"DEBUG: Found {len(image_pool)} images in case folders for scanning")
    
    matches_map = {} # case_id -> highest score profile

    for item in image_pool:
        case_id = item["case_id"]
        img_path = item["path"]
        
        try:
            db_img_bytes = img_path.read_bytes()
            result = await gemini_service.compare_faces(uploaded_bytes, db_img_bytes)
            score = result.get("similarity_score", 0)
            
            if score >= 70:
                # Fetch fresh details from DB for enrichment
                case_data = case_store.get_case(case_id)
                if not case_data:
                    # Even if not in DB, we can still report the visual match
                    case_data = {"name": "Unregistered", "age": None, "gender": None, "last_seen_location": "Folder: " + case_id}

                # Use base64 for the UI to display the matching database photo
                db_image_base64 = base64.b64encode(db_img_bytes).decode("utf-8")

                profile = MatchProfile(
                    similarity_score=score,
                    rationale=result.get("rationale", ""),
                    case_id=case_id,
                    name=case_data.get("name"),
                    age=case_data.get("age"),
                    gender=case_data.get("gender"),
                    last_seen_location=case_data.get("last_seen_location"),
                    last_seen_date=case_data.get("last_seen_date"),
                    image_base64=db_image_base64
                )
                
                # Deduplicate: only keep highest score per child
                if case_id not in matches_map or score > matches_map[case_id].similarity_score:
                    matches_map[case_id] = profile

        except Exception as e:
            print(f"Error processing image {img_path}: {e}")
            continue

    # Convert to sorted list
    results = sorted(matches_map.values(), key=lambda x: x.similarity_score, reverse=True)
    return MatchResponse(matches=results[:5]) # Return top 5 matches
