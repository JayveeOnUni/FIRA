# AI Service (Phase 5)

## Purpose
This service provides SBERT-based embedding generation and semantic ranking for the FIRA matching layer.

## Implemented in Phase 5
- FastAPI service with SBERT model loading (`sentence-transformers`)
- Health and readiness endpoints
- Embedding generation endpoint
- Ranked cosine similarity endpoint with basic explanation hints (shared keywords)

## Endpoints
- `GET /health`
- `GET /ready`
- `POST /v1/embeddings`
- `POST /v1/match/rank`

## Local Run (Python 3.11+)
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

## Notes
- Default model: `sentence-transformers/all-MiniLM-L6-v2`
- First startup may take longer while model artifacts are downloaded.
