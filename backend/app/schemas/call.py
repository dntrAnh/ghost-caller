from pydantic import BaseModel, Field


class TranscriptItem(BaseModel):
    speaker: str
    text: str
    timestamp: str


class SentimentItem(BaseModel):
    text: str
    sentiment: str
    confidence: float


class InitiateCallRequest(BaseModel):
    restaurant_name: str
    restaurant_phone: str
    party_size: int
    preferred_date: str
    preferred_time: str
    buffer_minutes: int = 30
    dietary_restrictions: list[str] = Field(default_factory=list)
    user_name: str


class CallStatusResponse(BaseModel):
    call_id: str
    status: str
    transcript: list[TranscriptItem] = Field(default_factory=list)
    sentiment_log: list[SentimentItem] = Field(default_factory=list)
    confirmation_code: str | None = None
    confirmed_time: str | None = None
    confirmed_date: str | None = None


class InviteAttendee(BaseModel):
    name: str
    email: str


class GenerateICSRequest(BaseModel):
    call_id: str
    attendees: list[InviteAttendee] = Field(default_factory=list)
    restaurant_name: str
    restaurant_address: str
    confirmed_date: str
    confirmed_time: str
    restaurant_phone: str
    dietary_notes: str


class SendInvitesRequest(BaseModel):
    ics_content: str
    attendees: list[InviteAttendee] = Field(default_factory=list)
    restaurant_name: str
    confirmed_date: str
    confirmed_time: str