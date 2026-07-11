import asyncio
import base64
import json
from google import genai
from google.genai import types
from app.models.schemas import ChildDescriptor, TranscribeResponse
from app.core.config import get_settings

MODEL = "gemini-flash-latest"

POSTER_LAYOUT_SPEC = """
Canvas: 600 × 800 px, white background, portrait (3:4 ratio).
Zone A — Header band (y 0–90 px, full width): solid red #CC0000.
  Two lines of white bold sans-serif text, centered.
  Line 1 (28 px bold): "{header_line1}"
  Line 2 (18 px): "{header_line2}"
Zone B — Photo area (y 90–330 px, full width): white background.
  Child photo centered, scaled to fit 220 × 220 px, 2 px solid #888888 border.
  If no photo provided, render a grey silhouette placeholder of the same size.
Zone C — Details panel (y 330–650 px): white background, 20 px side padding.
  13 px regular sans-serif; labels bold. Each field on its own line:
  {detail_lines}
Zone D — Contact band (y 650–800 px, full width): solid red #CC0000.
  Line 1 (22 px bold white centered): "{contact_line1}"
  Line 2 (13 px white centered): "{contact_line2}"
No gradients, shadows, decorations, or elements outside these four zones.
"""

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=get_settings().gemini_api_key)
    return _client


async def transcribe_voice(audio_bytes: bytes, mime_type: str) -> TranscribeResponse:
    client = get_client()

    prompt = (
        "You are a child welfare assistant. The audio contains a parent describing "
        "their missing child in any Indian language. Extract the following as strict JSON "
        "(no markdown, no extra text): "
        '{"name": "str or null", "age": "int or null", "height_cm": "float or null", '
        '"weight_kg": "float or null", "distinguishing_marks": "str or null", '
        '"last_seen_location": "str or null", "last_seen_date": "str or null", '
        '"clothing_description": "str or null", "language_used": "str or null"}'
    )

    response = await asyncio.to_thread(
        client.models.generate_content,
        model=MODEL,
        contents=[
            prompt,
            types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
        ],
    )

    raw = response.text or ""
    clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        data = json.loads(clean)
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
    client = get_client()

    ages_str = ", ".join(str(a) for a in target_ages)
    prompt = (
        f"You are helping find a missing child. Describe in detail how this child "
        f"would likely look at ages {ages_str}, noting changes in facial features, "
        "height, and build. Be specific to help identification. "
        f"Child details: {descriptor.model_dump_json()}"
    )

    contents: list = [prompt]
    if image_base64:
        image_bytes = base64.b64decode(image_base64)
        contents.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))

    response = await asyncio.to_thread(
        client.models.generate_content,
        model=MODEL,
        contents=contents,
    )

    return response.text or ""


async def generate_poster_image(
    descriptor: ChildDescriptor,
    language: str,
    photo_base64: str = "",
    reference_image_bytes: bytes | None = None,
) -> bytes:
    client = get_client()

    detail_lines = "\n  ".join([
        f"Name: {descriptor.name or 'Unknown'}",
        f"Age: {descriptor.age or '?'} years",
        f"Height: {descriptor.height_cm or '?'} cm  |  Weight: {descriptor.weight_kg or '?'} kg",
        f"Last Seen: {descriptor.last_seen_location or '?'} on {descriptor.last_seen_date or '?'}",
        f"Clothing: {descriptor.clothing_description or '?'}",
        f"Marks: {descriptor.distinguishing_marks or 'None'}",
    ])

    if reference_image_bytes is None:
        # Pass 1 — English reference poster with strict layout spec
        layout = POSTER_LAYOUT_SPEC.format(
            header_line1="MISSING CHILD",
            header_line2="REPORT IMMEDIATELY — CALL NOW",
            detail_lines=detail_lines,
            contact_line1="HELPLINE: 1098  |  POLICE: 100",
            contact_line2="If you have information, contact the nearest police station.",
        )
        prompt = (
            "Create a MISSING CHILD alert poster image using this EXACT layout template — "
            "do not deviate from any measurement, color, or zone boundary:\n"
            + layout
            + f"\nChild details: {descriptor.model_dump_json()}"
        )
        contents: list = [prompt]
    else:
        # Pass 2 — clone layout from English reference, translate text only
        prompt = (
            f"You are given a reference MISSING CHILD poster as the first image. "
            f"Reproduce its EXACT layout pixel-for-pixel: identical four zones (red header band at top, "
            f"photo in center-top, white details panel, red contact band at bottom), "
            f"same proportions, same red color #CC0000, same font sizes and padding. "
            f"The ONLY change: translate ALL visible text into {language}. "
            f"Translate 'MISSING CHILD', 'REPORT IMMEDIATELY', all field labels and values, "
            f"and 'HELPLINE: 1098 | POLICE: 100' — keep the numbers 1098 and 100 as-is. "
            f"Do not alter layout, zone positions, colors, or photo placement in any way. "
            f"Child details: {descriptor.model_dump_json()}"
        )
        contents = [
            types.Part.from_bytes(data=reference_image_bytes, mime_type="image/jpeg"),
            prompt,
        ]

    if photo_base64:
        contents.append(
            types.Part.from_bytes(data=base64.b64decode(photo_base64), mime_type="image/jpeg")
        )

    for attempt in range(4):
        response = await asyncio.to_thread(
            client.models.generate_content,
            model="gemini-3.1-flash-lite-image",
            contents=contents,
            config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
        )

        for part in response.candidates[0].content.parts:
            if part.inline_data:
                return part.inline_data.data

        # No image returned — wait and retry (rate limit or transient failure)
        if attempt < 3:
            await asyncio.sleep(3 * (attempt + 1))

    raise ValueError("No image returned by model after retries")


async def age_progress(
    image_bytes: bytes,
    current_age: int,
    target_age: int,
    gender: str,
    description: str,
) -> bytes:
    client = get_client()

    age_delta = target_age - current_age
    prompt = (
        f"TASK: Age-progression portrait. You MUST output an image.\n\n"
        f"INPUT: A photo of a {gender} child currently aged {current_age}.\n"
        f"OUTPUT: A photorealistic portrait of the same individual at age {target_age} "
        f"({age_delta} years older).\n\n"
        f"STRICT RULES — follow every rule:\n"
        f"1. IDENTITY PRESERVATION: Keep the exact same face shape, bone structure, eye color, "
        f"nose shape, ear shape, skin tone, and ethnicity. The person must be unmistakably "
        f"recognisable as the same individual.\n"
        f"2. AGE THE FACE NATURALLY: Apply realistic age-related changes for a {target_age}-year-old "
        f"— adjust jawline definition, facial proportions, hairline, slight changes in skin texture. "
        f"For ages 10-15 apply early adolescent changes; for 16-20 apply late adolescent maturity.\n"
        f"3. BODY & POSTURE: Update body proportions to match typical {target_age}-year-old "
        f"build for a {gender}.\n"
        f"4. DO NOT change: ethnicity, eye color, distinguishing marks, or core facial geometry.\n"
        f"5. PHOTO QUALITY: Output a sharp, well-lit, front-facing portrait photo. "
        f"Neutral background. High detail on the face.\n"
        f"6. Additional descriptor context: {description or 'none provided'}.\n"
    )

    response = await asyncio.to_thread(
        client.models.generate_content,
        model="gemini-3.1-flash-image",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            prompt,
        ],
        config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data:
            return part.inline_data.data

    raise ValueError("No image returned by model")


async def enhance_image(image_bytes: bytes) -> bytes:
    client = get_client()

    prompt = (
        "Enhance this photo: improve sharpness, correct lighting, reduce noise, "
        "and boost clarity while preserving the subject's natural appearance. "
        "Output a high-quality photorealistic image."
    )

    response = await asyncio.to_thread(
        client.models.generate_content,
        model="gemini-3.1-flash-lite-image",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            prompt,
        ],
        config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data:
            return part.inline_data.data

    raise ValueError("No image returned by model")


async def edit_image(image_bytes: bytes, instruction: str) -> bytes:
    client = get_client()

    prompt = (
        f"Edit this portrait photo according to the following instruction: {instruction}\n\n"
        "STRICT RULES:\n"
        "1. Apply ONLY the change described in the instruction. Change nothing else.\n"
        "2. PRESERVE: the person's face, identity, expression, pose, background, and lighting exactly.\n"
        "3. The edit must look photorealistic and seamlessly integrated — no visible artifacts.\n"
        "4. Output the full portrait image with the edit applied."
    )

    response = await asyncio.to_thread(
        client.models.generate_content,
        model="gemini-3.1-flash-lite-image",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            prompt,
        ],
        config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data:
            return part.inline_data.data

    raise ValueError("No image returned by model")


async def extract_description(text: str, source_language: str = "auto") -> dict:
    client = get_client()

    lang_hint = f"The text may be in {source_language}. " if source_language != "auto" else ""
    prompt = (
        f"{lang_hint}Extract the following child descriptor fields from the text as strict JSON "
        "(no markdown, no extra text): "
        '{"name": "str or null", "age": "int or null", "gender": "str or null", '
        '"height_cm": "float or null", "skin_tone": "str or null", '
        '"clothing_last_seen": "str or null", "distinguishing_marks": ["list of str"] or null}\n\n'
        f"Text: {text}"
    )

    response = await asyncio.to_thread(
        client.models.generate_content,
        model=MODEL,
        contents=[prompt],
    )

    raw = response.text or ""
    clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        return {}


async def generate_poster_text(descriptor: ChildDescriptor, language: str) -> str:
    client = get_client()

    prompt = (
        f"Generate a MISSING CHILD alert poster text in {language} language only. "
        "Format it as: header (MISSING CHILD / LAPATA BACHCHA / equivalent), "
        "name, age, physical description, last seen location and date, "
        "contact helpline 1098 and police 100. Keep it urgent and concise. "
        f"Child details: {descriptor.model_dump_json()}"
    )

    interaction = client.interactions.create(
        model="gemini-3.5-flash",
        input=prompt,
    )

    return interaction.output_text


async def compare_faces(uploaded_bytes: bytes, db_image_bytes: bytes) -> dict:
    client = get_client()

    prompt = (
        "TASK: Probabilistic Biometric Facial Matching.\n"
        "Compare Photo 1 (Found Child) with Photo 2 (Missing Child Record).\n"
        "Output a strict JSON object: {\"similarity_score\": <int 0-100>, \"rationale\": \"<brief technical explanation>\"}\n"
        "CRITICAL EDGE CASES:\n"
        "- IGNORE clothing color/style, hair length/style, lighting, and background.\n"
        "- ACCOUNT FOR AGE PROGRESSION: The same child may look slightly older or younger. Focus on invariant facial geometry (eye spacing, ear structure, nose bridge, lip shape, chin).\n"
        "SCORING RULES (STRICT):\n"
        "0-40: Completely different people. Mismatched facial geometry. (Different bone structure, different identity).\n"
        "41-69: Low probability. Superficial similarities only (e.g. same race/gender) but core geometry does not align.\n"
        "70-85: High probability. Strong match in permanent facial geometry. Likely the same person with age progression or significant angle/lighting changes.\n"
        "86-100: Definite match. Unmistakably the exact same person, regardless of different clothing, hair, age, or background.\n"
        "If it is clearly the same child wearing a different shirt or at a slightly different age, SCORE ABOVE 85."
    )

    response = await asyncio.to_thread(
        client.models.generate_content,
        model=MODEL,
        contents=[
            prompt,
            types.Part.from_bytes(data=uploaded_bytes, mime_type="image/jpeg"),
            types.Part.from_bytes(data=db_image_bytes, mime_type="image/jpeg"),
        ],
    )

    raw = response.text or ""
    clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        return {"similarity_score": 0, "rationale": f"AI analysis failed to generate valid data. Raw: {raw[:50]}"}
