from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    gemini_api_key: str
    gemini_image_model: str = "gemini-omni-flash-preview"
    imagen_model: str = "gemini-3.1-flash-lite-image"
    cors_origins: str = "http://localhost:5173"
    app_env: str = "development"

    # ── File storage ──
    base_dir: Path = Path(__file__).resolve().parent.parent.parent
    upload_dir: Path = Path(__file__).resolve().parent.parent.parent / "uploads"
    output_dir: Path = Path(__file__).resolve().parent.parent.parent / "outputs"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
