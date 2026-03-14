from fastapi import APIRouter
from app.api.v1.endpoints import booking, itinerary, map_plan

router = APIRouter(prefix="/v1")

router.include_router(itinerary.router)
router.include_router(booking.router)
router.include_router(map_plan.router)