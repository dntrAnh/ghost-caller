import asyncio
import json
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response, StreamingResponse

from app.api.websocket import (
    apply_call_control,
    get_call_session,
    initialize_call_session,
    serialize_call_status,
    subscribe_call_events,
    unsubscribe_call_events,
    update_status_from_twilio,
    voice_service,
)
from app.core.config import settings
from app.core.logging import logger
from app.schemas.call import CallControlRequest, CallStatusResponse, InitiateCallRequest

router = APIRouter(tags=["call"])


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


def _get_required_session(call_id: str):
    session = get_call_session(call_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"Unknown call_id: {call_id}")
    return session


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _validate_voice_pipeline_ready() -> None:
    missing: list[str] = []
    if not settings.deepgram_api_key:
        missing.append("DEEPGRAM_API_KEY")
    if not settings.elevenlabs_api_key:
        missing.append("ELEVENLABS_API_KEY")

    if missing:
        raise HTTPException(
            status_code=400,
            detail=(
                "Real call mode is not ready. Missing required config: "
                f"{', '.join(missing)}. "
                "Set these values in backend/.env and restart the backend."
            ),
        )


@router.get("/preflight")
async def preflight_call_stack() -> dict:
    twilio = voice_service.preflight_twilio()
    deepgram = await voice_service.preflight_deepgram()
    elevenlabs = await voice_service.preflight_elevenlabs()

    ok = bool(twilio.get("ok") and deepgram.get("ok") and elevenlabs.get("ok"))
    return {
        "ok": ok,
        "twilio": twilio,
        "deepgram": deepgram,
        "elevenlabs": elevenlabs,
    }


@router.post("/initiate", response_model=CallStatusResponse)
async def initiate_call(request: InitiateCallRequest) -> CallStatusResponse:
    _validate_voice_pipeline_ready()

    call_id = str(uuid4())
    session = initialize_call_session(call_id, request)
    webhook_url = f"{settings.app_base_url}/api/call/{call_id}/twiml"
    status_callback_url = f"{settings.app_base_url}/api/call/{call_id}/twilio-status"

    log = logger.bind(call_id=call_id, restaurant_name=request.restaurant_name)
    log.info("call.api.initiate.start", webhook_url=webhook_url)

    call_sid = voice_service.initiate_call(
        request.restaurant_phone,
        webhook_url,
        status_callback_url=status_callback_url,
    )
    session.call_sid = call_sid

    log.info("call.api.initiate.complete", call_sid=call_sid)
    return serialize_call_status(session)


@router.api_route("/{call_id}/twiml", methods=["GET", "POST"])
async def call_twiml(call_id: str) -> Response:
    session = _get_required_session(call_id)
    if session.request_params is None:
        raise HTTPException(status_code=404, detail=f"No request parameters found for call_id: {call_id}")

    websocket_url = f"{_websocket_base_url()}/ws/call/{call_id}"
    twiml = voice_service.create_twiml_stream_response(
        websocket_url,
        custom_parameters=_serialize_custom_parameters(session.request_params),
    )
    logger.info("call.api.twiml.generated", call_id=call_id, websocket_url=websocket_url)
    return Response(content=twiml, media_type="application/xml")


@router.post("/{call_id}/twilio-status")
async def twilio_status_callback(call_id: str, request: Request) -> Response:
    form = await request.form()
    call_sid = str(form.get("CallSid", ""))
    call_status = str(form.get("CallStatus", ""))

    logger.info(
        "call.api.twilio_status.received",
        call_id=call_id,
        call_sid=call_sid,
        call_status=call_status,
    )

    try:
        await update_status_from_twilio(call_id, call_sid, call_status)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return Response(status_code=204)


@router.get("/{call_id}/status", response_model=CallStatusResponse)
async def get_call_status(call_id: str) -> CallStatusResponse:
    session = _get_required_session(call_id)
    return serialize_call_status(session)


@router.post("/{call_id}/control", response_model=CallStatusResponse)
async def control_call(call_id: str, request: CallControlRequest) -> CallStatusResponse:
    _get_required_session(call_id)
    try:
        return await apply_call_control(call_id, request.action, request.message)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{call_id}/stream")
async def stream_call_updates(call_id: str) -> StreamingResponse:
    session = _get_required_session(call_id)
    queue = subscribe_call_events(session)

    async def event_generator():
        yield _sse("status", serialize_call_status(session).model_dump(mode="json"))
        try:
            while True:
                message = await queue.get()
                yield _sse(message.get("event", "message"), message)
        except asyncio.CancelledError:
            raise
        finally:
            unsubscribe_call_events(session, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )