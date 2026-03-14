from supabase import AsyncClient, acreate_client
from app.core.config import settings

_client: AsyncClient | None = None


async def get_supabase_client() -> AsyncClient:
    """Returns a singleton Supabase async client."""
    global _client
    if _client is None:
        _client = await acreate_client(settings.supabase_url, settings.supabase_anon_key)
    return _client
