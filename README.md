# Ghost Caller

AI-powered group travel planner with itinerary generation, map planning, and reservation call workflows.

This README covers the full local setup and run process for both backend and frontend.

## 1. Prerequisites

Install the following first:

- Python 3.13+
- Node.js 18+
- npm 9+

Optional but recommended:

- `venv` support (usually included with Python)
- API credentials for Anthropic, Google Places/Maps, Supabase, ElevenLabs, Twilio, Deepgram, Resend

## 2. Repository Structure

- `backend/` FastAPI API server
- `frontend/` Next.js web app

## 3. Backend Setup (FastAPI)

From repo root:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -e ".[dev]"
```

Create backend environment file:

```bash
cp .env.example .env
```

Open `backend/.env` and set values.

### Required backend variables (app fails at startup without these)

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
```

### Common optional backend variables (needed for specific features)

```env
# Voice call pipeline
DEEPGRAM_API_KEY=your_deepgram_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+15555550123

# Email invites
RESEND_API_KEY=your_resend_api_key

# App behavior
APP_BASE_URL=http://localhost:8000
APP_ENV=development
LOG_LEVEL=INFO
```

Start backend:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend URLs:

- API root: `http://127.0.0.1:8000`
- Docs: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

## 4. Frontend Setup (Next.js)

Open a second terminal, from repo root:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create local env file if missing:

```bash
touch .env.local
```

Set frontend environment values in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_GHOST_CALL_TARGET_NUMBER=+15550000000

# Use mock planner data when backend/API keys are not fully configured
NEXT_PUBLIC_USE_MOCK_MAP_PLAN=true

# Needed by /app/api/map-demo/transit-route (Google Routes)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
# OR
GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

Start frontend:

```bash
npm run dev
```

Frontend URLs:

- Home: `http://localhost:3000`
- Group planner: `http://localhost:3000/planner`
- Map demo: `http://localhost:3000/map-demo`

## 5. Run Order

1. Start backend first (`backend/`, port 8000).
2. Start frontend second (`frontend/`, port 3000).
3. Open `http://localhost:3000`.

## 6. Quick Verification

- Backend health check returns status:

```bash
curl http://127.0.0.1:8000/health
```

Expected response shape:

```json
{"status":"ok","env":"development"}
```

- Open frontend and confirm pages load:
  - `/`
  - `/planner`
  - `/map-demo`

## 7. Useful Commands

Backend:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run start
```

## 8. Troubleshooting

### Backend does not start and shows missing settings

Make sure `backend/.env` includes all required variables, especially:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_JWT_SECRET`
- `ANTHROPIC_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- `ELEVENLABS_API_KEY`

### Frontend cannot reach backend

- Verify backend is running on `127.0.0.1:8000`
- Verify `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` in `frontend/.env.local`
- Restart frontend dev server after env changes

### Map demo transit route errors

Set one of:

- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_PLACES_API_KEY`

in `frontend/.env.local` and restart frontend.

### Call endpoints return configuration errors

Set voice-related backend keys (`DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY`, Twilio values) and restart backend.

## 9. Security Notes

- Do not commit real secrets to git.
- Keep `.env` and `.env.local` values private.
- Rotate any API key that has been accidentally committed.
