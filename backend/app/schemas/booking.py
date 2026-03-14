from pydantic import BaseModel


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
