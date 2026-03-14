import httpx
from collections.abc import AsyncGenerator
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.core.exceptions import ItineraryBuildError, PlacesAPIError
from app.core.logging import logger
from app.models.itinerary import Venue
from app.schemas.itinerary import BuildItineraryRequest, BuildItineraryResponse, ItineraryBlockResponse, VenueResponse
from app.services.itinerary import ItineraryService

router = APIRouter(prefix="/itinerary", tags=["itinerary"])


def _venue_to_response(venue: Venue) -> VenueResponse:
    return VenueResponse(
        place_id=venue.place_id,
        name=venue.name,
        address=venue.address,
        phone=venue.phone,
        latitude=venue.latitude,
        longitude=venue.longitude,
        rating=venue.rating,
        price_level=venue.price_level.value if venue.price_level else None,
        photo_url=venue.photo_url,
        website=venue.website,
        editorial_summary=venue.editorial_summary,
        composite_score=venue.composite_score,
        youtube_url=venue.youtube_url,
    )


@router.post("/build/stream")
async def build_itinerary_stream(request: BuildItineraryRequest) -> StreamingResponse:
    """
    Streaming version of /build. Returns Server-Sent Events.
    Each event has an 'event' field and a JSON 'data' payload.

    Events emitted (in order):
      planning        — LLM started generating skeleton
      skeleton_ready  — skeleton complete, date + meetup_point resolved
      geocoding       — resolving meetup point to coordinates
      searching_block — Places API call started for a block (one per block)
      block_ready     — candidates found for a block (one per block)
      complete        — full itinerary in data.itinerary
      error           — something failed, data.message has reason

    Frontend usage (fetch + ReadableStream):
      const res = await fetch('/api/v1/itinerary/build/stream', { method: 'POST', body: ... })
      const reader = res.body.getReader()
    """
    http_client = httpx.AsyncClient(timeout=120.0)
    service = ItineraryService(http_client)

    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            async for chunk in service.build_stream(request.group_id, request.profiles):
                yield chunk
        finally:
            await http_client.aclose()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disables nginx buffering so events arrive immediately
        },
    )


@router.post("/build", response_model=BuildItineraryResponse)
async def build_itinerary(request: BuildItineraryRequest) -> BuildItineraryResponse:
    async with httpx.AsyncClient(timeout=30.0) as client:
        service = ItineraryService(client)
        try:
            itinerary = await service.build(
                group_id=request.group_id,
                profiles=request.profiles,
            )
        except ItineraryBuildError as e:
            logger.error("itinerary.build.failed", error=str(e))
            raise HTTPException(status_code=422, detail=str(e))
        except PlacesAPIError as e:
            logger.error("places.api.failed", error=str(e))
            raise HTTPException(status_code=502, detail="Google Places API error.")

    return BuildItineraryResponse(
        group_id=itinerary.group_id,
        date=itinerary.date,
        meetup_point=itinerary.meetup_point,
        blocks=[
            ItineraryBlockResponse(
                label=block.label,
                activity_type=block.skeleton.activity_type.value,
                start_time=block.skeleton.start_time.isoformat(),
                end_time=block.skeleton.end_time.isoformat(),
                candidates=[_venue_to_response(v) for v in block.candidates],
                confirmed_venue=_venue_to_response(block.confirmed_venue) if block.confirmed_venue else None,
                booking_status=block.booking_status,
            )
            for block in itinerary.blocks
        ],
    )
