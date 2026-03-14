from pydantic import BaseModel
from app.models.user import UserProfile


class BuildItineraryRequest(BaseModel):
    group_id: str
    date: str  # ISO date string e.g. "2026-09-12"
    meetup_point: str  # e.g. "Williamsburg, Brooklyn"
    profiles: list[UserProfile]


class VenueResponse(BaseModel):
    place_id: str
    name: str
    address: str
    phone: str | None
    rating: float | None
    composite_score: float


class ItineraryBlockResponse(BaseModel):
    activity_type: str
    start_time: str
    end_time: str
    candidates: list[VenueResponse]
    confirmed_venue: VenueResponse | None
    booking_status: str


class BuildItineraryResponse(BaseModel):
    group_id: str
    date: str
    meetup_point: str
    blocks: list[ItineraryBlockResponse]
