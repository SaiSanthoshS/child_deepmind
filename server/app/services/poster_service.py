import asyncio
import base64
from app.models.schemas import (
    PosterGenerateResponse,
    PosterVariant,
    Language,
    ChildDescriptor,
)
from app.services.gemini_service import generate_poster_image, generate_poster_text
from app.services import case_store

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
    case_id: str, descriptor: ChildDescriptor, photo_base64: str = ""
) -> PosterGenerateResponse:

    # Pass 1: generate English poster — this becomes the layout reference
    try:
        reference_bytes = await generate_poster_image(descriptor, "English", photo_base64)
        english_variant = PosterVariant(
            language=Language.english,
            language_name="English",
            image_base64=base64.b64encode(reference_bytes).decode(),
            mime_type="image/jpeg",
        )
    except Exception:
        text = await generate_poster_text(descriptor, "English")
        reference_bytes = None
        english_variant = PosterVariant(
            language=Language.english,
            language_name="English",
            image_base64=base64.b64encode(text.encode()).decode(),
            mime_type="text/plain",
        )

    # Pass 2: remaining 11 languages in parallel, each receives the reference image
    other_languages = {k: v for k, v in LANGUAGE_NAMES.items() if k != Language.english}

    async def _one(lang: Language, name: str) -> PosterVariant:
        for attempt in range(3):
            try:
                img_bytes = await generate_poster_image(
                    descriptor, name, photo_base64, reference_image_bytes=reference_bytes
                )
                return PosterVariant(
                    language=lang,
                    language_name=name,
                    image_base64=base64.b64encode(img_bytes).decode(),
                    mime_type="image/jpeg",
                )
            except Exception:
                if attempt < 2:
                    await asyncio.sleep(4 * (attempt + 1))
                    continue
                text = await generate_poster_text(descriptor, name)
                return PosterVariant(
                    language=lang,
                    language_name=name,
                    image_base64=base64.b64encode(text.encode()).decode(),
                    mime_type="text/plain",
                )

    other_posters = await asyncio.gather(
        *[_one(lang, name) for lang, name in other_languages.items()]
    )

    case_store.save_case(case_id, descriptor, photo_base64)

    return PosterGenerateResponse(
        case_id=case_id,
        posters=[english_variant, *other_posters],
    )
