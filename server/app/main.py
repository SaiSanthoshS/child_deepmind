from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.v1 import voice, photo, video, poster, dispatch

app = FastAPI(title="MissingMesh API", version="1.0.0")

settings = get_settings()

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


@app.get("/health")
async def health():
    return {"status": "ok"}
