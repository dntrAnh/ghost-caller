import asyncio
import json
from datetime import datetime, timedelta, UTC
from enum import StrEnum

import anthropic
from pydantic import BaseModel

from app.core.config import settings
from app.core.exceptions import BookingError
from app.core.logging import logger
from app.models.call import SentimentEntry, TranscriptEntry
from app.utils.prompt_builder import (
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

    max_negotiation_rounds = 3
    max_ambiguous_rounds = 4

    LISTENING_DELAY = 2.5

    confirmation_phrase = "i confirm the reservation"

    affirmative_words = (
        "yes",
        "sure",
        "available",
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

    confirmation_phrases = (
        "reservation confirmed",
        "i confirm the reservation",
        "i confirmed the reservation",
        "confirmed the reservation",
        "confirmed at",
        "confirmed for",
        "your table is booked",
        "you're confirmed",
        "you are confirmed",
        "we have you",
        "we'll see you",
        "see you at",
        "see you then",
        "you're good to go",
        "you are good to go",
        "all set",
        "we'll expect you"
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
    ):

        self.restaurant_name = restaurant_name
        self.party_size = party_size
        self.date = date
        self.user_name = user_name

        self.primary_time = time

        for fmt in ("%I:%M%p", "%H:%M", "%I:%M %p"):
            try:
                parsed_time = datetime.strptime(time, fmt)
                break
            except ValueError:
                continue
        else:
            parsed_time = datetime.strptime("19:00", "%H:%M")

        self.buffer_time = (
            parsed_time + timedelta(minutes=buffer_minutes)
        ).strftime("%I:%M %p")

        self.target_times = [self.primary_time, self.buffer_time]

        self.dietary_restrictions = dietary_restrictions or []

        self.state = ReservationState.GREETING
        self.negotiation_rounds = 0
        self.ambiguous_rounds = 0

        self.transcript: list[TranscriptEntry] = []
        self.sentiment_log: list[SentimentEntry] = []

        self._client = anthropic.AsyncAnthropic(
            api_key=settings.anthropic_api_key
        )

        self._log = logger.bind(
            restaurant_name=restaurant_name,
            user_name=user_name,
        )

    def get_opening_message(self) -> str:

        self.state = ReservationState.REQUESTING

        message = (
            f"Hi! AI assistant for {self.user_name} — "
            f"table for {self.party_size} at {self.primary_time}, or {self.buffer_time} if needed. "
            f"Available? Say 'I confirm the reservation' to lock it in."
        )

        self._record_transcript("agent", message)
        return message

    async def process_response(self, transcript: str) -> AgentAction:

        if self._is_partial_speech(transcript):
            return AgentAction(
                next_state=self.state,
                response_text="",
                sentiment=ResponseSentiment.AMBIGUOUS,
                confidence=0.0,
            )

        await asyncio.sleep(self.LISTENING_DELAY)

        self._record_transcript("restaurant", transcript)

        normalized = transcript.lower().strip()

        if self._detect_confirmation(normalized):

            self.state = ReservationState.DONE

            response = (
                f"Wonderful, thank you so much. "
                f"I have the reservation for {self.party_size} people at "
                f"{self.restaurant_name}. "
                f"We really appreciate your help. "
                f"Have a lovely evening!"
            )

            self._record_transcript("agent", response)

            return AgentAction(
                next_state=ReservationState.DONE,
                response_text=response,
                sentiment=ResponseSentiment.POSITIVE,
                confidence=0.99,
            )

        sentiment, confidence = await self._classify_response(transcript)

        self._record_sentiment(transcript, sentiment, confidence)

        if sentiment == ResponseSentiment.POSITIVE:

            response = (
                "That sounds great, thank you. "
                f"Could you please confirm the reservation for "
                f"{self.party_size} people around {self.primary_time} "
                f"or {self.buffer_time}?"
            )

            next_state = ReservationState.CONFIRMING

        elif sentiment == ResponseSentiment.NEGATIVE:

            if self.negotiation_rounds >= self.max_negotiation_rounds:

                response = (
                    "No worries at all, I really appreciate you checking. "
                    "I'll try another restaurant. "
                    "Thanks again and have a great night!"
                )

                next_state = ReservationState.FAILED

            else:

                response = self._negotiation_ladder()

                self.negotiation_rounds += 1
                next_state = ReservationState.NEGOTIATING

        else:

            self.ambiguous_rounds += 1

            if self.ambiguous_rounds >= self.max_ambiguous_rounds:

                response = (
                    f"Just to double check, would there happen to be a table "
                    f"for {self.party_size} people around {self.primary_time} "
                    f"or {self.buffer_time} tonight?"
                )

            else:

                response = (
                    f"Got it, thanks. "
                    f"Could you let me know if there might be availability "
                    f"around {self.primary_time}?"
                )

            next_state = ReservationState.AWAITING_RESPONSE

        self._record_transcript("agent", response)

        return AgentAction(
            next_state=next_state,
            response_text=response,
            sentiment=sentiment,
            confidence=confidence,
        )

    def _negotiation_ladder(self) -> str:

        if self.negotiation_rounds == 0:

            return (
                f"Totally understand if {self.primary_time} is busy. "
                f"Would {self.buffer_time} happen to work instead?"
            )

        if self.negotiation_rounds == 1:

            return (
                f"No problem at all. "
                f"Anything between {self.primary_time} and "
                f"{self.buffer_time} would be perfect."
            )

        if self.negotiation_rounds == 2:

            return (
                "I really appreciate you checking. "
                "Would there happen to be any openings later tonight?"
            )

        return "Thanks again for checking."

    # Words that signal a booking has been completed
    _completion_verbs = (
        "confirm", "confirmed", "booked", "reserved", "set", "noted", "done",
        "taken care", "all set", "good to go", "set you up", "set up",
    )
    # Words that indicate the subject is the reservation/party
    _booking_nouns = (
        "reservation", "table", "booking", "you", "that", "it", "your party",
        "your group", "your visit",
    )
    # Phrases that on their own signal completion
    _standalone_signals = (
        "you're all set", "you are all set", "all set", "good to go",
        "we'll see you", "we will see you", "looking forward to seeing you",
        "expect you", "see you then", "see you soon",
    )

    def _detect_confirmation(self, transcript: str) -> bool:

        t = transcript.lower().strip()

        # Exact catchphrase
        if self.confirmation_phrase in t:
            return True

        # Phrase list
        if any(p in t for p in self.confirmation_phrases):
            return True

        # Standalone completion signals
        if any(s in t for s in self._standalone_signals):
            return True

        # Any completion verb + booking noun in the same utterance
        has_verb = any(v in t for v in self._completion_verbs)
        has_noun = any(n in t for n in self._booking_nouns)
        if has_verb and has_noun:
            return True

        # "booked" or "reserved" alone is strong enough
        if any(w in t for w in ("booked", "reserved", "noted")):
            return True

        return False

    def _is_partial_speech(self, transcript: str) -> bool:

        words = transcript.strip().split()

        if len(words) < 3:
            return True

        if transcript.endswith(("...", ",")):
            return True

        return False

    async def _classify_response(
        self, transcript: str
    ) -> tuple[ResponseSentiment, float]:

        heuristic, confidence = self._heuristic_classification(transcript)

        prompt = (
            f"{SENTIMENT_CLASSIFICATION_PROMPT}\n\n"
            f"Reservation request: {self.party_size} people "
            f"around {self.primary_time}.\n"
            f"Restaurant response: {transcript}"
        )

        try:

            raw = await self._generate_text(prompt)
            payload = json.loads(raw)

            model_sentiment = ResponseSentiment(
                payload["sentiment"].lower()
            )

            model_confidence = float(payload["confidence"])

        except Exception:

            return heuristic, confidence

        if heuristic != ResponseSentiment.AMBIGUOUS:

            return heuristic, max(confidence, model_confidence)

        return model_sentiment, model_confidence

    def _heuristic_classification(
        self, transcript: str
    ) -> tuple[ResponseSentiment, float]:

        lowered = transcript.lower()

        pos_hits = sum(w in lowered for w in self.affirmative_words)
        neg_hits = sum(w in lowered for w in self.negative_words)

        if pos_hits > neg_hits:
            return ResponseSentiment.POSITIVE, 0.8

        if neg_hits > pos_hits:
            return ResponseSentiment.NEGATIVE, 0.8

        return ResponseSentiment.AMBIGUOUS, 0.5

    async def _generate_text(
        self, prompt: str, fallback: str | None = None
    ) -> str:

        try:

            message = await self._client.messages.create(
                model=settings.anthropic_model,
                max_tokens=200,
                system=RESERVATION_AGENT_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )

        except Exception as exc:

            if fallback:
                return fallback

            raise BookingError(str(exc))

        if not message.content:
            if fallback:
                return fallback
            raise BookingError("Empty response")

        return message.content[0].text.strip()

    def _record_transcript(self, speaker: str, text: str):

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
    ):

        self.sentiment_log.append(
            SentimentEntry(
                text=text,
                sentiment=sentiment.value,
                confidence=confidence,
            )
        )