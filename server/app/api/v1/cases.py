from fastapi import APIRouter, HTTPException, Query
from app.services import case_store

router = APIRouter(tags=["Cases"])


@router.get("/search")
async def search_cases(q: str = Query(..., min_length=1)):
    results = case_store.search_cases(q)
    return {"query": q, "results": results}


@router.get("/{case_id}")
async def get_case(case_id: str):
    case = case_store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case
