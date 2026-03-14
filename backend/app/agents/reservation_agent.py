import json
from datetime import datetime, UTC
from enum import StrEnum

import anthropic
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.exceptions import BookingError
from app.core.logging import logger
from app.models.call import SentimentEntry, TranscriptEntry
from app.utils.prompt_builder import (
    NEGOTIATION_PROMPT,
    RESERVATION_AGENT_SYSTEM_PROMPT,
    SENTIMENT_CLASSIFICATION_PROMPT,
)


class ReservationState(StrEnum):
    GREETING = "greeting"
    REQUESTING = "requesting"
    AWAITING_RESPONSE = "awaiting_response"
    NEGOTIATING = "negotiating"
    CONFIRMING = "confirming"
    DONE = "done"
    FAILED = "failed"


class ResponseSentiment(StrEnum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    AMBIGUOUS = "ambiguous"


class AgentAction(BaseModel):
    next_state: ReservationState
    response_text: str
    sentiment: ResponseSentiment
    confidence: float


class ReservationAgent:
    affirmative_words = (
        "yes",
        "sure",
        "possible",
        "absolutely",
        "of course",
        "can do",
    )
    negative_words = (
        "sorry",
        "full",
        "booked",
        "unavailable",
        "no",
        "can't",
    )

    def __init__(
        self,
        *,
        restaurant_name: str,
        party_size: int,
        date: str,
        time: str,
        buffer_minutes: int,
        dietary_restrictions: list[str] | None,
        user_name: str,
    ) -> None:
        self.restaurant_name = restaurant_name
        self.party_size = party_size
        self.date = date
        self.time = time
        self.buffer_minutes = buffer_minutes
        self.dietary_restrictions = dietary_restrictions or []
        self.user_name = user_name
        self.state = ReservationState.GREETING
        self.transcript: list[TranscriptEntry] = []
        self.sentiment_log: list[SentimentEntry] = []
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._log = logger.bind(restaurant_name=restaurant_name, user_name=user_name)

    def get_opening_message(self) -> str:
        dietary_info = self._dietary_info()
        self.state = ReservationState.REQUESTING
        opening_message = (
            f"Hi! I'm an AI assistant calling on behalf of {self.user_name}. "
            f"I'm trying to make a reservation for a party of {self.party_size} "
            f"on {self.date} around {self.time}. We can buffer for about "
            f"{self.buffer_minutes} minutes if there happen to be open tables. "
            f"We have {dietary_info}. Is this possible?"
        )
        self._record_transcript("agent", opening_message)
        return opening_message

    async def process_response(self, transcript: str) -> AgentAction:
        self._record_transcript("restaurant", transcript)
        sentiment, confidence = await self._classify_response(transcript)
        self._record_sentiment(transcript, sentiment, confidence)

        if sentiment == ResponseSentiment.POSITIVE:
            self.state = ReservationState.CONFIRMING
            response_text = await self.get_confirmation_response(transcript)
            next_state = ReservationState.DONE
        elif sentiment == ResponseSentiment.NEGATIVE:
            if self.state == ReservationState.NEGOTIATING:
                response_text = "Understood. Thank you for checking. We'll make other arrangements."
                next_state = ReservationState.FAILED
            else:
                self.state = ReservationState.NEGOTIATING
                response_text = await self.get_negotiation_response(transcript)
                next_state = ReservationState.NEGOTIATING
        else:
            self.state = ReservationState.AWAITING_RESPONSE
            response_text = (
                "Thanks. Could you let me know whether you have anything available "
                f"for {self.party_size} guests around {self.time} on {self.date}?"
            )
            next_state = ReservationState.AWAITING_RESPONSE

        self._record_transcript("agent", response_text)

        if next_state in {ReservationState.DONE, ReservationState.FAILED}:
            self.state = next_state

        return AgentAction(
            next_state=next_state,
            response_text=response_text,
            sentiment=sentiment,
            confidence=confidence,
        )

    async def get_negotiation_response(self, context: str) -> str:
        prompt = (
            f"{NEGOTIATION_PROMPT}\n\n"
            f"Restaurant: {self.restaurant_name}\n"
            f"Requested party size: {self.party_size}\n"
            f"Requested date: {self.date}\n"
            f"Requested time: {self.time}\n"
            f"Flexible window: {self.buffer_minutes} minutes\n"
            f"Dietary restrictions: {self._dietary_info()}\n"
            f"Restaurant response: {context}"
        )
        return await self._generate_text(prompt, fallback=(
            f"Would you happen to have anything within {self.buffer_minutes} minutes of {self.time}, "
            f"or another seating on {self.date} for {self.party_size}?"
        ))

    async def get_confirmation_response(self, details: str) -> str:
        prompt = (
            f"{RESERVATION_AGENT_SYSTEM_PROMPT}\n\n"
            "Generate a concise closing confirmation response that repeats the key booking details and thanks the host. "
            "Respond with plain text only.\n\n"
            f"Restaurant: {self.restaurant_name}\n"
            f"Requested party size: {self.party_size}\n"
            f"Requested date: {self.date}\n"
            f"Requested time: {self.time}\n"
            f"Dietary restrictions: {self._dietary_info()}\n"
            f"Restaurant confirmation details: {details}"
        )
        return await self._generate_text(
            prompt,
            fallback=(
                f"Perfect, thank you. I have the reservation for {self.party_size} on {self.date} "
                f"around {self.time}. I appreciate your help."
            ),
        )

    async def _classify_response(self, transcript: str) -> tuple[ResponseSentiment, float]:
        heuristic_sentiment, heuristic_confidence = self._heuristic_classification(transcript)
        prompt = (
            f"{SENTIMENT_CLASSIFICATION_PROMPT}\n\n"
            f"Reservation request: party of {self.party_size} on {self.date} around {self.time}.\n"
            f"Host response: {transcript}"
        )

        self._log.info("reservation_agent.classification.start", state=self.state)

        try:
            raw = await self._generate_text(prompt)
            payload = self._parse_json(raw)
            model_sentiment = ResponseSentiment(str(payload["sentiment"]).lower())
            model_confidence = max(0.0, min(float(payload["confidence"]), 1.0))
        except (BookingError, KeyError, ValueError, TypeError) as exc:
            self._log.warning("reservation_agent.classification.fallback", error=str(exc))
            return heuristic_sentiment, heuristic_confidence

        if heuristic_sentiment != ResponseSentiment.AMBIGUOUS and heuristic_sentiment != model_sentiment:
            return heuristic_sentiment, max(heuristic_confidence, model_confidence)

        return model_sentiment, model_confidence

    def _heuristic_classification(self, transcript: str) -> tuple[ResponseSentiment, float]:
        lowered = transcript.lower()
        positive_hits = sum(word in lowered for word in self.affirmative_words)
        negative_hits = sum(word in lowered for word in self.negative_words)

        if positive_hits > negative_hits:
            return ResponseSentiment.POSITIVE, min(0.65 + positive_hits * 0.1, 0.95)
        if negative_hits > positive_hits:
            return ResponseSentiment.NEGATIVE, min(0.65 + negative_hits * 0.1, 0.95)
        return ResponseSentiment.AMBIGUOUS, 0.5

    async def _generate_text(self, prompt: str, fallback: str | None = None) -> str:
        try:
            message = await self._client.messages.create(
                model=settings.anthropic_model,
                max_tokens=512,
                system=RESERVATION_AGENT_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
        except Exception as exc:  # pragma: no cover - depends on upstream API/network
            if fallback is not None:
                self._log.warning("reservation_agent.generation.fallback", error=str(exc))
                return fallback
            raise BookingError(f"Reservation agent request failed: {exc}") from exc

        if not message.content:
            if fallback is not None:
                return fallback
            raise BookingError("Reservation agent returned an empty response.")

        text = message.content[0].text.strip()
        if not text and fallback is not None:
            return fallback
        if not text:
            raise BookingError("Reservation agent returned an empty response.")
        return text

    def _parse_json(self, raw: str) -> dict:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            parts = cleaned.split("```")
            if len(parts) > 1:
                cleaned = parts[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
        try:
            return json.loads(cleaned.strip())
        except json.JSONDecodeError as exc:
            raise BookingError(f"Reservation agent returned invalid JSON: {exc}") from exc

    def _record_transcript(self, speaker: str, text: str) -> None:
        self.transcript.append(
            TranscriptEntry(
                speaker=speaker,
                text=text,
                timestamp=datetime.now(UTC),
            )
        )

    def _record_sentiment(
        self,
        text: str,
        sentiment: ResponseSentiment,
        confidence: float,
    ) -> None:
        self.sentiment_log.append(
            SentimentEntry(
                text=text,
                sentiment=sentiment.value,
                confidence=confidence,
            )
        )

    def _dietary_info(self) -> str:
        if not self.dietary_restrictions:
            return "no dietary restrictions"
        if len(self.dietary_restrictions) == 1:
            return self.dietary_restrictions[0]
        return ", ".join(self.dietary_restrictions[:-1]) + f" and {self.dietary_restrictions[-1]}"