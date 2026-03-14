from uuid import uuid4

from fastapi import APIRouter
from fastapi.responses import Response

from app.core.config import settings
from app.core.exceptions import BookingError
from app.core.logging import logger
from app.schemas.call import CallStatusResponse, InitiateCallRequest
from app.services.voice import VoiceService

router = APIRouter(prefix="/call", tags=["call"])

voice_service = VoiceService()
_pending_call_params: dict[str, InitiateCallRequest] = {}


def _websocket_base_url() -> str:
    return settings.app_base_url.replace("https://", "wss://").replace("http://", "ws://")


def _serialize_custom_parameters(request: InitiateCallRequest) -> dict[str, str]:
    return {
        "restaurant_name": request.restaurant_name,
        "restaurant_phone": request.restaurant_phone,
        "party_size": str(request.party_size),
        "preferred_date": request.preferred_date,
        "preferred_time": request.preferred_time,
        "buffer_minutes": str(request.buffer_minutes),
        "dietary_restrictions": ", ".join(request.dietary_restrictions),
        "user_name": request.user_name,
    }


@router.post("/initiate", response_model=CallStatusResponse)
async def initiate_call(request: InitiateCallRequest) -> CallStatusResponse:
    call_id = str(uuid4())
    webhook_url = f"{settings.app_base_url}/api/v1/call/twiml/{call_id}"

    _pending_call_params[call_id] = request
    log = logger.bind(call_id=call_id, restaurant_name=request.restaurant_name)
    log.info("call.initiate.start", webhook_url=webhook_url)

    try:
        call_sid = voice_service.initiate_call(request.restaurant_phone, webhook_url)
    except Exception:
        _pending_call_params.pop(call_id, None)
        raise

    log.info("call.initiate.complete", call_sid=call_sid)
    return CallStatusResponse(
        call_id=call_id,
        status="initiated",
        transcript=[],
        sentiment_log=[],
    )


@router.api_route("/twiml/{call_id}", methods=["GET", "POST"])
async def call_twiml(call_id: str) -> Response:
    request = _pending_call_params.get(call_id)
    if request is None:
        raise BookingError(f"No pending call parameters found for call_id={call_id}.")

    websocket_url = f"{_websocket_base_url()}/ws/call/{call_id}"
    twiml = voice_service.create_twiml_stream_response(
        websocket_url,
        custom_parameters=_serialize_custom_parameters(request),
    )

    logger.info("call.twiml.generated", call_id=call_id, websocket_url=websocket_url)
    return Response(content=twiml, media_type="application/xml")