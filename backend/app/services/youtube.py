import asyncio
import httpx
from app.core.config import settings
from app.core.logging import logger
from app.models.itinerary import Venue


class YouTubeService:
    """
    Fetches YouTube Shorts for venue candidates using the YouTube Data API v3.

    Prerequisites:
        - YouTube Data API v3 must be enabled in the same Google Cloud project
          as your Places API key (console.cloud.google.com → APIs & Services → Enable APIs).
        - The same google_places_api_key is reused; no separate key needed.

    Quota:
        - Each search.list call costs 100 units.
        - Default daily quota: 10,000 units → ~100 searches/day free.
        - Failures are silently swallowed so a YouTube outage never breaks the
          itinerary build; affected venues just get youtube_url = None.
    """

    SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"

    def __init__(self, http_client: httpx.AsyncClient) -> None:
        self._client = http_client

    async def find_short(self, venue_name: str, location_hint: str) -> str | None:
        """
        Search YouTube for a Short about a specific venue.

        Args:
            venue_name:     e.g. "Alinea"
            location_hint:  e.g. "Chicago" or "Williamsburg, Brooklyn"

        Returns:
            A YouTube Shorts URL (https://www.youtube.com/shorts/{id}) or None.
        """
        query = f"{venue_name} {location_hint}"
        try:
            response = await self._client.get(
                self.SEARCH_URL,
                params={
                    "part": "snippet",
                    "q": query,
                    "type": "video",
                    "videoDuration": "short",   # ≤4 min — catches YouTube Shorts
                    "maxResults": 1,
                    "key": settings.google_places_api_key,
                },
            )
            response.raise_for_status()
            items = response.json().get("items", [])
            if not items:
                logger.debug("youtube.no_results", venue=venue_name, query=query)
                return None

            video_id = items[0]["id"]["videoId"]
            url = f"https://www.youtube.com/shorts/{video_id}"
            logger.debug("youtube.found", venue=venue_name, video_id=video_id)
            return url

        except Exception as e:
            logger.warning("youtube.search.failed", venue=venue_name, error=str(e))
            return None

    async def enrich_candidates(
        self, venues: list[Venue], location_hint: str
    ) -> list[Venue]:
        """
        Concurrently fetch YouTube Shorts URLs for a list of venues and
        stamp each Venue.youtube_url in-place.

        Args:
            venues:         Top-N candidates for a single itinerary block.
            location_hint:  City / neighbourhood string used to narrow the search.

        Returns:
            The same list, with youtube_url populated where a video was found.
        """
        urls = await asyncio.gather(
            *[self.find_short(v.name, location_hint) for v in venues]
        )
        for venue, url in zip(venues, urls):
            venue.youtube_url = url
        return venues
