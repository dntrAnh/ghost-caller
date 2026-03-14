from fastapi import APIRouter
from app.api.v1.endpoints import itinerary, booking

router = APIRouter(prefix="/v1")
router.include_router(itinerary.router)
router.include_router(booking.router)
