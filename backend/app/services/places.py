import httpx
from app.core.config import settings
from app.core.exceptions import PlacesAPIError
from app.core.logging import logger
from app.models.itinerary import PriceLevel, SkeletonBlock, Venue

_PRICE_LEVEL_MAP = {
    "PRICE_LEVEL_FREE": PriceLevel.BUDGET,
    "PRICE_LEVEL_INEXPENSIVE": PriceLevel.BUDGET,
    "PRICE_LEVEL_MODERATE": PriceLevel.MID,
    "PRICE_LEVEL_EXPENSIVE": PriceLevel.SPLURGE,
    "PRICE_LEVEL_VERY_EXPENSIVE": PriceLevel.SPLURGE,
}

_PRICE_RANGE_TO_API = {
    "budget": ["PRICE_LEVEL_FREE", "PRICE_LEVEL_INEXPENSIVE"],
    "mid": ["PRICE_LEVEL_MODERATE"],
    "splurge": ["PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"],
}


class PlacesService:
    """
    Wraps Google Places API (New) Text Search and Place Details.
    Responsible only for HTTP calls and raw → Venue normalization.
    Constraint filtering and scoring live in ItineraryService.
    """

    BASE_URL = settings.google_places_base_url
    FIELD_MASK = ",".join([
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.location",
        "places.priceLevel",
        "places.rating",
        "places.userRatingCount",
        "places.primaryType",
        "places.types",
        "places.servesVegetarianFood",
        "places.accessibilityOptions",
        "places.photos",
        "places.regularOpeningHours",
        "places.websiteUri",
        "places.editorialSummary",
    ])

    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def text_search(self, block: SkeletonBlock, max_results: int = 10) -> list[Venue]:
        """
        Build a targeted text search from a skeleton block.
        Only the core descriptive intent goes into textQuery.
        Price, rating, and location constraints use dedicated API params.
        """
        text_query = self._build_text_query(block)
        payload: dict = {
            "textQuery": text_query,
            "maxResultCount": max_results,
            "rankPreference": "RELEVANCE",
        }

        if block.price_level:
            payload["priceLevels"] = _PRICE_RANGE_TO_API.get(block.price_level, [])

        if block.anchor_description:
            payload["locationBias"] = {
                "circle": {
                    "center": {"address": block.anchor_description},
                    "radius": self._travel_mins_to_meters(30),
                }
            }

        log = logger.bind(text_query=text_query, block_type=block.activity_type)
        log.info("places.text_search.request")

        response = await self._client.post(
            f"{self.BASE_URL}/places:searchText",
            headers={
                "X-Goog-Api-Key": settings.google_places_api_key,
                "X-Goog-FieldMask": self.FIELD_MASK,
            },
            json=payload,
        )

        if response.status_code != 200:
            raise PlacesAPIError(f"Places API error {response.status_code}: {response.text}")

        data = response.json()
        places = data.get("places", [])
        log.info("places.text_search.response", count=len(places))

        return [self._normalize(p) for p in places]

    def _build_text_query(self, block: SkeletonBlock) -> str:
        """
        Compose a tight, descriptive textQuery — only intent, not constraints.
        """
        parts = []
        if block.cuisine:
            parts.append(" or ".join(block.cuisine))
        if block.keywords:
            parts.extend(block.keywords)
        parts.append(block.activity_type.value)
        if block.anchor_description:
            parts.append(f"in {block.anchor_description}")
        return " ".join(parts)

    def _normalize(self, raw: dict) -> Venue:
        location = raw.get("location", {})
        return Venue(
            place_id=raw.get("id", ""),
            name=raw.get("displayName", {}).get("text", ""),
            address=raw.get("formattedAddress", ""),
            phone=raw.get("nationalPhoneNumber"),
            latitude=location.get("latitude", 0.0),
            longitude=location.get("longitude", 0.0),
            price_level=_PRICE_LEVEL_MAP.get(raw.get("priceLevel", ""), None),
            rating=raw.get("rating"),
            rating_count=raw.get("userRatingCount"),
            primary_type=raw.get("primaryType"),
            types=raw.get("types", []),
            serves_vegetarian=raw.get("servesVegetarianFood", False),
            is_accessible=raw.get("accessibilityOptions", {}).get("wheelchairAccessibleEntrance", False),
            photo_count=len(raw.get("photos", [])),
            opening_hours=raw.get("regularOpeningHours", {}),
            website=raw.get("websiteUri"),
            editorial_summary=raw.get("editorialSummary", {}).get("text"),
        )

    @staticmethod
    def _travel_mins_to_meters(mins: int, mode: str = "walking") -> float:
        speeds = {"walking": 80, "transit": 250, "uber": 500}  # meters per minute
        return mins * speeds.get(mode, 80)
