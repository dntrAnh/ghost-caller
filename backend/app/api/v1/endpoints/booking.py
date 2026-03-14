from fastapi import APIRouter

router = APIRouter(prefix="/booking", tags=["booking"])


@router.post("/call")
async def trigger_booking_call() -> dict:
    # Placeholder — Ghost Caller phone booking agent goes here
    return {"status": "not_implemented"}
