from supabase import AsyncClient
from app.core.logging import logger


class DatabaseService:
    """
    Handles all database operations against public.users and public.itineraries
    via the Supabase async client.
    """

    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    # -------------------------------------------------------------------------
    # Users
    # -------------------------------------------------------------------------

    async def get_user(self, user_id: str) -> dict | None:
        """Fetch a user row by their UUID."""
        result = (
            await self._client.table("users")
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        return result.data

    async def create_user(self, user_id: str, name: str, email: str) -> dict:
        """
        Explicitly create a public.users row.
        Called from the email register endpoint — the DB trigger handles Google OAuth.
        """
        result = (
            await self._client.table("users")
            .insert({
                "id": user_id,
                "name": name,
                "email": email,
                "phone": None,
                "preferences": {},
            })
            .execute()
        )
        logger.info("db.user.created", user_id=user_id, email=email)
        return result.data[0]

    async def update_user(self, user_id: str, updates: dict) -> dict:
        """
        Update a user row. Handles two cases:
        - Top-level fields (name, phone, email): passed directly
        - Preferences: merged into the existing JSONB column via Postgres jsonb concatenation
        """
        preferences = updates.pop("preferences", None)

        # Update top-level columns if any
        if updates:
            await (
                self._client.table("users")
                .update(updates)
                .eq("id", user_id)
                .execute()
            )

        # Merge preferences JSONB
        if preferences:
            # Use Supabase rpc for a safe merge (won't clobber untouched keys)
            await self._client.rpc(
                "merge_user_preferences",
                {"uid": user_id, "new_prefs": preferences},
            ).execute()

        result = (
            await self._client.table("users")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        logger.info("db.user.updated", user_id=user_id)
        return result.data

    # -------------------------------------------------------------------------
    # Itineraries
    # -------------------------------------------------------------------------

    async def save_itinerary(
        self,
        group_id: str,
        meetup_point: str,
        date: str,
        blocks: list[dict],
        member_snapshots: list[dict],  # [{"user_id", "profile_snapshot", "availability", "neighborhood"}]
    ) -> str:
        """
        Saves an itinerary + all member join rows in two steps.
        Returns the new itinerary UUID.
        """
        # Insert itinerary
        result = (
            await self._client.table("itineraries")
            .insert({
                "group_id": group_id,
                "meetup_point": meetup_point,
                "date": date,
                "blocks": blocks,
            })
            .execute()
        )
        itinerary_id: str = result.data[0]["id"]

        # Insert member rows
        member_rows = [
            {
                "itinerary_id": itinerary_id,
                "user_id": m["user_id"],
                "profile_snapshot": m["profile_snapshot"],
                "availability": m.get("availability", []),
                "neighborhood": m.get("neighborhood", ""),
            }
            for m in member_snapshots
        ]
        await self._client.table("itinerary_members").insert(member_rows).execute()

        logger.info("db.itinerary.saved", itinerary_id=itinerary_id, group_id=group_id)
        return itinerary_id

    async def get_user_itineraries(self, user_id: str) -> list[dict]:
        """Fetch all itineraries a user is a member of, newest first."""
        result = (
            await self._client.table("itineraries")
            .select("*, itinerary_members!inner(user_id)")
            .eq("itinerary_members.user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    async def get_itinerary(self, itinerary_id: str) -> dict | None:
        """Fetch a single itinerary with all member snapshots."""
        result = (
            await self._client.table("itineraries")
            .select("*, itinerary_members(user_id, profile_snapshot, neighborhood, availability)")
            .eq("id", itinerary_id)
            .maybe_single()
            .execute()
        )
        return result.data
