from datetime import datetime
from enum import StrEnum
from pydantic import BaseModel, Field


class ActivityType(StrEnum):
    # Food & drink
    RESTAURANT = "restaurant"
    BAR = "bar"
    CAFE = "cafe"
    BAKERY = "bakery"
    FOOD_MARKET = "food_market"
    ROOFTOP_BAR = "rooftop_bar"
    WINE_BAR = "wine_bar"
    BREWERY = "brewery"
    DESSERT = "dessert"
    # Culture & sights
    MUSEUM = "museum"
    GALLERY = "gallery"
    LANDMARK = "landmark"
    HISTORIC_SITE = "historic_site"
    THEATER = "theater"
    CONCERT_VENUE = "concert_venue"
    # Outdoors & leisure
    PARK = "park"
    WATERFRONT = "waterfront"
    BOTANICAL_GARDEN = "botanical_garden"
    BEACH = "beach"
    HIKING = "hiking"
    # Entertainment
    ATTRACTION = "attraction"
    ARCADE = "arcade"
    BOWLING = "bowling"
    COMEDY_CLUB = "comedy_club"
    ESCAPE_ROOM = "escape_room"
    KARAOKE = "karaoke"
    NIGHTCLUB = "nightclub"
    SPORTS_VENUE = "sports_venue"
    # Wellness
    SPA = "spa"
    YOGA = "yoga"
    GYM = "gym"
    # Shopping & browsing
    SHOPPING = "shopping"
    BOOKSTORE = "bookstore"
    VINTAGE_MARKET = "vintage_market"
    FARMERS_MARKET = "farmers_market"
    # Transit / freeform
    TRANSIT = "transit"
    FREE_TIME = "free_time"


class PriceLevel(StrEnum):
    BUDGET = "budget"
    MID = "mid"
    SPLURGE = "splurge"


class SkeletonBlock(BaseModel):
    """A single time block in the LLM-generated skeleton itinerary."""
    activity_type: ActivityType
    start_time: datetime
    end_time: datetime
    # Intent — drives textQuery
    keywords: list[str] = Field(default_factory=list)
    cuisine: list[str] = Field(default_factory=list)
    vibes: list[str] = Field(default_factory=list)
    # Hard constraints — drives post-filtering
    dietary_restrictions: list[str] = Field(default_factory=list)
    excluded_place_ids: list[str] = Field(default_factory=list)
    # Soft preference weights 0.0–1.0 keyed by preference name
    preference_weights: dict[str, float] = Field(default_factory=dict)
    # Spatial context
    anchor_description: str = ""  # e.g. "Williamsburg, Brooklyn"
    price_level: PriceLevel = PriceLevel.MID
    # Constraint relaxation priority (index 0 = drop first if no results)
    relaxation_order: list[str] = Field(default_factory=list)


class Venue(BaseModel):
    """A resolved venue from Google Places API."""
    place_id: str
    name: str
    address: str
    phone: str | None = None
    latitude: float
    longitude: float
    price_level: PriceLevel | None = None
    rating: float | None = None
    rating_count: int | None = None
    primary_type: str | None = None
    types: list[str] = Field(default_factory=list)
    serves_vegetarian: bool = False
    serves_vegan: bool = False
    is_accessible: bool = False
    photo_count: int = 0
    opening_hours: dict = Field(default_factory=dict)
    website: str | None = None
    editorial_summary: str | None = None
    # Computed after scoring
    composite_score: float = 0.0


class CoordinatorPlan(BaseModel):
    """What the coordinator agent returns — includes LLM-resolved date and meetup point."""
    date: str          # ISO date e.g. "2026-09-12", derived from shared availability
    meetup_point: str  # e.g. "Williamsburg, Brooklyn", derived from member neighborhoods
    blocks: list[SkeletonBlock]


class ItineraryBlock(BaseModel):
    """A skeleton block resolved to a real venue."""
    skeleton: SkeletonBlock
    candidates: list[Venue] = Field(default_factory=list)  # top 3 ranked
    confirmed_venue: Venue | None = None
    booking_status: str = "pending"  # "pending" | "confirmed" | "failed"


class Itinerary(BaseModel):
    group_id: str
    date: str
    meetup_point: str
    blocks: list[ItineraryBlock] = Field(default_factory=list)

class GroupRequest(BaseModel):
    group_id: str
    profiles: list[dict]
    city: str
    date: str
    request: str