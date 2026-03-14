from fastapi import APIRouter, HTTPException

from app.schemas.map_plan import (
    BuildMapPlanRequest,
    BuildMapPlanResponse,
    ChooseMapPlanOptionRequest,
    ChooseMapPlanOptionResponse,
)
from app.services.map_plan import MapPlanService

router = APIRouter(prefix="/map-plan", tags=["map-plan"])

map_plan_service = MapPlanService()

@router.post("/build", response_model=BuildMapPlanResponse)
async def build_map_plan(request: BuildMapPlanRequest) -> BuildMapPlanResponse:
    """Return a mock interactive map plan for the frontend choice flow.

    Next round: swap this to build from real itinerary/place data.
    """
    return map_plan_service.build(group_id=request.group_id, profiles=request.profiles)


@router.post("/choose", response_model=ChooseMapPlanOptionResponse)
async def choose_map_plan_option(request: ChooseMapPlanOptionRequest) -> ChooseMapPlanOptionResponse:
    """Apply a choice on the current mock plan and return the next step.

    Next round: use persisted real plan state instead of mock step data.
    """
    try:
        return map_plan_service.choose(
            group_id=request.group_id,
            profiles=request.profiles,
            current_step=request.current_step,
            selected_option_id=request.selected_option_id,
            choices=request.choices,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc