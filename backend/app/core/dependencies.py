import httpx
from functools import lru_cache
from typing import Annotated
from fastapi import Depends
from app.core.config import Settings, settings


@lru_cache
def get_settings() -> Settings:
    return settings


def get_http_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=30.0)


SettingsDep = Annotated[Settings, Depends(get_settings)]
