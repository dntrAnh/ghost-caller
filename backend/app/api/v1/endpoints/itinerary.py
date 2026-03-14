import httpx
from fastapi import APIRouter, HTTPException
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
        rating=venue.rating,
        composite_score=venue.composite_score,
        photo_url=venue.photo_url,
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
