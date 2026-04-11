# AI Service (Phase 7 Responsible-Use Readiness)

## Overview
The AI service is a FastAPI application that provides SBERT-based semantic matching primitives for the main FIRA backend.

## Model
- Default model: `sentence-transformers/all-MiniLM-L6-v2`
- Configurable via `MODEL_NAME` in `ai-service/.env`
- Device configurable via `MODEL_DEVICE` (default `cpu`)

## Endpoints
- `GET /health`
  - service status + model metadata + embedding dimension
  - diagnostics snapshot for rank request behavior
- `GET /ready`
  - readiness check for model loading
- `GET /diagnostics`
  - lightweight runtime diagnostics for rank request tracking
- `POST /v1/embeddings`
  - request: list of texts
  - response: normalized embeddings for each text
- `POST /v1/match/rank`
  - request: query text + candidate texts
  - response: ranked candidates with cosine scores and basic explanation hints

## Dependencies
- `fastapi`
- `uvicorn[standard]`
- `python-dotenv`
- `sentence-transformers`
- `numpy`

Install:
```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Run:
```bash
uvicorn main:app --reload --port 8001
```

## Backend Integration Notes
- Main backend uses `AI_SERVICE_URL` to call AI endpoints.
- Current integration endpoint used by backend matching flow:
  - `POST /v1/match/rank`
- Backend matching health check endpoint proxies reachability:
  - `GET /api/matching/health`
- Backend system health now also includes AI dependency check:
  - `GET /api/health`

## Local Development Workflow
1. Start PostgreSQL.
2. Run backend migrations/seeds.
3. Start AI service.
4. Start backend API server.
5. Start frontend client.
6. Test matching screens:
  - applicant recommended jobs
  - employer job applicant ranking
  - staff job pipeline ranking

## Notes and Constraints
- The service does not mutate ATS state.
- Explanations are lightweight heuristic hints (keyword overlap), not deep reasoning.
- Model outputs are for decision support only.
- Runtime diagnostics are in-memory and reset when the AI service restarts.
