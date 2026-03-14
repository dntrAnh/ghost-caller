from app.models.user import UserProfile


def build_coordinator_prompt(profiles: list[UserProfile]) -> str:
    hard_constraints = _extract_hard_constraints(profiles)
    soft_preferences = _extract_soft_preferences(profiles)
    all_vetoed = list({place for p in profiles for place in p.vetoed_places})
    availability_map = _extract_availability_map(profiles)
    neighborhoods = _extract_neighborhoods(profiles)
    timing = _extract_timing_constraints(profiles)

    return f"""
    You are coordinating a group hangout for {len(profiles)} people.

    YOUR FIRST JOB — determine two things from the profile data below:
    1. DATE: Find the earliest date that all members have in common in their availability lists.
    If no shared date exists, pick the date with the most members available.
    Return it as an ISO date string e.g. "2026-09-12".
    2. MEETUP POINT: Choose a central neighborhood that minimizes travel for all members
    based on their neighborhoods listed below. Return it as a human-readable string
    e.g. "Williamsburg, Brooklyn" or "Lower East Side, Manhattan".

    MEMBER AVAILABILITY:
    {availability_map}

    MEMBER NEIGHBORHOODS:
    {neighborhoods}

    TIMING CONSTRAINTS (non-negotiable — apply to every block transition):
    {timing}

    HARD CONSTRAINTS (must be satisfied — eliminate any block that cannot meet these):
    {hard_constraints}

    SOFT PREFERENCES (optimize for — score and rank candidates against these):
    {soft_preferences}

    EXCLUDED PLACES (vetoed by one or more members): {", ".join(all_vetoed) if all_vetoed else "None"}

    Build a full-day itinerary skeleton. For each time block, return a structured query job — not a specific venue.
    The itinerary should:
    1. Satisfy all hard constraints for every block
    2. Respect the group's availability window
    3. Sequence activities to minimize travel between stops
    4. Include a diverse mix of activity types — not just food. Think culture, outdoors, entertainment, leisure, and food together.
    5. Include at least one restaurant or bar block suitable for a phone reservation
    6. Include hotel, lodging, airbnb reservation and checkout blocks based on the overall preferences of the group
    7. ALWAYS include at least one iconic tourist attraction block — landmarks, famous museums, historic sites, or must-see spots that are signature to the place. These make the itinerary memorable.
    8. Give every block a short human-readable label — e.g. "Hotel Check-in", "Lunch", "Museum Visit", "Evening Drinks", "Brooklyn Bridge Walk"

    Valid price_level values (use ONLY these exact strings):
    free, budget, mid, splurge

    Valid activity_type values (use ONLY these exact strings):
    restaurant   — all food & drink: dining, cafes, bars, markets, rooftop bars, breweries
    attraction   — culture & sights: museums, galleries, landmarks, historic sites, theaters
    entertainment — nightlife & activities: clubs, bowling, comedy, arcades, karaoke, sports venues
    outdoor      — nature & leisure: parks, beaches, hiking, waterfront, botanical gardens
    shopping     — retail: malls, markets, boutiques, bookstores, vintage stores
    lodging      — all accommodation checkin AND checkout: hotels, airbnbs, homestays
    transit      — travel between stops
    free_time    — unstructured downtime

    KEYWORDS ARE REQUIRED. They are the primary search signal — especially for entertainment and shopping.
    Always populate keywords with specific, descriptive terms. Vague or empty keywords produce no results.
    Examples:
    - activity_type "restaurant"    + keywords ["Italian", "rooftop", "wine"]
    - activity_type "entertainment" + keywords ["comedy club"]  or  ["arcade", "games"]  or  ["bowling"]
    - activity_type "shopping"      + keywords ["vintage clothing", "thrift"]  or  ["bookstore"]  or  ["street market"]
    - activity_type "attraction"    + keywords ["contemporary art museum"]  or  ["historic landmark"]
    - activity_type "outdoor"       + keywords ["waterfront walk"]  or  ["botanical garden"]
    - activity_type "lodging"       + keywords ["hotel", "checkin"]  or  ["hotel", "checkout"]
    Never leave keywords empty. If a block has no cuisine, still fill keywords with descriptive activity terms.

    Return ONLY valid JSON in this exact structure — include "date" and "meetup_point" at the top level:
    {{
    "date": "2026-09-12",
    "meetup_point": "Williamsburg, Brooklyn",
    "blocks": [
        {{
        "activity_type": "attraction",
        "label": "Museum Visit",
        "start_time": "2026-09-12T14:00:00",
        "end_time": "2026-09-12T16:00:00",
        "keywords": ["contemporary art museum"],
        "cuisine": [],
        "vibes": ["modern", "cultural"],
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


def _extract_availability_map(profiles: list[UserProfile]) -> str:
    lines = []
    for p in profiles:
        dates = ", ".join(str(d) for d in p.availability) if p.availability else "not specified"
        lines.append(f"- {p.name}: {dates}")
    return "\n".join(lines) if lines else "None"


def _extract_timing_constraints(profiles: list[UserProfile]) -> str:
    # Group buffer = max individual buffer — everyone must be comfortable
    group_buffer = max((p.buffer_mins for p in profiles), default=30)
    # Group max travel = max individual max_travel — most restrictive wins
    group_max_travel = max((p.max_travel_mins for p in profiles), default=30)
    # Most conservative transport mode
    mode_priority = {"walking": 0, "transit": 1, "uber": 2}
    slowest_mode = min(profiles, key=lambda p: mode_priority.get(p.transport_mode, 1)).transport_mode

    per_member = "\n".join(
        f"  - {p.name}: buffer={p.buffer_mins} min, max_travel={p.max_travel_mins} min, mode={p.transport_mode}"
        for p in profiles
    )

    return f"""
  GROUP BUFFER: {group_buffer} minutes — leave AT LEAST {group_buffer} minutes of empty gap between the end of one block and the start of the next. Do not schedule back-to-back blocks. This gap is for travel + transition and is a hard requirement.
  GROUP MAX TRAVEL: {group_max_travel} minutes — no activity should require more than {group_max_travel} minutes of travel from the previous stop.
  SLOWEST TRANSPORT MODE: {slowest_mode} — use this to estimate travel time between blocks.
  Per-member breakdown:
{per_member}"""


def _extract_neighborhoods(profiles: list[UserProfile]) -> str:
    lines = []
    for p in profiles:
        hood = p.neighborhood if p.neighborhood else "not specified"
        lines.append(f"- {p.name}: {hood}")
    return "\n".join(lines) if lines else "None"
