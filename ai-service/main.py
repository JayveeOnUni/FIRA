from __future__ import annotations

from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator

from services.matching_service import RankingCandidate, matching_engine
from utils.text_preprocessing import normalize_text

load_dotenv()

app = FastAPI(
    title="FIRA AI Service",
    description="SBERT embedding and semantic similarity service (Phase 7 responsible-use enhancements).",
    version="0.7.0-phase7",
)


class EmbeddingsRequest(BaseModel):
    texts: List[str] = Field(default_factory=list)

    @field_validator("texts")
    @classmethod
    def validate_texts(cls, value: List[str]) -> List[str]:
        if not value:
            raise ValueError("texts must contain at least one text value")
        return value


class RankingCandidateInput(BaseModel):
    id: str = Field(min_length=1)
    text: str = Field(min_length=1)
    metadata: Dict[str, Any] | None = None


class MatchRankRequest(BaseModel):
    query_text: str = Field(min_length=1)
    candidates: List[RankingCandidateInput] = Field(default_factory=list)
    top_k: int = Field(default=10, ge=1, le=100)
    min_score: float | None = Field(default=None, ge=-1.0, le=1.0)

    @field_validator("candidates")
    @classmethod
    def validate_candidates(cls, value: List[RankingCandidateInput]) -> List[RankingCandidateInput]:
        if not value:
            raise ValueError("candidates must contain at least one entry")
        return value


@app.on_event("startup")
def preload_model() -> None:
    # Load once during startup so first request latency is predictable.
    matching_engine.load_model()


@app.get("/health")
def health() -> dict:
    return {
        "service": "fira-ai-service",
        "status": "ok",
        "phase": "phase-7-responsible-ai-and-operations-enhancement",
        "model": matching_engine.model_name,
        "device": matching_engine.device,
        "embedding_dimension": matching_engine.embedding_dimension,
        "matching_ready": True,
        "diagnostics": matching_engine.diagnostics_snapshot(),
    }


@app.get("/ready")
def ready() -> dict:
    try:
        matching_engine.load_model()
        return {"ready": True, "model": matching_engine.model_name}
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=503, detail=f"Model not ready: {exc}") from exc


@app.get("/diagnostics")
def diagnostics() -> dict:
    return {
        "service": "fira-ai-service",
        "model": matching_engine.model_name,
        "diagnostics": matching_engine.diagnostics_snapshot(),
    }


@app.post("/v1/embeddings")
def create_embeddings(payload: EmbeddingsRequest) -> dict:
    normalized = [normalize_text(text) for text in payload.texts]
    embeddings = matching_engine.encode_texts(normalized)

    return {
        "model": matching_engine.model_name,
        "dimension": matching_engine.embedding_dimension,
        "count": len(normalized),
        "items": [
            {
                "index": index,
                "text_preview": normalized[index][:200],
                "embedding": embedding.tolist(),
            }
            for index, embedding in enumerate(embeddings)
        ],
    }


@app.post("/v1/match/rank")
def rank_matches(payload: MatchRankRequest) -> dict:
    candidates = [RankingCandidate(id=item.id, text=item.text) for item in payload.candidates]

    try:
        result = matching_engine.rank_candidates(
            query_text=payload.query_text,
            candidates=candidates,
            top_k=payload.top_k,
            min_score=payload.min_score,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "model": result["model"],
        "query_text": result["query_text"],
        "count": len(result["items"]),
        "items": result["items"],
    }
