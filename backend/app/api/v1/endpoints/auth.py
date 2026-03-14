from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.core.supabase import get_supabase_client
from app.core.logging import logger
from app.services.database import DatabaseService

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_id: str
    name: str
    email: str


@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest) -> AuthResponse:
    """
    Email + password registration.
    1. Creates the Supabase auth user (auth.users)
    2. Explicitly creates the public.users row with name + email
       (the DB trigger also fires but we handle it manually to capture name)
    """
    supabase = await get_supabase_client()

    # 1. Create auth user — passes name as metadata so the trigger can use it too
    try:
        auth_response = await supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {
                "data": {"full_name": body.name}
            },
        })
    except Exception as e:
        logger.error("auth.register.failed", email=body.email, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))

    if not auth_response.user:
        raise HTTPException(status_code=400, detail="Registration failed.")

    user_id = auth_response.user.id

    # 2. Upsert public.users row (trigger may have already created it)
    db = DatabaseService(supabase)
    try:
        await supabase.table("users").upsert({
            "id": user_id,
            "name": body.name,
            "email": body.email,
            "phone": None,
            "preferences": {},
        }).execute()
    except Exception as e:
        logger.error("auth.register.db_insert_failed", user_id=user_id, error=str(e))
        # Don't block — auth user was created, profile can be fixed later
        pass

    session = auth_response.session
    if not session:
        raise HTTPException(
            status_code=201,
            detail="Registered. Please confirm your email before logging in."
        )

    logger.info("auth.register.success", user_id=user_id, email=body.email)
    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        user_id=user_id,
        name=body.name,
        email=body.email,
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest) -> AuthResponse:
    """Email + password login. Returns JWT access token."""
    supabase = await get_supabase_client()

    try:
        auth_response = await supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
    except Exception as e:
        logger.warning("auth.login.failed", email=body.email, error=str(e))
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not auth_response.user or not auth_response.session:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_id = auth_response.user.id

    # Fetch name from public.users
    result = await supabase.table("users").select("name, email").eq("id", user_id).maybe_single().execute()
    name = result.data["name"] if result.data else auth_response.user.email or ""
    email = result.data["email"] if result.data else auth_response.user.email or ""

    logger.info("auth.login.success", user_id=user_id)
    return AuthResponse(
        access_token=auth_response.session.access_token,
        refresh_token=auth_response.session.refresh_token,
        user_id=user_id,
        name=name,
        email=email,
    )
