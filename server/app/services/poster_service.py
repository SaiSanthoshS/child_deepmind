import base64
from app.models.schemas import (
    PosterGenerateResponse,
    PosterVariant,
    Language,
    ChildDescriptor,
)
from app.services.gemini_service import generate_poster_text

LANGUAGE_NAMES = {
    Language.hindi: "Hindi",
    Language.bengali: "Bengali",
    Language.telugu: "Telugu",
    Language.marathi: "Marathi",
    Language.tamil: "Tamil",
    Language.urdu: "Urdu",
    Language.gujarati: "Gujarati",
    Language.kannada: "Kannada",
    Language.odia: "Odia",
    Language.punjabi: "Punjabi",
    Language.malayalam: "Malayalam",
    Language.english: "English",
}


async def generate_posters(
    case_id: str, descriptor: ChildDescriptor
) -> PosterGenerateResponse:
    # TODO: Use NB2 Lite to render image-based poster with translated text overlaid
    # For now generates text posters encoded as base64 UTF-8

    posters = []
    for lang, name in LANGUAGE_NAMES.items():
        text = await generate_poster_text(descriptor, name)
        # Encode text as base64 (placeholder for actual image rendering)
        b64 = base64.b64encode(text.encode()).decode()
        posters.append(PosterVariant(language=lang, language_name=name, image_base64=b64))

    return PosterGenerateResponse(case_id=case_id, posters=posters)
