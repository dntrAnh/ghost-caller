from datetime import datetime, timedelta
from uuid import uuid4

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from icalendar import Calendar, Event, vCalAddress, vText

from app.core.config import settings
from app.core.logging import logger
from app.models.call import CalendarInvite, InviteAttendee
from app.schemas.call import GenerateICSRequest, SendInvitesRequest

router = APIRouter(tags=["calendar"])

_calendar_invites: dict[str, CalendarInvite] = {}


def _parse_start_datetime(date_value: str, time_value: str) -> datetime:
    normalized = time_value.strip().upper()
    formats = ["%Y-%m-%d %I:%M %p", "%Y-%m-%d %H:%M", "%Y-%m-%d %I %p"]
    for fmt in formats:
        try:
            return datetime.strptime(f"{date_value} {normalized}", fmt)
        except ValueError:
            continue
    raise HTTPException(status_code=400, detail="Invalid confirmed_date/confirmed_time format")


def _build_ics_calendar(request: GenerateICSRequest, confirmation_code: str) -> str:
    cal = Calendar()
    cal.add("prodid", "-//Ghost Caller//Reservation Invite//EN")
    cal.add("version", "2.0")
    cal.add("method", "REQUEST")

    event = Event()
    start_dt = _parse_start_datetime(request.confirmed_date, request.confirmed_time)
    end_dt = start_dt + timedelta(hours=2)

    organizer_name = request.attendees[0].name if request.attendees else "Ghost Caller"
    organizer_email = request.attendees[0].email if request.attendees else "noreply@ghostcaller.local"

    organizer = vCalAddress(f"MAILTO:{organizer_email}")
    organizer.params["cn"] = vText(organizer_name)
    organizer.params["role"] = vText("CHAIR")

    event.add("uid", f"{request.call_id}@ghost-caller")
    event.add("dtstamp", datetime.utcnow())
    event.add("dtstart", start_dt)
    event.add("dtend", end_dt)
    event.add("summary", f"Dinner at {request.restaurant_name}")
    event.add("location", request.restaurant_address)
    event.add("organizer", organizer)
    event.add("status", "CONFIRMED")

    description = (
        f"Reservation details\\n"
        f"Party size: {len(request.attendees) if request.attendees else 'N/A'}\\n"
        f"Dietary notes: {request.dietary_notes or 'None'}\\n"
        f"Confirmation code: {confirmation_code}\\n"
        f"Restaurant phone: {request.restaurant_phone}"
    )
    event.add("description", description)

    for attendee in request.attendees:
        attendee_addr = vCalAddress(f"MAILTO:{attendee.email}")
        attendee_addr.params["cn"] = vText(attendee.name)
        attendee_addr.params["role"] = vText("REQ-PARTICIPANT")
        attendee_addr.params["partstat"] = vText("NEEDS-ACTION")
        attendee_addr.params["rsvp"] = vText("TRUE")
        event.add("attendee", attendee_addr, encode=0)

    cal.add_component(event)
    return cal.to_ical().decode("utf-8")


@router.post("/generate-ics")
async def generate_ics(request: GenerateICSRequest) -> dict:
    confirmation_code = f"CONF-{request.call_id[:8].upper()}"
    ics_content = _build_ics_calendar(request, confirmation_code)

    invite = CalendarInvite(
        id=str(uuid4()),
        call_record_id=request.call_id,
        attendees=[InviteAttendee(name=a.name, email=a.email) for a in request.attendees],
        ics_content=ics_content,
        sent=False,
        sent_at=None,
    )
    _calendar_invites[request.call_id] = invite

    logger.info(
        "calendar.generate_ics.complete",
        call_id=request.call_id,
        attendees=len(request.attendees),
    )

    return {
        "call_id": request.call_id,
        "invite_id": invite.id,
        "confirmation_code": confirmation_code,
        "ics_content": ics_content,
    }


@router.post("/send-invites")
async def send_invites(request: SendInvitesRequest) -> dict:
    if not settings.resend_api_key:
        raise HTTPException(status_code=400, detail="RESEND_API_KEY is not configured")

    subject = f"Dinner at {request.restaurant_name} — {request.confirmed_date} at {request.confirmed_time}"
    html_body = (
        f"<h2>Dinner Reservation Confirmed</h2>"
        f"<p><strong>Restaurant:</strong> {request.restaurant_name}</p>"
        f"<p><strong>Date:</strong> {request.confirmed_date}</p>"
        f"<p><strong>Time:</strong> {request.confirmed_time}</p>"
        f"<p>Attached is the calendar invite (.ics).</p>"
    )

    results: list[dict] = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attendee in request.attendees:
            payload = {
                "from": "Ghost Caller <onboarding@resend.dev>",
                "to": [attendee.email],
                "subject": subject,
                "html": html_body,
                "attachments": [
                    {
                        "filename": "reservation.ics",
                        "content": request.ics_content,
                    }
                ],
            }
            try:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {settings.resend_api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
                results.append({"name": attendee.name, "email": attendee.email, "success": True})
            except Exception as exc:
                logger.error("calendar.send_invite.failed", email=attendee.email, error=str(exc))
                results.append(
                    {
                        "name": attendee.name,
                        "email": attendee.email,
                        "success": False,
                        "error": str(exc),
                    }
                )

    successful = sum(1 for item in results if item["success"])
    logger.info("calendar.send_invites.complete", success_count=successful, total=len(results))
    return {
        "subject": subject,
        "results": results,
        "success_count": successful,
        "failure_count": len(results) - successful,
    }


@router.get("/{call_id}/download-ics")
async def download_ics(call_id: str) -> Response:
    invite = _calendar_invites.get(call_id)
    if invite is None:
        raise HTTPException(status_code=404, detail=f"No calendar invite found for call_id: {call_id}")

    return Response(
        content=invite.ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="reservation-{call_id}.ics"',
        },
    )