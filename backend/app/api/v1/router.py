from fastapi import APIRouter
from app.api.v1.endpoints import auth, booking, itinerary, map_plan, users
from app.api.v1.endpoints import call

router = APIRouter(prefix="/v1")

router.include_router(auth.router)
router.include_router(users.router)
router.include_router(itinerary.router)
router.include_router(booking.router)
router.include_router(call.router)
router.include_router(map_plan.router)