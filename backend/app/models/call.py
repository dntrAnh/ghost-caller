from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class CallStatus(StrEnum):
    INITIATED = "initiated"
    RINGING = "ringing"
    CONNECTED = "connected"
    NEGOTIATING = "negotiating"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    BUSY = "busy"
    NO_ANSWER = "no_answer"
    CANCELED = "canceled"
    FAILED = "failed"


class TranscriptEntry(BaseModel):
    speaker: str
    text: str
    timestamp: datetime


class SentimentEntry(BaseModel):
    text: str
    sentiment: str
    confidence: float


class CallRecord(BaseModel):
    id: str
    booking_id: str
    restaurant_name: str
    restaurant_phone: str
    status: CallStatus = CallStatus.INITIATED
    transcript: list[TranscriptEntry] = Field(default_factory=list)
    sentiment_log: list[SentimentEntry] = Field(default_factory=list)
    confirmation_code: str | None = None
    confirmed_time: str | None = None
    confirmed_date: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    duration_seconds: int | None = None


class InviteAttendee(BaseModel):
    name: str
    email: str
    dietary: str | None = None


class CalendarInvite(BaseModel):
    id: str
    call_record_id: str
    attendees: list[InviteAttendee] = Field(default_factory=list)
    ics_content: str
    sent: bool = False
    sent_at: datetime | None = None