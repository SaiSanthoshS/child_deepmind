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
    city: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    distinguishing_marks: Optional[str] = None
    clothing_description: Optional[str] = None
    last_seen_location: Optional[str] = None
    last_seen_date: Optional[str] = None
    image_base64: str

class MatchResponse(BaseModel):
    matches: List[MatchProfile]

class CaseRecord(BaseModel):
    case_id: str
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    city: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    distinguishing_marks: Optional[str] = None
    last_seen_location: Optional[str] = None
    last_seen_date: Optional[str] = None
    clothing_description: Optional[str] = None
    photo_path: Optional[str] = None
    created_at: Optional[str] = None
    photo_base64: Optional[str] = None

class CasesResponse(BaseModel):
    cases: List[CaseRecord]

class EmailRequest(BaseModel):
    case_id: str
    name: str
    found_location: str
    uploaded_image_base64: str

@router.get("/cases", response_model=CasesResponse)
async def list_cases():
    rows = case_store.get_all_cases()
    settings = get_settings()
    records = []
    for row in rows:
        photo_base64 = None
        if row.get("photo_path"):
            photo_file = settings.base_dir / row["photo_path"]
            if photo_file.exists():
                photo_base64 = base64.b64encode(photo_file.read_bytes()).decode("utf-8")
        records.append(CaseRecord(
            case_id=row["case_id"],
            name=row.get("name"),
            age=row.get("age"),
            gender=row.get("gender"),
            city=row.get("city"),
            height_cm=row.get("height_cm"),
            weight_kg=row.get("weight_kg"),
            distinguishing_marks=row.get("distinguishing_marks"),
            last_seen_location=row.get("last_seen_location"),
            last_seen_date=row.get("last_seen_date"),
            clothing_description=row.get("clothing_description"),
            photo_path=row.get("photo_path"),
            created_at=row.get("created_at"),
            photo_base64=photo_base64,
        ))
    return CasesResponse(cases=records)

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

    image_pool = []
    if settings.cases_dir.exists():
        for case_dir in settings.cases_dir.iterdir():
            if case_dir.is_dir():
                case_id = case_dir.name
                for ext in ("*.jpg", "*.jpeg", "*.png"):
                    for img_path in case_dir.rglob(ext):
                        image_pool.append({
                            "case_id": case_id,
                            "path": img_path
                        })

    print(f"DEBUG: Found {len(image_pool)} images in case folders for scanning")

    matches_map = {}

    for item in image_pool:
        case_id = item["case_id"]
        img_path = item["path"]

        try:
            db_img_bytes = img_path.read_bytes()
            result = await gemini_service.compare_faces(uploaded_bytes, db_img_bytes)
            score = result.get("similarity_score", 0)

            if score >= 70:
                case_data = case_store.get_case(case_id)
                if not case_data:
                    case_data = {"name": "Unregistered", "age": None, "gender": None, "city": None, "last_seen_location": "Folder: " + case_id}

                db_image_base64 = base64.b64encode(db_img_bytes).decode("utf-8")

                profile = MatchProfile(
                    similarity_score=score,
                    rationale=result.get("rationale", ""),
                    case_id=case_id,
                    name=case_data.get("name"),
                    age=case_data.get("age"),
                    gender=case_data.get("gender"),
                    city=case_data.get("city"),
                    height_cm=case_data.get("height_cm"),
                    weight_kg=case_data.get("weight_kg"),
                    distinguishing_marks=case_data.get("distinguishing_marks"),
                    clothing_description=case_data.get("clothing_description"),
                    last_seen_location=case_data.get("last_seen_location"),
                    last_seen_date=case_data.get("last_seen_date"),
                    image_base64=db_image_base64
                )

                if case_id not in matches_map or score > matches_map[case_id].similarity_score:
                    matches_map[case_id] = profile

        except Exception as e:
            print(f"Error processing image {img_path}: {e}")
            continue

    results = sorted(matches_map.values(), key=lambda x: x.similarity_score, reverse=True)
    return MatchResponse(matches=results[:5])
