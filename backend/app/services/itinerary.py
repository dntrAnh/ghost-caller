import httpx
from app.agents.coordinator import CoordinatorAgent
from app.core.exceptions import ItineraryBuildError
from app.core.logging import logger
from app.models.itinerary import Itinerary, ItineraryBlock
from app.models.user import UserProfile
from app.services.places import PlacesService
from app.services.scorer import VenueScorer


class ItineraryService:
    """
    Orchestrates the full itinerary build pipeline:
    1. Coordinator agent → skeleton blocks
    2. Places API → raw candidates per block
    3. Scorer → filtered + ranked candidates
    """

    TOP_N_CANDIDATES = 3

    def __init__(self, http_client: httpx.AsyncClient) -> None:
        self._coordinator = CoordinatorAgent()
        self._places = PlacesService(http_client)
        self._scorer = VenueScorer()

    async def build(self, group_id: str, profiles: list[UserProfile]) -> str:
        log = logger.bind(group_id=group_id)
        log.info("itinerary.build.start")

        # Step 1: LLM figures out date, meetup point, and skeleton blocks
        plan = await self._coordinator.plan(profiles)

        if not plan.blocks:
            raise ItineraryBuildError("Coordinator returned an empty itinerary skeleton.")

        for plan_block in plan.blocks:
            print("--------------------------------")
            print(plan_block)
            print("--------------------------------")
        log.info("coordinator.plan.resolved", date=plan.date, meetup_point=plan.meetup_point)
        return "Success"

        # Step 2 + 3: For each block, query Places and score
        # resolved_blocks: list[ItineraryBlock] = []
        # for block in plan.blocks:
        #     raw_venues = await self._places.text_search(block, max_results=10)
        #     ranked = self._scorer.filter_and_rank(raw_venues, block)
        #     top_candidates = ranked[: self.TOP_N_CANDIDATES]

        #     log.info(
        #         "itinerary.block.resolved",
        #         activity_type=block.activity_type,
        #         candidates=len(top_candidates),
        #     )

        #     resolved_blocks.append(
        #         ItineraryBlock(
        #             skeleton=block,
        #             candidates=top_candidates,
        #         )
        #     )

        # log.info("itinerary.build.complete", blocks=len(resolved_blocks))
        # return Itinerary(
        #     group_id=group_id,
        #     date=plan.date,
        #     meetup_point=plan.meetup_point,
        #     blocks=resolved_blocks,
        # )
