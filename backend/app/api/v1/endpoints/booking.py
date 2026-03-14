from fastapi import APIRouter, WebSocket
from app.schemas.booking import BookingRequest, BookingResponse, BookingStreamMessage, CallStreamMessage
from app.services.booking import BookingService

router = APIRouter(prefix="/booking", tags=["booking"])

booking_service = BookingService()

@router.post("/start")
async def start_booking(request: BookingRequest) -> BookingResponse:
    """Start the booking process for a restaurant reservation"""
    return await booking_service.run_calling_pipeline(request)

@router.websocket("/stream")
async def booking_stream(websocket: WebSocket):
    """WebSocket for frontend event stream during booking"""
    await websocket.accept()
    try:
        # TODO: Implement real-time booking status updates
        await websocket.send_json({"type": "status", "message": "Booking process started"})
        # Keep connection open for updates
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
    except Exception as e:
        await websocket.close()

@router.websocket("/call_stream")
async def call_stream(websocket: WebSocket):
    """WebSocket for live audio speech during calls"""
    await websocket.accept()
    try:
        # TODO: Implement live audio streaming for STT/TTS
        await websocket.send_json({"type": "audio", "message": "Call stream started"})
        # Keep connection open for audio data
        while True:
            data = await websocket.receive_text()
            # Handle audio data
    except Exception as e:
        await websocket.close()