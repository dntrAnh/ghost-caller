import asyncio
import base64
from collections.abc import AsyncGenerator
from contextlib import suppress
from datetime import UTC, datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.agents.reservation_agent import ReservationAgent, ReservationState
from app.core.logging import logger
from app.models.call import CallRecord, CallStatus
from app.schemas.call import CallStatusResponse, InitiateCallRequest, SentimentItem, TranscriptItem
from app.services.voice import VoiceService

router = APIRouter(tags=["websocket"])

voice_service = VoiceService()


class _CallSession:
    def __init__(self, call_id: str) -> None:
        self.call_id = call_id
        self.audio_queue: asyncio.Queue[bytes | None] = asyncio.Queue()
        self.record = CallRecord(
            id=call_id,
            booking_id=call_id,
            restaurant_name="Unknown Restaurant",
            restaurant_phone="",
        )
        self.agent: ReservationAgent | None = None
        self.request_params: InitiateCallRequest | None = None
        self.status_connections: set[WebSocket] = set()
        self.sse_subscribers: set[asyncio.Queue[dict]] = set()
        self.call_sid = call_id
        self.stream_sid = ""
        self.started_at = datetime.now(UTC)
        self.worker_task: asyncio.Task | None = None
        self.low_quality_transcript_streak = 0
        self.intervention_notified = False

    async def audio_chunks(self) -> AsyncGenerator[bytes, None]:
        while True:
            chunk = await self.audio_queue.get()
            if chunk is None:
                break
            yield chunk


_SESSIONS: dict[str, _CallSession] = {}


def get_call_session(call_id: str) -> _CallSession | None:
    return _SESSIONS.get(call_id)


def _get_session(call_id: str) -> _CallSession:
    session = _SESSIONS.get(call_id)
    if session is None:
        session = _CallSession(call_id)
        _SESSIONS[call_id] = session
    return session


def initialize_call_session(call_id: str, request: InitiateCallRequest) -> _CallSession:
    session = _get_session(call_id)
    session.request_params = request
    session.agent = ReservationAgent(
        restaurant_name=request.restaurant_name,
        party_size=request.party_size,
        date=request.preferred_date,
        time=request.preferred_time,
        buffer_minutes=request.buffer_minutes,
        dietary_restrictions=request.dietary_restrictions,
        user_name=request.user_name,
    )
    session.record = CallRecord(
        id=call_id,
        booking_id=call_id,
        restaurant_name=request.restaurant_name,
        restaurant_phone=request.restaurant_phone,
        status=CallStatus.INITIATED,
    )
    session.audio_queue = asyncio.Queue()
    session.started_at = datetime.now(UTC)
    session.call_sid = call_id
    session.stream_sid = ""
    session.worker_task = None
    session.low_quality_transcript_streak = 0
    session.intervention_notified = False
    return session


async def apply_call_control(call_id: str, action: str, message: str | None = None) -> CallStatusResponse:
    session = get_call_session(call_id)
    if session is None:
        raise ValueError(f"Unknown call_id: {call_id}")

    normalized_action = action.strip().lower()
    if normalized_action == "stop":
        if session.call_sid:
            voice_service.terminate_call(session.call_sid)
        session.record.status = CallStatus.CANCELED
        await _broadcast_status(
            session,
            "state_change",
            {
                "state": "manual_stop",
                "status": session.record.status.value,
            },
        )
        await _broadcast_status(
            session,
            "warning",
            {"message": "Call was stopped manually due to low transcription quality."},
        )
        return serialize_call_status(session)

    if normalized_action == "speak":
        text = (message or "").strip()
        if not text:
            raise ValueError("Action 'speak' requires a non-empty message.")

        if session.agent is not None:
            session.agent._record_transcript("agent", text)
            session.record.transcript = list(session.agent.transcript)

        await _broadcast_status(
            session,
            "transcript",
            {"speaker": "agent", "text": text},
        )

        await _broadcast_status(
            session,
            "manual_intervention",
            {"message": text},
        )
        await _send_agent_reply(session, text)
        return serialize_call_status(session)

    raise ValueError(f"Unsupported action: {action}")


def serialize_call_status(session: _CallSession) -> CallStatusResponse:
    return CallStatusResponse(
        call_id=session.call_id,
        status=session.record.status.value,
        transcript=[
            TranscriptItem(
                speaker=item.speaker,
                text=item.text,
                timestamp=item.timestamp.isoformat(),
            )
            for item in session.record.transcript
        ],
        sentiment_log=[
            SentimentItem(
                text=item.text,
                sentiment=item.sentiment,
                confidence=item.confidence,
            )
            for item in session.record.sentiment_log
        ],
        confirmation_code=session.record.confirmation_code,
        confirmed_time=session.record.confirmed_time,
        confirmed_date=session.record.confirmed_date,
    )


def subscribe_call_events(session: _CallSession) -> asyncio.Queue[dict]:
    queue: asyncio.Queue[dict] = asyncio.Queue()
    session.sse_subscribers.add(queue)
    return queue


def unsubscribe_call_events(session: _CallSession, queue: asyncio.Queue[dict]) -> None:
    session.sse_subscribers.discard(queue)


def _map_reservation_state(state: ReservationState) -> CallStatus:
    if state == ReservationState.NEGOTIATING:
        return CallStatus.NEGOTIATING
    if state == ReservationState.CONFIRMING:
        return CallStatus.CONNECTED
    if state == ReservationState.DONE:
        return CallStatus.CONFIRMED
    if state == ReservationState.FAILED:
        return CallStatus.FAILED
    if state in {ReservationState.REQUESTING, ReservationState.AWAITING_RESPONSE}:
        return CallStatus.CONNECTED
    return CallStatus.INITIATED


async def _broadcast_status(session: _CallSession, event: str, payload: dict) -> None:
    message = {
        "event": event,
        "call_id": session.call_id,
        **payload,
    }

    for queue in list(session.sse_subscribers):
        queue.put_nowait(message)

    stale_connections: list[WebSocket] = []
    for connection in session.status_connections:
        try:
            await connection.send_json(message)
        except Exception:
            stale_connections.append(connection)

    for connection in stale_connections:
        session.status_connections.discard(connection)


def _create_agent(start_payload: dict, session: _CallSession) -> ReservationAgent:
    if session.agent is not None:
        return session.agent

    start_data = start_payload.get("start", {})
    custom_params = start_data.get("customParameters", {})

    restaurant_name = custom_params.get("restaurant_name") or start_data.get("accountSid") or "Restaurant"
    restaurant_phone = custom_params.get("restaurant_phone") or session.record.restaurant_phone
    preferred_date = custom_params.get("preferred_date", "today")
    preferred_time = custom_params.get("preferred_time", "7:00 PM")
    user_name = custom_params.get("user_name", "the guest")
    party_size_raw = custom_params.get("party_size", 2)
    buffer_raw = custom_params.get("buffer_minutes", 30)
    dietary_raw = custom_params.get("dietary_restrictions", "")

    try:
        party_size = int(party_size_raw)
    except (TypeError, ValueError):
        party_size = 2

    try:
        buffer_minutes = int(buffer_raw)
    except (TypeError, ValueError):
        buffer_minutes = 30

    if isinstance(dietary_raw, str):
        dietary_restrictions = [item.strip() for item in dietary_raw.split(",") if item.strip()]
    elif isinstance(dietary_raw, list):
        dietary_restrictions = [str(item).strip() for item in dietary_raw if str(item).strip()]
    else:
        dietary_restrictions = []

    session.record.restaurant_name = restaurant_name
    session.record.restaurant_phone = restaurant_phone

    return ReservationAgent(
        restaurant_name=restaurant_name,
        party_size=party_size,
        date=preferred_date,
        time=preferred_time,
        buffer_minutes=buffer_minutes,
        dietary_restrictions=dietary_restrictions,
        user_name=user_name,
    )


async def _send_agent_reply(session: _CallSession, text: str) -> None:
    await _broadcast_status(session, "agent_reply", {"text": text})
    try:
        audio_bytes = await voice_service.synthesize_speech(text)
        await voice_service.stream_audio_to_call(session.call_sid, audio_bytes)
    except Exception as exc:
        logger.warning(
            "call.websocket.agent_reply.audio_fallback",
            call_id=session.call_id,
            call_sid=session.call_sid,
            error=str(exc),
        )
        await _broadcast_status(
            session,
            "warning",
            {"message": f"Audio reply unavailable, continuing in text mode: {exc}"},
        )


def _map_twilio_status(status: str) -> CallStatus | None:
    normalized = status.strip().lower()
    if normalized in {"queued", "initiated"}:
        return CallStatus.INITIATED
    if normalized == "ringing":
        return CallStatus.RINGING
    if normalized in {"in-progress", "answered"}:
        return CallStatus.CONNECTED
    if normalized == "busy":
        return CallStatus.BUSY
    if normalized == "no-answer":
        return CallStatus.NO_ANSWER
    if normalized == "canceled":
        return CallStatus.CANCELED
    if normalized == "failed":
        return CallStatus.FAILED
    if normalized == "completed":
        return CallStatus.COMPLETED
    return None


async def update_status_from_twilio(call_id: str, call_sid: str, twilio_status: str) -> CallStatusResponse:
    session = get_call_session(call_id)
    if session is None:
        raise ValueError(f"Unknown call_id: {call_id}")

    if call_sid and call_sid != session.call_sid:
        logger.warning(
            "call.twilio_status.sid_mismatch",
            call_id=call_id,
            expected_call_sid=session.call_sid,
            received_call_sid=call_sid,
        )

    mapped = _map_twilio_status(twilio_status)
    if mapped is None:
        logger.info("call.twilio_status.ignored", call_id=call_id, twilio_status=twilio_status)
        return serialize_call_status(session)

    # Preserve confirmed state if the reservation was already completed successfully.
    if session.record.status == CallStatus.CONFIRMED and mapped in {CallStatus.COMPLETED, CallStatus.FAILED}:
        return serialize_call_status(session)

    session.record.status = mapped
    await _broadcast_status(
        session,
        "state_change",
        {
            "status": session.record.status.value,
            "state": "twilio_status",
            "twilio_status": twilio_status,
        },
    )

    if mapped in {CallStatus.BUSY, CallStatus.NO_ANSWER, CallStatus.CANCELED, CallStatus.FAILED}:
        await _broadcast_status(
            session,
            "error",
            {"message": f"Call ended with provider status: {mapped.value}"},
        )

    return serialize_call_status(session)


async def process_call_transcript(
    session: _CallSession,
    transcript: str,
    *,
    send_audio: bool,
) -> None:
    if not session.agent:
        return

    await _broadcast_status(session, "transcript", {"speaker": "restaurant", "text": transcript})
    previous_status = session.record.status
    action = await session.agent.process_response(transcript)

    session.record.transcript = list(session.agent.transcript)
    session.record.sentiment_log = list(session.agent.sentiment_log)
    session.record.status = _map_reservation_state(action.next_state)

    if session.record.sentiment_log:
        latest_sentiment = session.record.sentiment_log[-1]
        await _broadcast_status(
            session,
            "sentiment",
            {
                "sentiment": latest_sentiment.sentiment,
                "confidence": latest_sentiment.confidence,
                "text": latest_sentiment.text,
            },
        )

    if session.record.status != previous_status:
        await _broadcast_status(
            session,
            "state_change",
            {
                "state": action.next_state.value,
                "status": session.record.status.value,
            },
        )

    if action.next_state == ReservationState.DONE:
        session.record.confirmed_date = session.agent.date
        session.record.confirmed_time = session.agent.primary_time
        session.record.confirmation_code = session.record.confirmation_code or f"CONF-{session.call_id[:8]}"
        await _broadcast_status(
            session,
            "confirmation",
            {
                "confirmation_code": session.record.confirmation_code,
                "confirmed_date": session.record.confirmed_date,
                "confirmed_time": session.record.confirmed_time,
            },
        )

    await _broadcast_status(
        session,
        "agent_action",
        {
            "state": action.next_state.value,
            "sentiment": action.sentiment.value,
            "confidence": action.confidence,
        },
    )

    await _broadcast_status(session, "transcript", {"speaker": "agent", "text": action.response_text})

    if send_audio:
        await _send_agent_reply(session, action.response_text)
    else:
        await _broadcast_status(session, "agent_reply", {"text": action.response_text})

    if action.next_state in {ReservationState.DONE, ReservationState.FAILED}:
        if action.response_text:
            # Estimate playback time: ~150 words/min for TTS, plus a small buffer
            word_count = len(action.response_text.split())
            playback_seconds = max(3.0, (word_count / 150) * 60 + 1.5)
            await asyncio.sleep(playback_seconds)
        with suppress(Exception):
            voice_service.terminate_call(session.call_sid)


async def _run_agent_loop(session: _CallSession) -> None:
    log = logger.bind(call_id=session.call_id, call_sid=session.call_sid)
    try:
        async for transcript in voice_service.transcribe_stream(session.audio_chunks()):
            if not session.agent:
                continue

            # If transcripts become too short repeatedly, ask for manual intervention.
            if len(transcript.split()) <= 2:
                session.low_quality_transcript_streak += 1
            else:
                session.low_quality_transcript_streak = 0

            if session.low_quality_transcript_streak >= 3 and not session.intervention_notified:
                session.intervention_notified = True
                await _broadcast_status(
                    session,
                    "intervention_required",
                    {
                        "reason": "low_transcription_quality",
                        "message": "Transcription quality looks poor. You can stop the call or send a manual message.",
                    },
                )

            await process_call_transcript(session, transcript, send_audio=True)

            if session.record.status in {CallStatus.CONFIRMED, CallStatus.FAILED}:
                break
    except Exception as exc:
        error_text = str(exc)
        if "Deepgram API key is not configured" in error_text:
            log.warning("call.websocket.agent_loop.transcription_unavailable", error=error_text)
            await _broadcast_status(
                session,
                "warning",
                {
                    "message": "Transcription unavailable (missing Deepgram API key). "
                    "Set DEEPGRAM_API_KEY to enable live transcript.",
                },
            )
            return

        log.error("call.websocket.agent_loop.failed", error=error_text)
        session.record.status = CallStatus.FAILED
        await _broadcast_status(session, "error", {"message": error_text})


@router.websocket("/ws/status/{call_id}")
async def status_stream(websocket: WebSocket, call_id: str) -> None:
    await websocket.accept()
    session = _get_session(call_id)
    session.status_connections.add(websocket)

    await websocket.send_json(
        {
            "event": "status_connected",
            "call_id": call_id,
            "status": session.record.status.value,
            "transcript": [item.model_dump(mode="json") for item in session.record.transcript],
        }
    )

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        session.status_connections.discard(websocket)


@router.websocket("/ws/call/{call_id}")
async def call_stream(websocket: WebSocket, call_id: str) -> None:
    await websocket.accept()
    session = _get_session(call_id)
    log = logger.bind(call_id=call_id)
    log.info("call.websocket.connected")

    try:
        while True:
            payload = await websocket.receive_json()
            event = payload.get("event")

            if event == "connected":
                session.record.status = CallStatus.RINGING
                await _broadcast_status(session, "call_connected", {"status": session.record.status.value})
                continue

            if event == "start":
                start_data = payload.get("start", {})
                session.call_sid = start_data.get("callSid", call_id)
                session.stream_sid = start_data.get("streamSid", "")
                voice_service.register_call_stream(
                    session.call_sid,
                    session.stream_sid,
                    websocket.send_json,
                )

                session.agent = _create_agent(payload, session)
                session.record.status = CallStatus.CONNECTED
                session.record.transcript = list(session.agent.transcript)
                opening_message = session.agent.get_opening_message()
                session.record.transcript = list(session.agent.transcript)

                if session.worker_task is None or session.worker_task.done():
                    session.worker_task = asyncio.create_task(_run_agent_loop(session))

                await _broadcast_status(
                    session,
                    "call_started",
                    {
                        "status": session.record.status.value,
                        "restaurant_name": session.record.restaurant_name,
                    },
                )
                await _broadcast_status(session, "transcript", {"speaker": "agent", "text": opening_message})
                await asyncio.sleep(2.0)
                await _send_agent_reply(session, opening_message)
                continue

            if event == "media":
                media_payload = payload.get("media", {}).get("payload")
                if media_payload:
                    await session.audio_queue.put(base64.b64decode(media_payload))
                continue

            if event == "stop":
                break
    except WebSocketDisconnect:
        log.info("call.websocket.disconnected")
    except Exception as exc:
        log.error("call.websocket.failed", error=str(exc))
        session.record.status = CallStatus.FAILED
        await _broadcast_status(session, "error", {"message": str(exc)})
    finally:
        await session.audio_queue.put(None)
        if session.worker_task is not None:
            with suppress(Exception):
                await session.worker_task

        voice_service.unregister_call_stream(session.call_sid)
        session.record.duration_seconds = int((datetime.now(UTC) - session.started_at).total_seconds())
        await _broadcast_status(
            session,
            "call_finished",
            {
                "status": session.record.status.value,
                "duration_seconds": session.record.duration_seconds,
                "transcript": [item.model_dump(mode="json") for item in session.record.transcript],
            },
        )
        with suppress(Exception):
            await websocket.close()