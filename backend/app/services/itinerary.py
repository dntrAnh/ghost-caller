import json
from collections.abc import AsyncGenerator
import httpx
from app.agents.coordinator import CoordinatorAgent
from app.core.exceptions import ItineraryBuildError
from app.core.logging import logger
from app.models.itinerary import Itinerary, ItineraryBlock
from app.models.user import UserProfile
from app.services.places import PlacesService
from app.services.scorer import VenueScorer
# from app.services.youtube import YouTubeService  # disabled — re-enable when quota is available


def _sse(event: str, data: dict) -> str:
    """Format a dict as a Server-Sent Event string."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


class ItineraryService:
    """
    Orchestrates the full itinerary build pipeline:
    1. Coordinator agent → skeleton blocks
    2. Places API → raw candidates per block
    3. Scorer → filtered + ranked candidates
    # 4. YouTube → enrich top-N candidates with Shorts URLs (disabled)
    """

    TOP_N_CANDIDATES = 3

    def __init__(self, http_client: httpx.AsyncClient) -> None:
        self._coordinator = CoordinatorAgent()
        self._places = PlacesService(http_client)
        self._scorer = VenueScorer()
        # self._youtube = YouTubeService(http_client)  # disabled

    async def build(self, group_id: str, profiles: list[UserProfile]) -> Itinerary:
        """Non-streaming build — returns completed Itinerary."""
        log = logger.bind(group_id=group_id)
        log.info("itinerary.build.start")

        plan = await self._coordinator.plan(profiles)
        if not plan.blocks:
            raise ItineraryBuildError("Coordinator returned an empty itinerary skeleton.")
        log.info("coordinator.plan.resolved", date=plan.date, meetup_point=plan.meetup_point)

        coords = await self._places.geocode(plan.meetup_point)
        if coords:
            for block in plan.blocks:
                block.anchor_lat, block.anchor_lng = coords

        resolved_blocks: list[ItineraryBlock] = []
        for block in plan.blocks:
            raw_venues = await self._places.text_search(block, max_results=10)
            ranked = self._scorer.filter_and_rank(raw_venues, block)
            top_candidates = ranked[: self.TOP_N_CANDIDATES]

            # YouTube enrichment disabled — uncomment when quota is available
            # top_candidates = await self._youtube.enrich_candidates(
            #     top_candidates, plan.meetup_point
            # )

            resolved_blocks.append(
                ItineraryBlock(
                    label=block.label,
                    activity_type=block.activity_type.value,
                    start_time=block.start_time,
                    end_time=block.end_time,
                    skeleton=block,
                    candidates=top_candidates,
                )
            )

        log.info("itinerary.build.complete", blocks=len(resolved_blocks))
        return Itinerary(
            group_id=group_id,
            date=plan.date,
            meetup_point=plan.meetup_point,
            blocks=resolved_blocks,
        )

    async def build_stream(
        self, group_id: str, profiles: list[UserProfile]
    ) -> AsyncGenerator[str, None]:
        """
        Streaming build — yields SSE-formatted strings as each stage completes.
        Final event is 'complete' carrying the full serialized itinerary.
        """
        log = logger.bind(group_id=group_id)

        try:
            # Stage 1: LLM planning
            yield _sse("planning", {"message": "Planning your day...", "step": 1, "total_steps": 3})

            plan = await self._coordinator.plan(profiles)
            if not plan.blocks:
                yield _sse("error", {"message": "Could not generate an itinerary skeleton."})
                return

            yield _sse("skeleton_ready", {
                "message": f"Planned {len(plan.blocks)} activities for {plan.date}",
                "date": plan.date,
                "meetup_point": plan.meetup_point,
                "block_count": len(plan.blocks),
                "step": 1,
                "total_steps": 3,
            })

            # Stage 2: Geocoding
            yield _sse("geocoding", {
                "message": f"Locating {plan.meetup_point}...",
                "step": 2,
                "total_steps": 3,
            })

            coords = await self._places.geocode(plan.meetup_point)
            if coords:
                for block in plan.blocks:
                    block.anchor_lat, block.anchor_lng = coords

            # Stage 3: Per-block venue search
            total_blocks = len(plan.blocks)
            resolved_blocks: list[ItineraryBlock] = []

            for i, block in enumerate(plan.blocks):
                yield _sse("searching_block", {
                    "message": f"Finding options for {block.label}...",
                    "label": block.label,
                    "activity_type": block.activity_type.value,
                    "block_index": i,
                    "block_total": total_blocks,
                    "step": 3,
                    "total_steps": 3,
                })

                raw_venues = await self._places.text_search(block, max_results=10)
                ranked = self._scorer.filter_and_rank(raw_venues, block)
                top_candidates = ranked[: self.TOP_N_CANDIDATES]

                # YouTube enrichment disabled — uncomment when quota is available
                # yield _sse("fetching_videos", {
                #     "message": f"Fetching videos for {block.label}...",
                #     "label": block.label,
                #     "block_index": i,
                #     "block_total": total_blocks,
                #     "step": 4,
                #     "total_steps": 4,
                # })
                # top_candidates = await self._youtube.enrich_candidates(
                #     top_candidates, plan.meetup_point
                # )

                resolved_block = ItineraryBlock(
                    label=block.label,
                    activity_type=block.activity_type.value,
                    start_time=block.start_time,
                    end_time=block.end_time,
                    skeleton=block,
                    candidates=top_candidates,
                )
                resolved_blocks.append(resolved_block)

                yield _sse("block_ready", {
                    "message": f"Found {len(top_candidates)} option(s) for {block.label}",
                    "label": block.label,
                    "activity_type": block.activity_type.value,
                    "candidates_found": len(top_candidates),
                    "block_index": i,
                    "block_total": total_blocks,
                })

            # Final: emit the complete itinerary
            itinerary = Itinerary(
                group_id=group_id,
                date=plan.date,
                meetup_point=plan.meetup_point,
                blocks=resolved_blocks,
            )
            log.info("itinerary.build.complete", blocks=len(resolved_blocks))

            yield _sse("complete", {
                "message": "Your itinerary is ready!",
                "itinerary": itinerary.model_dump(mode="json"),
            })

        except ItineraryBuildError as e:
            log.error("itinerary.build.failed", error=str(e))
            yield _sse("error", {"message": str(e)})
        except Exception as e:
            log.error("itinerary.build.unexpected_error", error=str(e))
            yield _sse("error", {"message": "An unexpected error occurred."})
