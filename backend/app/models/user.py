from datetime import date
from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    # Identity
    name: str
    phone: str

    # Food preferences
    cuisines_loved: list[str] = Field(default_factory=list)
    cuisines_avoided: list[str] = Field(default_factory=list)
    dietary_restrictions: list[str] = Field(default_factory=list)  # hard constraint
    price_range: str = "mid"  # "budget" | "mid" | "splurge"

    # Availability
    availability: list[date] = Field(default_factory=list)

    # Time preferences
    preferred_meal_times: dict[str, str] = Field(default_factory=dict)  # {"dinner": "7-9pm"}
    buffer_mins: int = 30
    flexibility_mins: int = 30

    # Mobility
    transport_mode: str = "transit"  # "walking" | "transit" | "uber"
    max_travel_mins: int = 30

    # Vibe preferences
    vibes: list[str] = Field(default_factory=list)
    photo_spots: bool = False

    # History
    past_places: list[dict] = Field(default_factory=list)
    vetoed_places: list[str] = Field(default_factory=list)  # hard constraint
