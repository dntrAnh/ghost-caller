# Ghost Caller — Backend

AI-powered travel agent with itinerary building and agentic phone call booking.

## Requirements

- Python 3.13+
- API keys for Anthropic, Google Places, and ElevenLabs

## Setup

**1. Clone and navigate to the backend folder**

```bash
cd ghost-caller/backend
```

**2. Create and activate a virtual environment**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

**3. Install dependencies**

```bash
pip install -e ".[dev]"
```

**4. Configure environment variables**

```bash
cp .env.example .env
```

Open `.env` and fill in your API keys:

```
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## Running the server

```bash
uvicorn app.main:app --reload
```

The server starts at `http://localhost:8000`.

Interactive API docs: `http://localhost:8000/docs`

Health check: `http://localhost:8000/health`

## Project structure

```
app/
├── main.py                  # FastAPI app entrypoint
├── core/
│   ├── config.py            # Settings (reads from .env)
│   ├── logging.py           # Structured logging
│   ├── exceptions.py        # Typed exception hierarchy
│   └── dependencies.py      # FastAPI dependency providers
├── models/                  # Internal domain objects
│   ├── user.py              # UserProfile
│   └── itinerary.py         # SkeletonBlock, Venue, Itinerary, etc.
├── schemas/                 # API request/response contracts
│   ├── itinerary.py
│   └── booking.py
├── agents/
│   └── coordinator.py       # Claude agent — plans skeleton itinerary
├── services/
│   ├── itinerary.py         # Orchestrates the full build pipeline
│   ├── places.py            # Google Places API client + normalization
│   └── scorer.py            # Hard constraint filtering + soft preference scoring
├── api/v1/
│   ├── router.py
│   └── endpoints/
│       ├── itinerary.py     # POST /api/v1/itinerary/build
│       └── booking.py       # POST /api/v1/booking/call (stub)
└── utils/
    └── prompt_builder.py    # Builds coordinator prompt from user profiles
```

## Key API endpoint

### `POST /api/v1/itinerary/build`

Builds a full-day itinerary for a group. The LLM determines the best date from shared availability and an optimal meetup point from member neighborhoods.

**Request body:**

```json
{
  "group_id": "group-123",
  "profiles": [
    {
      "name": "Maya",
      "phone": "+1234567890",
      "dietary_restrictions": ["vegan"],
      "cuisines_loved": ["Japanese", "Mexican"],
      "availability": ["2026-09-12", "2026-09-13"],
      "neighborhood": "Williamsburg, Brooklyn",
      "transport_mode": "transit",
      "max_travel_mins": 30,
      "vibes": ["cozy", "lively"],
      "photo_spots": true,
      "price_range": "mid"
    }
  ]
}
```

**Response:**

```json
{
  "group_id": "group-123",
  "date": "2026-09-12",
  "meetup_point": "Williamsburg, Brooklyn",
  "blocks": [
    {
      "activity_type": "museum",
      "start_time": "2026-09-12T13:00:00",
      "end_time": "2026-09-12T15:00:00",
      "candidates": [...],
      "confirmed_venue": null,
      "booking_status": "pending"
    }
  ]
}
```

## Running tests

```bash
pytest
```
