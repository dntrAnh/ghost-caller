from pydantic import BaseModel
from typing import Dict, Any

class BookingRequest(BaseModel):
    group_id: str
    block_index: int
    party_size: int
    contact_name: str
    contact_phone: str

class BookingResponse(BaseModel):
    group_id: str
    block_index: int
    venue_name: str
    status: str  # "confirmed" | "failed" | "no_answer"
    confirmation_number: str | None = None
    notes: str | None = None

class BookingStreamMessage(BaseModel):
    type: str  # "status_update", "call_started"
    data: Dict[str, Any]

class CallStreamMessage(BaseModel):
    type: str  # "stt_result", "tts_speech"
    data: Dict[str, Any]