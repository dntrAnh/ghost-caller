import json
import anthropic
from app.core.config import settings
from app.core.exceptions import ItineraryBuildError
from app.core.logging import logger
from app.models.itinerary import ActivityType, PriceLevel, SkeletonBlock
from app.models.user import UserProfile
from app.utils.prompt_builder import build_coordinator_prompt


class CoordinatorAgent:
    """
    Uses Claude to produce a structured skeleton itinerary from group profiles.
    Returns a list of SkeletonBlock — each is a parameterized query job,
    not a specific venue recommendation.
    """

    def __init__(self) -> None:
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def plan(
        self,
        date: str,
        meetup_point: str,
        profiles: list[UserProfile],
    ) -> list[SkeletonBlock]:
        prompt = build_coordinator_prompt(date, meetup_point, profiles)

        log = logger.bind(date=date, meetup_point=meetup_point, group_size=len(profiles))
        log.info("coordinator.plan.start")

        message = await self._client.messages.create(
            model=settings.anthropic_model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = message.content[0].text
        log.info("coordinator.plan.response_received")

        return self._parse(raw)

    def _parse(self, raw: str) -> list[SkeletonBlock]:
        try:
            # Strip markdown code fences if present
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
            data = json.loads(cleaned.strip())
        except (json.JSONDecodeError, IndexError) as e:
            raise ItineraryBuildError(f"Coordinator returned invalid JSON: {e}") from e

        blocks = []
        for item in data.get("blocks", []):
            blocks.append(
                SkeletonBlock(
                    activity_type=ActivityType(item["activity_type"]),
                    start_time=item["start_time"],
                    end_time=item["end_time"],
                    keywords=item.get("keywords", []),
                    cuisine=item.get("cuisine", []),
                    vibes=item.get("vibes", []),
                    dietary_restrictions=item.get("dietary_restrictions", []),
                    excluded_place_ids=item.get("excluded_place_ids", []),
                    preference_weights=item.get("preference_weights", {}),
                    anchor_description=item.get("anchor_description", ""),
                    price_level=PriceLevel(item.get("price_level", "mid")),
                    relaxation_order=item.get("relaxation_order", []),
                )
            )

        return blocks
