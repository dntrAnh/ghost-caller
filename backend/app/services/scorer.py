from app.models.itinerary import SkeletonBlock, Venue


class VenueScorer:
    """
    Scores and filters a list of Venue candidates against a SkeletonBlock.
    Hard constraint filtering eliminates disqualifiers.
    Soft preference scoring ranks what remains.
    """

    def filter_and_rank(self, venues: list[Venue], block: SkeletonBlock) -> list[Venue]:
        eligible = [v for v in venues if self._passes_hard_constraints(v, block)]
        for venue in eligible:
            venue.composite_score = self._score(venue, block)
        return sorted(eligible, key=lambda v: v.composite_score, reverse=True)

    def _passes_hard_constraints(self, venue: Venue, block: SkeletonBlock) -> bool:
        # Vetoed / excluded places
        if venue.place_id in block.excluded_place_ids:
            return False

        # Dietary restrictions
        # Note: Google Places API (New) has no servesVegan field.
        # serves_vegetarian is the closest available signal for both vegan and vegetarian.
        # The phone booking agent should confirm vegan options during the call.
        for restriction in block.dietary_restrictions:
            if restriction in ("vegan", "vegetarian") and not venue.serves_vegetarian:
                return False

        return True

    def _score(self, venue: Venue, block: SkeletonBlock) -> float:
        score = 0.0
        weights = block.preference_weights

        # Rating signal (normalised to 0–1 from 0–5 scale)
        if venue.rating:
            score += weights.get("rating", 0.3) * (venue.rating / 5.0)

        # Photo spots
        if weights.get("photo_spots", 0) > 0 and venue.photo_count > 0:
            photo_score = min(venue.photo_count / 10.0, 1.0)
            score += weights["photo_spots"] * photo_score

        # Accessibility / transit
        if weights.get("transit", 0) > 0 and venue.is_accessible:
            score += weights["transit"]

        # Vibe matching via editorial summary keyword overlap
        if venue.editorial_summary and block.vibes:
            summary_lower = venue.editorial_summary.lower()
            matched = sum(1 for v in block.vibes if v.lower() in summary_lower)
            vibe_score = matched / len(block.vibes)
            score += weights.get("vibes", 0.2) * vibe_score

        return round(score, 4)
