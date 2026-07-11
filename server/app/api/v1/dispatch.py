from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    DispatchRequest,
    DispatchResponse,
    DispatchStatusResponse,
)
from app.services.dispatch_service import dispatch_alert, get_dispatch_status

router = APIRouter(prefix="/dispatch", tags=["dispatch"])


@router.post("/alert", response_model=DispatchResponse)
async def alert(request: DispatchRequest):
    return await dispatch_alert(request.case_id, request.descriptor, request.channels)


@router.get("/status/{case_id}", response_model=DispatchStatusResponse)
async def status(case_id: str):
    result = await get_dispatch_status(case_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return result
