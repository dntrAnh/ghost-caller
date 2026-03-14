import jwt
from fastapi import Depends, HTTPException, Header
from typing import Annotated
from app.core.config import settings


async def get_current_user_id(authorization: str = Header(...)) -> str:
    """
    FastAPI dependency — extracts and verifies the Supabase JWT from the
    Authorization header.

    Usage:
        @router.get("/protected")
        async def protected(user_id: str = Depends(get_current_user_id)):
            ...

    Returns:
        The authenticated user's UUID (matches public.users.id)

    Raises:
        401 if the token is missing, expired, or invalid.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format.")

    token = authorization.removeprefix("Bearer ")

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase JWTs don't use audience claim
        )
        user_id: str = payload["sub"]
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")


# Convenience type alias for use in endpoint signatures
CurrentUser = Annotated[str, Depends(get_current_user_id)]
