from app.models.user import UserProfile
from app.schemas.map_plan import (
    BuildMapPlanResponse,
    ChooseMapPlanOptionResponse,
    MapOptionResponse,
    MapPlanStepResponse,
    MapStartVenueResponse,
)

class MapPlanService:
    """Returns a mock interactive map plan without depending on itinerary resolution.

    Next round: replace mock step generation with real candidates derived from
    itinerary scoring and place resolution.
    """

    def build(self, group_id: str, profiles: list[UserProfile]) -> BuildMapPlanResponse:
        # Mock-first response used by the frontend map workflow during prototyping.
        group_names = [profile.name for profile in profiles] or ["Alex", "Maya", "Jordan", "Sam"]
        neighborhood = self._derive_neighborhood(profiles)
        steps = self._build_mock_steps()

        return BuildMapPlanResponse(
            group_id=group_id,
            group=group_names,
            neighborhood=neighborhood,
            steps=steps,
        )

    def choose(
        self,
        group_id: str,
        profiles: list[UserProfile],
        current_step: int,
        selected_option_id: str,
        choices: dict[str, str],
    ) -> ChooseMapPlanOptionResponse:
        # Selection state is currently applied over the same mock step graph.
        # Next round this should operate on persisted real plan state.
        plan = self.build(group_id=group_id, profiles=profiles)
        steps = plan.steps

        if current_step <= 0 or current_step >= len(steps):
            raise ValueError(f"Invalid current_step: {current_step}")

        step = steps[current_step]
        selected_option = next((option for option in step.options if option.id == selected_option_id), None)
        if selected_option is None:
            raise ValueError(f"Option {selected_option_id} does not exist for step {current_step}")

        updated_choices = dict(choices)
        updated_choices[str(current_step)] = selected_option_id

        next_step = steps[current_step + 1] if current_step + 1 < len(steps) else None
        completed = next_step is None

        final_steps: list[MapPlanStepResponse] = []
        if completed:
            for index, candidate_step in enumerate(steps):
                if candidate_step.type == "start":
                    final_steps.append(candidate_step)
                    continue

                chosen_id = updated_choices.get(str(index))
                chosen_option = next(
                    (option for option in candidate_step.options if option.id == chosen_id),
                    None,
                )
                final_steps.append(
                    MapPlanStepResponse(
                        step=candidate_step.step,
                        time=candidate_step.time,
                        end_time=candidate_step.end_time,
                        label=candidate_step.label,
                        type=candidate_step.type,
                        options=[chosen_option] if chosen_option else [],
                    )
                )

        return ChooseMapPlanOptionResponse(
            group_id=group_id,
            choices=updated_choices,
            selected_step=current_step,
            selected_option=selected_option,
            next_step=next_step,
            final_steps=final_steps,
            completed=completed,
        )

    def _build_mock_steps(self) -> list[MapPlanStepResponse]:
        # Temporary static map options for UI iteration.
        # Replace with dynamic options from real backend data in the next phase.
        return [
            MapPlanStepResponse(
                step=0,
                time="10:00 AM",
                end_time="10:30 AM",
                label="Starting point",
                type="start",
                venue=MapStartVenueResponse(
                    name="Hotel Le Jolie",
                    address="235 Meeker Ave, Williamsburg",
                    emoji="📍",
                    x=48,
                    y=52,
                ),
            ),
            MapPlanStepResponse(
                step=1,
                time="10:30 AM",
                end_time="12:30 PM",
                label="Morning coffee",
                type="choice",
                options=[
                    MapOptionResponse(
                        id="a1",
                        name="Partners Coffee",
                        address="136 Baxter St",
                        score=94,
                        price="$",
                        walk="8 min walk",
                        vibes=["cozy", "quiet"],
                        dietary="vegan ✓",
                        why="Highest cozy score, vegan-friendly for Maya",
                        color="#6366f1",
                        x=38,
                        y=42,
                        photos=[
                            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80",
                            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
                            "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80",
                        ],
                        reels=["Barista art", "Morning rush", "Cozy corner"],
                    ),
                    MapOptionResponse(
                        id="a2",
                        name="Blue Bottle Coffee",
                        address="76 N 4th St",
                        score=87,
                        price="$",
                        walk="12 min walk",
                        vibes=["lively", "photogenic"],
                        dietary="vegan ✓",
                        why="Photogenic interior, Jordan's top pick",
                        color="#8b5cf6",
                        x=55,
                        y=36,
                        photos=[
                            "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&q=80",
                            "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=400&q=80",
                            "https://images.unsplash.com/photo-1459755486867-b55449bb39ff?w=400&q=80",
                        ],
                        reels=["Morning vibes", "Interior tour", "Latte art"],
                    ),
                    MapOptionResponse(
                        id="a3",
                        name="Devoción",
                        address="69 Grand St",
                        score=81,
                        price="$$",
                        transit="3 min L train",
                        vibes=["rooftop", "unique"],
                        dietary="limited vegan",
                        why="Rooftop greenhouse — most unique experience",
                        color="#a855f7",
                        x=66,
                        y=44,
                        photos=[
                            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80",
                            "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=400&q=80",
                            "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&q=80",
                        ],
                        reels=["Greenhouse garden", "Pour-over ritual", "Rooftop view"],
                    ),
                ],
            ),
            MapPlanStepResponse(
                step=2,
                time="12:30 PM",
                end_time="7:00 PM",
                label="Midday activity",
                type="choice",
                options=[
                    MapOptionResponse(
                        id="b1",
                        name="The High Line",
                        address="Gansevoort St entrance",
                        score=91,
                        price="Free",
                        walk="18 min walk",
                        transit="8 min L train",
                        vibes=["outdoor", "photogenic"],
                        why="Outdoor, photogenic, all vibes match",
                        color="#10b981",
                        x=28,
                        y=30,
                        photos=[
                            "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80",
                            "https://images.unsplash.com/photo-1490100667990-4951b1f4b0c8?w=400&q=80",
                            "https://images.unsplash.com/photo-1541336032412-2048a678540d?w=400&q=80",
                        ],
                        reels=["Sunset walk", "Garden overlook", "Street art"],
                    ),
                    MapOptionResponse(
                        id="b2",
                        name="Chelsea Market",
                        address="75 9th Ave",
                        score=88,
                        price="$",
                        transit="12 min L train",
                        vibes=["lively", "foodie"],
                        dietary="all diets ✓",
                        why="Indoor, all dietary needs covered",
                        color="#f97316",
                        x=22,
                        y=40,
                        photos=[
                            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
                            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
                            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
                        ],
                        reels=["Food hall tour", "Vendor spotlight", "Lunch rush"],
                    ),
                    MapOptionResponse(
                        id="b3",
                        name="Brooklyn Museum",
                        address="200 Eastern Pkwy",
                        score=83,
                        price="$",
                        transit="15 min 2/3 train",
                        vibes=["cultural", "quiet"],
                        why="Cultural, quiet, great for Maya + Sam",
                        color="#0ea5e9",
                        x=72,
                        y=62,
                        photos=[
                            "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&q=80",
                            "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80",
                            "https://images.unsplash.com/photo-1594843351930-0d4d1c40b5c8?w=400&q=80",
                        ],
                        reels=["Gallery walk", "Rodin collection", "Courtyard"],
                    ),
                ],
            ),
            MapPlanStepResponse(
                step=3,
                time="7:00 PM",
                end_time="8:30 PM",
                label="Dinner — Ghost Caller books this",
                type="choice",
                options=[
                    MapOptionResponse(
                        id="c1",
                        name="Via Carota",
                        address="51 Grove St",
                        score=96,
                        price="$$$",
                        transit="20 min L train",
                        vibes=["cozy", "romantic"],
                        dietary="vegan + GF ✓",
                        why="Top group score across all 4 profiles",
                        color="#f97316",
                        ghost=True,
                        x=20,
                        y=58,
                        photos=[
                            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
                            "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80",
                            "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=400&q=80",
                        ],
                        reels=["Pasta station", "Ambiance tour", "Chef's special"],
                    ),
                    MapOptionResponse(
                        id="c2",
                        name="Laser Wolf",
                        address="97 Wythe Ave",
                        score=91,
                        price="$$$",
                        walk="8 min walk",
                        vibes=["rooftop", "lively"],
                        dietary="vegan ✓",
                        why="Rooftop, walkable from most afternoon stops",
                        color="#ec4899",
                        ghost=True,
                        x=56,
                        y=26,
                        photos=[
                            "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
                            "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&q=80",
                            "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&q=80",
                        ],
                        reels=["Rooftop view", "Grill action", "NYC skyline"],
                    ),
                    MapOptionResponse(
                        id="c3",
                        name="Olmsted",
                        address="659 Vanderbilt Ave",
                        score=88,
                        price="$$$",
                        transit="18 min G train",
                        vibes=["garden", "intimate"],
                        dietary="vegetarian-forward ✓",
                        why="Garden terrace, intimate setting, creative menu",
                        color="#10b981",
                        ghost=True,
                        x=78,
                        y=68,
                        photos=[
                            "https://images.unsplash.com/photo-1428515613728-6b4607e44363?w=400&q=80",
                            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
                            "https://images.unsplash.com/photo-1484659619207-9165d119dafe?w=400&q=80",
                        ],
                        reels=["Garden terrace", "Chef's table", "Garden harvest"],
                    ),
                ],
            ),
        ]
        return steps

    def _derive_neighborhood(self, profiles: list[UserProfile]) -> str:
        for profile in profiles:
            if profile.neighborhood:
                return profile.neighborhood
        return "Williamsburg, Brooklyn"