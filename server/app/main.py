from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.v1 import voice, photo, video, poster, dispatch, age_progression, cases
from app.services import case_store
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="MissingMesh API", version="1.0.0")

settings = get_settings()

os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(settings.output_dir, exist_ok=True)
os.makedirs(settings.cases_dir, exist_ok=True)
case_store.init_db(settings.cases_dir)

app.mount("/outputs", StaticFiles(directory=settings.output_dir), name="outputs")
app.mount("/cases", StaticFiles(directory=settings.cases_dir), name="cases")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
app.include_router(voice.router, prefix=API_PREFIX)
app.include_router(photo.router, prefix=API_PREFIX)
app.include_router(video.router, prefix=API_PREFIX)
app.include_router(poster.router, prefix=API_PREFIX)
app.include_router(dispatch.router, prefix=API_PREFIX)
app.include_router(age_progression.router, prefix=API_PREFIX)
app.include_router(cases.router, prefix=f"{API_PREFIX}/cases")


@app.get("/health")
async def health():
    return {"status": "ok"}
