import asyncio
import uuid
from dataclasses import dataclass, field as dc_field
from google.genai import types
from app.services.gemini_service import get_client
from app.models.schemas import ChildDescriptor

MODEL = "gemini-3.5-flash"

CRITICAL_FIELDS = ["name", "age", "gender", "height_cm", "weight_kg",
                   "last_seen_location", "last_seen_date",
                   "clothing_description", "distinguishing_marks"]

FIELD_LABELS = {
    "name": "the child's name",
    "age": "the child's age (integer)",
    "gender": "the child's gender — save as exactly 'male' or 'female'",
    "height_cm": "the child's height in centimetres (number only)",
    "weight_kg": "the child's weight in kilograms (number only)",
    "last_seen_location": "where the child was last seen",
    "last_seen_date": "when the child was last seen (date)",
    "clothing_description": "what the child was wearing",
    "distinguishing_marks": "any distinguishing marks or features",
}

# ── Tool definitions ─────────────────────────────────────────────────────────

_TOOLS = types.Tool(function_declarations=[
    types.FunctionDeclaration(
        name="update_field",
        description="Save a piece of information the parent just provided about their missing child.",
        parameters=types.Schema(
            type="OBJECT",
            properties={
                "field": types.Schema(
                    type="STRING",
                    description="The field key to update.",
                    enum=CRITICAL_FIELDS,
                ),
                "value": types.Schema(
                    type="STRING",
                    description=(
                        "The value extracted and TRANSLATED TO ENGLISH. "
                        "age: integer string e.g. '8'. "
                        "gender: exactly 'male' or 'female'. "
                        "height_cm: number in cm e.g. '122.0' (convert feet/inches if needed). "
                        "weight_kg: number in kg e.g. '25.0'. "
                        "last_seen_date: YYYY-MM-DD format. "
                        "All other fields: English text."
                    ),
                ),
            },
            required=["field", "value"],
        ),
    ),
    types.FunctionDeclaration(
        name="mark_interview_done",
        description="Signal that all critical information has been collected and the interview is complete.",
        parameters=types.Schema(type="OBJECT", properties={}),
    ),
    types.FunctionDeclaration(
        name="ask_clarification",
        description="Signal that the parent's answer was unclear or missing. Ask a follow-up to clarify.",
        parameters=types.Schema(
            type="OBJECT",
            properties={
                "reason": types.Schema(
                    type="STRING",
                    description="Why clarification is needed.",
                ),
            },
            required=["reason"],
        ),
    ),
])


# ── Session store ────────────────────────────────────────────────────────────

@dataclass
class InterviewSession:
    descriptor: ChildDescriptor
    detected_language: str
    history: list
    missing_fields: list[str] = dc_field(default_factory=list)
    done: bool = False


_sessions: dict[str, InterviewSession] = {}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_missing(descriptor: ChildDescriptor) -> list[str]:
    return [f for f in CRITICAL_FIELDS if not getattr(descriptor, f, None)]


def _merge_field(descriptor: ChildDescriptor, field_key: str, value: str) -> ChildDescriptor:
    if field_key not in CRITICAL_FIELDS:
        return descriptor
    data = descriptor.model_dump()
    if field_key == "age":
        try:
            data[field_key] = int(float(value))
        except (ValueError, TypeError):
            pass
    elif field_key in ("height_cm", "weight_kg"):
        try:
            data[field_key] = float(value)
        except (ValueError, TypeError):
            pass
    elif field_key == "gender":
        v = value.strip().lower()
        data[field_key] = "female" if v in ("female", "girl", "f") else "male"
    else:
        data[field_key] = value.strip() if value else None
    return ChildDescriptor(**data)


def _system_prompt(language: str, missing: list[str]) -> str:
    fields_list = ", ".join(FIELD_LABELS[f] for f in missing)
    return (
        f"You are a compassionate intake assistant helping a parent report a missing child in an emergency.\n"
        f"Speak to the parent ONLY in {language}. If language is unknown, use English.\n"
        f"You need to collect: {fields_list}.\n"
        f"Rules:\n"
        f"- Ask about ONE field at a time. Keep questions short and warm.\n"
        f"- When the parent answers, call update_field() to save the value.\n"
        f"  IMPORTANT: Always translate the extracted value to English before saving.\n"
        f"  For dates: convert to YYYY-MM-DD format (e.g. 'yesterday' → today minus 1 day, 'Monday' → the most recent Monday).\n"
        f"  For height/weight: extract the number only (e.g. '4 feet' → convert to cm, '20 kg' → 20).\n"
        f"  For gender: save as 'male' or 'female' only.\n"
        f"  For names, locations, clothing, marks: translate to English.\n"
        f"- If the answer is unclear or incomplete, call ask_clarification() and re-ask.\n"
        f"- When all fields are collected, call mark_interview_done().\n"
        f"- After calling any tool, always follow up with your next spoken question or a closing message in {language}.\n"
        f"Start by asking your first question now."
    )


def _run_agentic_turn(client, history: list, system: str, descriptor: ChildDescriptor):
    """
    Run one agentic turn. The model may call multiple tools before returning
    a spoken question. Returns (updated_descriptor, next_question, done).
    """
    done = False
    next_question = None

    while True:
        response = client.models.generate_content(
            model=MODEL,
            contents=history,
            config=types.GenerateContentConfig(
                system_instruction=system,
                tools=[_TOOLS],
            ),
        )

        candidate_content = response.candidates[0].content
        history.append(candidate_content)

        fn_response_parts = []

        for part in candidate_content.parts:
            if part.function_call:
                fn = part.function_call
                if fn.name == "update_field":
                    field = fn.args.get("field", "")
                    value = fn.args.get("value", "")
                    descriptor = _merge_field(descriptor, field, str(value))
                    fn_response_parts.append(types.Part(
                        function_response=types.FunctionResponse(
                            name="update_field",
                            response={"success": True, "saved": f"{field}={value}"},
                        )
                    ))
                elif fn.name == "mark_interview_done":
                    done = True
                    fn_response_parts.append(types.Part(
                        function_response=types.FunctionResponse(
                            name="mark_interview_done",
                            response={"success": True},
                        )
                    ))
                elif fn.name == "ask_clarification":
                    fn_response_parts.append(types.Part(
                        function_response=types.FunctionResponse(
                            name="ask_clarification",
                            response={"success": True},
                        )
                    ))
            elif part.text and part.text.strip():
                next_question = part.text.strip()

        if fn_response_parts:
            history.append(types.Content(role="user", parts=fn_response_parts))

        # Stop looping once we have a question to speak, or the model is done
        # and produced no more function calls this round
        if next_question or (done and not fn_response_parts) or not fn_response_parts:
            break

    return descriptor, next_question, done


# ── Public API ───────────────────────────────────────────────────────────────

async def start_interview(descriptor: ChildDescriptor, detected_language: str) -> dict:
    missing = _get_missing(descriptor)
    if not missing:
        return {
            "session_id": str(uuid.uuid4()),
            "environment_id": "",
            "question": "",
            "missing_fields": [],
            "done": True,
        }

    client = get_client()
    system = _system_prompt(detected_language, missing)

    opening = (
        f"A parent is reporting a missing child. "
        f"Known details: {descriptor.model_dump_json()}. "
        f"Please begin the interview."
    )
    history = [types.Content(role="user", parts=[types.Part(text=opening)])]

    descriptor, question, done = await asyncio.to_thread(
        _run_agentic_turn, client, history, system, descriptor
    )

    session_id = str(uuid.uuid4())
    _sessions[session_id] = InterviewSession(
        descriptor=descriptor,
        detected_language=detected_language,
        history=history,
        missing_fields=_get_missing(descriptor),
        done=done,
    )

    return {
        "session_id": session_id,
        "environment_id": session_id,
        "question": question or "Can you tell me your child's name?",
        "missing_fields": _get_missing(descriptor),
        "done": done,
    }


async def reply_interview(session_id: str, environment_id: str, user_text: str) -> dict:
    session = _sessions.get(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    client = get_client()
    system = _system_prompt(session.detected_language, session.missing_fields)

    session.history.append(types.Content(role="user", parts=[types.Part(text=user_text)]))

    descriptor, question, done = await asyncio.to_thread(
        _run_agentic_turn, client, session.history, system, session.descriptor
    )

    missing = _get_missing(descriptor)
    if not missing:
        done = True

    session.descriptor = descriptor
    session.missing_fields = missing
    session.done = done

    return {
        "session_id": session_id,
        "environment_id": session_id,
        "question": question or "",
        "updated_descriptor": descriptor,
        "missing_fields": missing,
        "done": done,
    }
