from app.models.user import UserProfile


def build_coordinator_prompt(date: str, meetup_point: str, profiles: list[UserProfile]) -> str:
    hard_constraints = _extract_hard_constraints(profiles)
    soft_preferences = _extract_soft_preferences(profiles)
    all_vetoed = list({place for p in profiles for place in p.vetoed_places})
    availabilities = _extract_availability_window(profiles, date)

    return f"""
You are coordinating a group hangout for {len(profiles)} people in {meetup_point} on {date}.

HARD CONSTRAINTS (must be satisfied — eliminate any block that cannot meet these):
{hard_constraints}

SOFT PREFERENCES (optimize for — score and rank candidates against these):
{soft_preferences}

GROUP AVAILABILITY WINDOW: {availabilities}
MEETUP POINT: {meetup_point}
EXCLUDED PLACES (vetoed by one or more members): {", ".join(all_vetoed) if all_vetoed else "None"}

Build a full-day itinerary skeleton. For each time block, return a structured query job — not a specific venue.
The itinerary should:
1. Satisfy all hard constraints for every block
2. Respect the group's availability window
3. Sequence activities to minimize travel between stops
4. Include at least one restaurant block suitable for a phone reservation

Return ONLY valid JSON in this exact structure:
{{
  "blocks": [
    {{
      "activity_type": "restaurant",
      "start_time": "2026-09-12T19:00:00",
      "end_time": "2026-09-12T21:00:00",
      "keywords": ["cozy", "lively"],
      "cuisine": ["Italian"],
      "vibes": ["rooftop", "romantic"],
      "dietary_restrictions": ["vegan", "gluten-free"],
      "excluded_place_ids": [],
      "preference_weights": {{
        "rating": 0.3,
        "photo_spots": 0.4,
        "transit": 0.2,
        "vibes": 0.1
      }},
      "anchor_description": "Williamsburg, Brooklyn",
      "price_level": "mid",
      "relaxation_order": ["vibes", "cuisine", "photo_spots"]
    }}
  ]
}}
""".strip()


def _extract_hard_constraints(profiles: list[UserProfile]) -> str:
    lines = []
    for p in profiles:
        if p.dietary_restrictions:
            lines.append(f"- {p.name}: {', '.join(p.dietary_restrictions)}")
    return "\n".join(lines) if lines else "None"


def _extract_soft_preferences(profiles: list[UserProfile]) -> str:
    lines = []
    for p in profiles:
        prefs = []
        if p.cuisines_loved:
            prefs.append(f"loves {', '.join(p.cuisines_loved)}")
        if p.vibes:
            prefs.append(f"vibes: {', '.join(p.vibes)}")
        if p.photo_spots:
            prefs.append("wants photogenic spots")
        if p.preferred_meal_times:
            times = ", ".join(f"{k} {v}" for k, v in p.preferred_meal_times.items())
            prefs.append(f"prefers {times}")
        if prefs:
            lines.append(f"- {p.name}: {'; '.join(prefs)}")
    return "\n".join(lines) if lines else "None"


def _extract_availability_window(profiles: list[UserProfile], date: str) -> str:
    # All profiles must be available on the requested date
    # For now return the date and note full-day availability
    return f"All members available on {date}"
