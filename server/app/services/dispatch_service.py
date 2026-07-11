import asyncio
from app.services.gemini_service import get_client
from app.models.schemas import (
    DispatchResponse,
    DispatchStatusResponse,
    ChannelStatus,
    DispatchChannel,
    ChildDescriptor,
)

# In-memory store for demo — replace with DB/Redis in production
_dispatch_store: dict[str, DispatchStatusResponse] = {}

RAILWAY_NETWORK_COUNT = 8000
NGO_COUNT = 500
POLICE_COUNT = 600


async def dispatch_alert(
    case_id: str,
    descriptor: ChildDescriptor,
    channels: list[DispatchChannel],
) -> DispatchResponse:
    channel_statuses = []
    for channel in channels:
        total = {
            DispatchChannel.railway: RAILWAY_NETWORK_COUNT,
            DispatchChannel.ngo_whatsapp: NGO_COUNT,
            DispatchChannel.police: POLICE_COUNT,
        }[channel]
        channel_statuses.append(
            ChannelStatus(channel=channel, sent=0, total=total, status="pending")
        )

    status = DispatchStatusResponse(
        case_id=case_id,
        overall_status="dispatching",
        channel_statuses=channel_statuses,
    )
    _dispatch_store[case_id] = status

    asyncio.create_task(_run_managed_agent_dispatch(case_id, descriptor, channels))

    return DispatchResponse(case_id=case_id, channel_statuses=channel_statuses)


async def get_dispatch_status(case_id: str) -> DispatchStatusResponse | None:
    return _dispatch_store.get(case_id)


async def _run_managed_agent_dispatch(
    case_id: str,
    descriptor: ChildDescriptor,
    channels: list[DispatchChannel],
):
    client = get_client()
    status = _dispatch_store[case_id]

    task_prompt = (
        f"MISSING CHILD ALERT DISPATCH — Case ID: {case_id}\n"
        f"Child details: {descriptor.model_dump_json()}\n\n"
        f"Channels to dispatch: {[c.value for c in channels]}\n\n"
        "Tasks:\n"
        "1. Draft a concise missing-child alert message in English and Hindi.\n"
        "2. Simulate sending to railway network contacts (report count dispatched).\n"
        "3. Simulate sending to NGO WhatsApp groups (report count dispatched).\n"
        "4. Simulate sending to police station contacts (report count dispatched)."
    )

    try:
        await asyncio.to_thread(
            client.models.generate_content,
            model="gemini-3.5-flash",
            contents=task_prompt,
        )

        for cs in status.channel_statuses:
            cs.sent = cs.total
            cs.status = "done"
        status.overall_status = "done"

    except Exception as e:
        for cs in status.channel_statuses:
            cs.status = "failed"
        status.overall_status = f"failed: {e}"
