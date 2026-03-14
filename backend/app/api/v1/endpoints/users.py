from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.auth import CurrentUser
from app.core.supabase import get_supabase_client
from app.core.logging import logger
from app.services.database import DatabaseService

router = APIRouter(prefix="/users", tags=["users"])


class PreferencesUpdate(BaseModel):
    """All fields are optional — send only what changed."""
    name: str | None = None
    phone: str | None = None
    cuisines_loved: list[str] | None = None
    cuisines_avoided: list[str] | None = None
    dietary_restrictions: list[str] | None = None
    price_range: str | None = None
    preferred_meal_times: dict[str, str] | None = None
    buffer_mins: int | None = None
    flexibility_mins: int | None = None
    transport_mode: str | None = None
    max_travel_mins: int | None = None
    vibes: list[str] | None = None
    photo_spots: bool | None = None
    vetoed_places: list[str] | None = None


@router.get("/me")
async def get_me(user_id: CurrentUser) -> dict:
    """Returns the current user's full profile."""
    supabase = await get_supabase_client()
    db = DatabaseService(supabase)

    user = await db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return user


@router.patch("/me")
async def update_me(body: PreferencesUpdate, user_id: CurrentUser) -> dict:
    """
    Updates the current user's profile.
    Top-level fields (name, phone) are updated as columns.
    Everything else is merged into the preferences JSONB.
    """
    supabase = await get_supabase_client()
    db = DatabaseService(supabase)

    updates: dict = {}
    preferences: dict = {}

    # Split into top-level columns vs preferences JSONB
    if body.name is not None:
        updates["name"] = body.name
    if body.phone is not None:
        updates["phone"] = body.phone

    pref_fields = [
        "cuisines_loved", "cuisines_avoided", "dietary_restrictions",
        "price_range", "preferred_meal_times", "buffer_mins",
        "flexibility_mins", "transport_mode", "max_travel_mins",
        "vibes", "photo_spots", "vetoed_places",
    ]
    for field in pref_fields:
        value = getattr(body, field)
        if value is not None:
            preferences[field] = value

    if preferences:
        updates["preferences"] = preferences

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    updated = await db.update_user(user_id, updates)
    logger.info("users.me.updated", user_id=user_id)
    return updated


@router.get("/me/itineraries")
async def get_my_itineraries(user_id: CurrentUser) -> list[dict]:
    """Returns all itineraries the current user is a member of."""
    supabase = await get_supabase_client()
    db = DatabaseService(supabase)
    return await db.get_user_itineraries(user_id)
