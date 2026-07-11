from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    InterviewStartRequest, InterviewStartResponse,
    InterviewReplyRequest, InterviewReplyResponse,
)
from app.services.interview_service import start_interview, reply_interview

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/start", response_model=InterviewStartResponse)
async def start(request: InterviewStartRequest):
    return await start_interview(request.descriptor, request.detected_language)


@router.post("/reply", response_model=InterviewReplyResponse)
async def reply(request: InterviewReplyRequest):
    try:
        return await reply_interview(request.session_id, request.environment_id, request.user_text)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
