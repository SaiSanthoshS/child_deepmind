import base64
import json
from google import genai
from app.models.schemas import ChildDescriptor, TranscribeResponse

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        # Reads GEMINI_API_KEY from environment automatically
        _client = genai.Client()
    return _client


async def transcribe_voice(audio_bytes: bytes, mime_type: str) -> TranscribeResponse:
    client = get_client()

    b64_audio = base64.b64encode(audio_bytes).decode()

    prompt = (
        "You are a child welfare assistant. The audio contains a parent describing "
        "their missing child in any Indian language. Extract the following as strict JSON "
        "(no markdown, no extra text): "
        '{"name": str|null, "age": int|null, "height_cm": float|null, "weight_kg": float|null, '
        '"distinguishing_marks": str|null, "last_seen_location": str|null, '
        '"last_seen_date": str|null, "clothing_description": str|null, "language_used": str|null}'
    )

    interaction = client.interactions.create(
        model="gemini-3.5-flash",
        input=[
            {"type": "text", "text": prompt},
            {"type": "audio", "data": b64_audio, "mime_type": mime_type},
        ],
    )

    raw = interaction.output_text
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {}

    return TranscribeResponse(
        descriptor=ChildDescriptor(**{k: v for k, v in data.items() if v is not None}),
        raw_transcript=raw,
        detected_language=data.get("language_used") or "unknown",
    )


async def generate_age_progression_video(
    descriptor: ChildDescriptor, image_base64: str, target_ages: list[int]
) -> str:
    # Gemini 3.5 Flash doesn't yet support video generation output.
    # This calls the model to describe what the progression should look like
    # as a placeholder until Veo / video generation is available via the API.
    client = get_client()

    ages_str = " vs ".join(str(a) for a in target_ages)
    prompt = (
        f"Describe in detail how this child would look at ages {ages_str}, "
        "noting changes in facial features, height, and build. "
        f"Child details: {descriptor.model_dump_json()}"
    )

    interaction = client.interactions.create(
        model="gemini-3.5-flash",
        input=[
            {"type": "text", "text": prompt},
            {"type": "image", "data": image_base64, "mime_type": "image/jpeg"},
        ],
    )

    # TODO: Replace return value with actual video URL once Veo API is available
    return interaction.output_text


async def generate_poster_text(descriptor: ChildDescriptor, language: str) -> str:
    client = get_client()

    prompt = (
        f"Generate a MISSING CHILD alert poster text in {language} language only. "
        "Format: MISSING CHILD header, then name, age, physical description, "
        "last seen details, and contact number 112. Keep it concise and urgent. "
        f"Child details: {descriptor.model_dump_json()}"
    )

    interaction = client.interactions.create(
        model="gemini-3.5-flash",
        input=prompt,
    )

    return interaction.output_text
