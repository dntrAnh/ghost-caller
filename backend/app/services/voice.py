import asyncio
import base64
import json
from collections.abc import AsyncGenerator, AsyncIterable, Awaitable, Callable
from contextlib import suppress
from dataclasses import dataclass

import httpx
import websockets
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client
from twilio.twiml.voice_response import Connect, Parameter, Stream, VoiceResponse

from app.core.config import settings
from app.core.exceptions import BookingError
from app.core.logging import logger

_DEEPGRAM_STREAM_URL = (
    "wss://api.deepgram.com/v1/listen"
    "?encoding=mulaw&sample_rate=8000&channels=1&interim_results=true&punctuate=true"
)
_ELEVENLABS_MODEL_ID = "eleven_turbo_v2_5"


@dataclass(slots=True)
class _CallStreamTransport:
    stream_sid: str
    sender: Callable[[dict], Awaitable[None]]


class VoiceService:
    """Coordinates Twilio calling, Deepgram transcription, and ElevenLabs speech synthesis."""

    def __init__(self, http_client: httpx.AsyncClient | None = None) -> None:
        self._twilio = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        self._http_client = http_client or httpx.AsyncClient(timeout=30.0)
        self._owns_http_client = http_client is None
        self._active_streams: dict[str, _CallStreamTransport] = {}

    async def aclose(self) -> None:
        if self._owns_http_client:
            await self._http_client.aclose()

    def preflight_twilio(self) -> dict[str, str | bool | int | None]:
        if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_phone_number:
            return {
                "ok": False,
                "message": "Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER.",
            }

        try:
            account = self._twilio.api.accounts(settings.twilio_account_sid).fetch()
            return {
                "ok": True,
                "message": "Twilio credentials are valid.",
                "account_sid": account.sid,
                "status": getattr(account, "status", None),
            }
        except Exception as exc:  # pragma: no cover - upstream/network
            return {
                "ok": False,
                "message": f"Twilio preflight failed: {exc}",
            }

    async def preflight_deepgram(self) -> dict[str, str | bool | int | None]:
        if not settings.deepgram_api_key:
            return {
                "ok": False,
                "message": "Missing DEEPGRAM_API_KEY.",
            }

        try:
            response = await self._http_client.get(
                "https://api.deepgram.com/v1/projects",
                headers={"Authorization": f"Token {settings.deepgram_api_key}"},
            )
            if response.is_success:
                projects = response.json().get("projects", [])
                return {
                    "ok": True,
                    "message": "Deepgram key is valid.",
                    "project_count": len(projects),
                }

            return {
                "ok": False,
                "message": f"Deepgram preflight failed: HTTP {response.status_code}",
            }
        except Exception as exc:  # pragma: no cover - upstream/network
            return {
                "ok": False,
                "message": f"Deepgram preflight failed: {exc}",
            }

    async def preflight_elevenlabs(self) -> dict[str, str | bool | int | None]:
        if not settings.elevenlabs_api_key:
            return {
                "ok": False,
                "message": "Missing ELEVENLABS_API_KEY.",
            }

        try:
            response = await self._http_client.get(
                "https://api.elevenlabs.io/v1/user/subscription",
                headers={"xi-api-key": settings.elevenlabs_api_key},
            )
            if response.is_success:
                payload = response.json()
                char_count = payload.get("character_count")
                char_limit = payload.get("character_limit")
                return {
                    "ok": True,
                    "message": "ElevenLabs key is valid.",
                    "character_count": char_count,
                    "character_limit": char_limit,
                }

            return {
                "ok": False,
                "message": f"ElevenLabs preflight failed: HTTP {response.status_code}",
            }
        except Exception as exc:  # pragma: no cover - upstream/network
            return {
                "ok": False,
                "message": f"ElevenLabs preflight failed: {exc}",
            }

    def initiate_call(
        self,
        phone_number: str,
        webhook_url: str,
        status_callback_url: str | None = None,
    ) -> str:
        """Create an outbound Twilio call that fetches TwiML from the provided webhook URL."""
        if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_phone_number:
            raise BookingError("Twilio credentials are not configured.")

        log = logger.bind(provider="twilio", phone_number=phone_number)
        log.info(
            "voice.initiate_call.start",
            webhook_url=webhook_url,
            account_sid_prefix=settings.twilio_account_sid[:6],
            auth_token_present=bool(settings.twilio_auth_token),
            from_number=settings.twilio_phone_number,
        )

        try:
            call = self._twilio.calls.create(
                to=phone_number,
                from_=settings.twilio_phone_number,
                url=webhook_url,
                method="POST",
                status_callback=status_callback_url,
                status_callback_method="POST" if status_callback_url else None,
                status_callback_event=["initiated", "ringing", "answered", "completed"] if status_callback_url else None,
            )
        except TwilioRestException as exc:  # pragma: no cover - depends on upstream API/network
            log.error(
                "voice.initiate_call.twilio_error",
                status=exc.status,
                code=exc.code,
                message=exc.msg,
                more_info=getattr(exc, "more_info", None),
            )
            raise BookingError(f"Failed to initiate outbound call: {exc.msg} (code={exc.code})") from exc
        except Exception as exc:  # pragma: no cover - depends on upstream API/network
            log.error("voice.initiate_call.failed", error=str(exc))
            raise BookingError(f"Failed to initiate outbound call: {exc}") from exc

        log.info("voice.initiate_call.complete", call_sid=call.sid)
        return call.sid

    def create_twiml_stream_response(
        self,
        websocket_url: str,
        custom_parameters: dict[str, str] | None = None,
    ) -> str:
        """Build the TwiML response that connects the live call to our media stream websocket."""
        response = VoiceResponse()
        response.say(
            "Please hold while we connect you to our reservation assistant.",
            voice="Polly.Joanna",
            language="en-US",
        )

        connect = Connect()
        stream = Stream(url=websocket_url)
        for name, value in (custom_parameters or {}).items():
            stream.append(Parameter(name=name, value=value))
        connect.append(stream)
        response.append(connect)

        logger.info(
            "voice.twiml_stream.created",
            websocket_url=websocket_url,
            parameter_count=len(custom_parameters or {}),
        )
        return str(response)

    async def transcribe_stream(self, audio_stream: AsyncIterable[bytes]) -> AsyncGenerator[str, None]:
        """Relay Twilio audio frames to Deepgram and yield transcript text as it arrives."""
        if not settings.deepgram_api_key:
            raise BookingError("Deepgram API key is not configured.")

        log = logger.bind(provider="deepgram")
        log.info("voice.transcribe_stream.start")

        try:
            async with websockets.connect(
                _DEEPGRAM_STREAM_URL,
                additional_headers={"Authorization": f"Token {settings.deepgram_api_key}"},
            ) as connection:
                sender_task = asyncio.create_task(self._forward_audio(audio_stream, connection))

                try:
                    async for message in connection:
                        if isinstance(message, bytes):
                            continue

                        payload = json.loads(message)
                        transcript = (
                            payload.get("channel", {})
                            .get("alternatives", [{}])[0]
                            .get("transcript", "")
                            .strip()
                        )

                        if transcript:
                            log.debug("voice.transcribe_stream.transcript", transcript=transcript)
                            yield transcript
                finally:
                    if not sender_task.done():
                        sender_task.cancel()
                        with suppress(asyncio.CancelledError):
                            await sender_task
        except Exception as exc:  # pragma: no cover - depends on upstream API/network
            log.error("voice.transcribe_stream.failed", error=str(exc))
            raise BookingError(f"Deepgram streaming failed: {exc}") from exc

    async def synthesize_speech(self, text: str) -> bytes:
        """Generate Twilio-compatible mu-law 8kHz speech audio from ElevenLabs."""
        if not settings.elevenlabs_api_key:
            raise BookingError("ElevenLabs API key is not configured.")

        log = logger.bind(provider="elevenlabs")
        log.info("voice.synthesize_speech.start", text_length=len(text))

        try:
            response = await self._http_client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{settings.elevenlabs_voice_id}",
                params={"output_format": "ulaw_8000"},
                headers={
                    "xi-api-key": settings.elevenlabs_api_key,
                    "Accept": "audio/mulaw",
                },
                json={
                    "text": text,
                    "model_id": _ELEVENLABS_MODEL_ID,
                    "voice_settings": {
                        "stability": 0.45,
                        "similarity_boost": 0.8,
                        "style": 0.15,
                        "use_speaker_boost": True,
                    },
                },
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            log.error("voice.synthesize_speech.failed", error=str(exc))
            raise BookingError(f"ElevenLabs speech synthesis failed: {exc}") from exc

        log.info("voice.synthesize_speech.complete", audio_bytes=len(response.content))
        return response.content

    async def stream_audio_to_call(self, call_sid: str, audio_bytes: bytes) -> None:
        """Push synthesized mu-law audio back to a live Twilio media stream."""
        transport = self._active_streams.get(call_sid)
        if transport is None:
            raise BookingError(f"No active media stream is registered for call {call_sid}.")

        payload = {
            "event": "media",
            "streamSid": transport.stream_sid,
            "media": {
                "payload": base64.b64encode(audio_bytes).decode("ascii"),
            },
        }

        log = logger.bind(provider="twilio", call_sid=call_sid, stream_sid=transport.stream_sid)
        log.info("voice.stream_audio_to_call.start", audio_bytes=len(audio_bytes))

        try:
            await transport.sender(payload)
        except Exception as exc:  # pragma: no cover - depends on websocket transport
            log.error("voice.stream_audio_to_call.failed", error=str(exc))
            raise BookingError(f"Failed to stream synthesized audio back to Twilio: {exc}") from exc

        log.info("voice.stream_audio_to_call.complete")

    def register_call_stream(
        self,
        call_sid: str,
        stream_sid: str,
        sender: Callable[[dict], Awaitable[None]],
    ) -> None:
        self._active_streams[call_sid] = _CallStreamTransport(stream_sid=stream_sid, sender=sender)
        logger.info("voice.register_call_stream", call_sid=call_sid, stream_sid=stream_sid)

    def unregister_call_stream(self, call_sid: str) -> None:
        removed = self._active_streams.pop(call_sid, None)
        logger.info("voice.unregister_call_stream", call_sid=call_sid, removed=removed is not None)

    async def _forward_audio(self, audio_stream: AsyncIterable[bytes], connection: websockets.ClientConnection) -> None:
        async for chunk in audio_stream:
            if not chunk:
                continue
            await connection.send(chunk)

        await connection.send(json.dumps({"type": "CloseStream"}))