from pydantic import BaseModel, Field

from app.models.user import UserProfile

class MapStartVenueResponse(BaseModel):
    name: str
    address: str
    emoji: str
    x: int
    y: int


class MapOptionResponse(BaseModel):
    id: str
    name: str
    address: str
    score: int
    price: str
    walk: str | None = None
    transit: str | None = None
    vibes: list[str] = Field(default_factory=list)
    dietary: str | None = None
    why: str
    color: str
    x: int
    y: int
    ghost: bool = False
    photos: list[str] = Field(default_factory=list)
    reels: list[str] = Field(default_factory=list)


class MapPlanStepResponse(BaseModel):
    step: int
    time: str
    label: str
    type: str
    venue: MapStartVenueResponse | None = None
    options: list[MapOptionResponse] = Field(default_factory=list)


class BuildMapPlanRequest(BaseModel):
    group_id: str
    profiles: list[UserProfile]


class BuildMapPlanResponse(BaseModel):
    group_id: str
    group: list[str]
    neighborhood: str
    steps: list[MapPlanStepResponse]


class ChooseMapPlanOptionRequest(BaseModel):
    group_id: str
    profiles: list[UserProfile]
    current_step: int
    selected_option_id: str
    choices: dict[str, str] = Field(default_factory=dict)


class ChooseMapPlanOptionResponse(BaseModel):
    group_id: str
    choices: dict[str, str]
    selected_step: int
    selected_option: MapOptionResponse
    next_step: MapPlanStepResponse | None = None
    final_steps: list[MapPlanStepResponse] = Field(default_factory=list)
    completed: bool = False