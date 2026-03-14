import httpx
from app.core.config import settings
from app.core.exceptions import PlacesAPIError
from app.core.logging import logger
from app.models.itinerary import PriceLevel, SkeletonBlock, Venue

# Maps broad ActivityType buckets to a single verified Google Places API type.
# Only types confirmed valid in the Places API (New) type table are used here.
# https://developers.google.com/maps/documentation/places/web-service/place-types
# includedType narrows results to a single verified Places API type.
# For categories where no single type covers the breadth (entertainment, shopping),
# we omit includedType and rely on textQuery keywords + locationBias instead.
_ACTIVITY_TYPE_TO_INCLUDED_TYPE: dict[str, str | None] = {
    "restaurant":    "restaurant",       # well-supported, very broad
    "attraction":    "tourist_attraction",  # covers museums, landmarks, galleries
    "entertainment": None,               # too diverse — keywords drive the query
    "outdoor":       "park",             # broad enough to cover most outdoor venues
    "shopping":      "store",            # broader than shopping_mall
    "lodging":       "lodging",          # covers hotels, b&bs, hostels
    "transit":       None,
    "free_time":     None,
}

# Price level filtering is only reliable for restaurants.
# Lodging, entertainment, and shopping places frequently omit priceLevel in the API,
# causing valid results to be silently excluded.
_PRICE_FILTER_ACTIVITY_TYPES = {"restaurant"}

_PRICE_LEVEL_MAP = {
    "PRICE_LEVEL_FREE": PriceLevel.BUDGET,
    "PRICE_LEVEL_INEXPENSIVE": PriceLevel.BUDGET,
    "PRICE_LEVEL_MODERATE": PriceLevel.MID,
    "PRICE_LEVEL_EXPENSIVE": PriceLevel.SPLURGE,
    "PRICE_LEVEL_VERY_EXPENSIVE": PriceLevel.SPLURGE,
}

# PRICE_LEVEL_FREE is response-only — not accepted in request priceLevels
_PRICE_RANGE_TO_API = {
    "budget": ["PRICE_LEVEL_INEXPENSIVE"],
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
        "places.photos.name",
        "places.photos.widthPx",
        "places.photos.heightPx",
        "places.regularOpeningHours",
        "places.websiteUri",
        "places.editorialSummary",
    ])

    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def geocode(self, address: str) -> tuple[float, float] | None:
        """
        Resolve a human-readable address to (lat, lng) using the Google Geocoding API.
        Returns None if the address cannot be resolved.
        """
        response = await self._client.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"address": address, "key": settings.google_places_api_key},
        )
        if response.status_code != 200:
            logger.warning("geocode.failed", address=address, status=response.status_code)
            return None
        results = response.json().get("results", [])
        if not results:
            logger.warning("geocode.no_results", address=address)
            return None
        loc = results[0]["geometry"]["location"]
        return loc["lat"], loc["lng"]

    async def text_search(self, block: SkeletonBlock, max_results: int = 10) -> list[Venue]:
        """
        Build a targeted text search from a skeleton block.
        Only the core descriptive intent goes into textQuery.
        Price, rating, and location constraints use dedicated API params.
        """
        text_query = self._build_text_query(block)
        payload: dict = {
            "textQuery": text_query,
            "pageSize": max_results,  # maxResultCount is deprecated in Places API (New)
            "rankPreference": "RELEVANCE",
        }

        if block.price_level and block.activity_type in _PRICE_FILTER_ACTIVITY_TYPES:
            payload["priceLevels"] = _PRICE_RANGE_TO_API.get(block.price_level, [])

        included_type = _ACTIVITY_TYPE_TO_INCLUDED_TYPE.get(block.activity_type)
        if included_type:
            payload["includedType"] = included_type

        if block.anchor_lat is not None and block.anchor_lng is not None:
            payload["locationBias"] = {
                "circle": {
                    "center": {
                        "latitude": block.anchor_lat,
                        "longitude": block.anchor_lng,
                    },
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
        Category filtering is handled by includedType, so we only put
        descriptive keywords and cuisine here to keep the query focused.
        """
        parts = []
        if block.cuisine:
            parts.append(" ".join(block.cuisine))
        if block.keywords:
            parts.extend(block.keywords)
        if block.vibes:
            parts.extend(block.vibes)
        if block.anchor_description:
            parts.append(f"in {block.anchor_description}")
        # Fallback: if no descriptors at all, use the category name
        if not any([block.cuisine, block.keywords, block.vibes]):
            parts.insert(0, block.activity_type.value)
        return " ".join(parts)

    def _normalize(self, raw: dict) -> Venue:
        location = raw.get("location", {})
        photos = raw.get("photos", [])

        # Debug: log what the API actually returns for photos
        logger.debug(
            "places.normalize.photos",
            place=raw.get("displayName", {}).get("text", "unknown"),
            photos_raw=photos,
            photo_count=len(photos),
            first_photo_keys=list(photos[0].keys()) if photos else [],
        )

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
            photo_count=len(photos),
            photo_url=self._build_photo_url(photos[0]["name"]) if photos else None,
            opening_hours=raw.get("regularOpeningHours", {}),
            website=raw.get("websiteUri"),
            editorial_summary=raw.get("editorialSummary", {}).get("text"),
        )

    def _build_photo_url(self, photo_name: str) -> str:
        """
        Constructs a ready-to-use photo URL from a Places API photo reference name.
        e.g. photo_name = "places/ChIJ.../photos/AUacShh..."
        """
        return (
            f"https://places.googleapis.com/v1/{photo_name}/media"
            f"?maxWidthPx=800&key={settings.google_places_api_key}"
        )

    @staticmethod
    def _travel_mins_to_meters(mins: int, mode: str = "walking") -> float:
        speeds = {"walking": 80, "transit": 250, "uber": 500}  # meters per minute
        return mins * speeds.get(mode, 80)
