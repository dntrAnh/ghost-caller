class GhostCallerError(Exception):
    """Base exception for all application errors."""


class PlacesAPIError(GhostCallerError):
    """Raised when Google Places API returns an unexpected response."""


class ItineraryBuildError(GhostCallerError):
    """Raised when the coordinator agent fails to produce a valid itinerary."""


class BookingError(GhostCallerError):
    """Raised when a phone booking attempt fails."""


class UserProfileValidationError(GhostCallerError):
    """Raised when a user profile fails constraint validation."""
