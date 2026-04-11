from __future__ import annotations

import os
import time
from dataclasses import dataclass
from threading import Lock
from typing import Any, Dict, List, Sequence

import numpy as np
from sentence_transformers import SentenceTransformer

from utils.text_preprocessing import normalize_text, shared_keywords


@dataclass
class RankingCandidate:
    id: str
    text: str


class MatchingEngine:
    def __init__(self) -> None:
        self._model: SentenceTransformer | None = None
        self._model_lock = Lock()
        self.model_name = os.getenv("MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
        self.device = os.getenv("MODEL_DEVICE", "cpu")
        self._embedding_dimension: int | None = None
        self._stats: Dict[str, Any] = {
            "rank_requests_total": 0,
            "rank_failures_total": 0,
            "last_rank_duration_ms": None,
            "last_ranked_candidates": 0,
            "last_rank_at": None,
            "last_error": None,
        }

    def diagnostics_snapshot(self) -> Dict[str, Any]:
        return {
            **self._stats,
        }

    @staticmethod
    def _score_relevance_label(score: float) -> str:
        if score >= 0.78:
            return "high_relevance"
        if score >= 0.58:
            return "moderate_relevance"
        return "exploratory_relevance"

    def load_model(self) -> SentenceTransformer:
        if self._model is not None:
            return self._model

        with self._model_lock:
            if self._model is None:
                model = SentenceTransformer(self.model_name, device=self.device)
                self._model = model

                # Prime dimensions once so /health can expose deterministic metadata.
                probe = model.encode(["model-dimension-probe"], normalize_embeddings=True, convert_to_numpy=True)
                self._embedding_dimension = int(probe.shape[1])

        return self._model

    @property
    def embedding_dimension(self) -> int:
        if self._embedding_dimension is None:
            self.load_model()
        return int(self._embedding_dimension or 0)

    def encode_texts(self, texts: Sequence[str]) -> np.ndarray:
        model = self.load_model()
        normalized = [normalize_text(text) for text in texts]

        if not normalized:
            return np.empty((0, self.embedding_dimension), dtype=np.float32)

        return model.encode(
            normalized,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

    def rank_candidates(
        self,
        query_text: str,
        candidates: Sequence[RankingCandidate],
        top_k: int = 10,
        min_score: float | None = None,
    ) -> Dict[str, Any]:
        started_at = time.perf_counter()
        self._stats["rank_requests_total"] += 1

        normalized_query = normalize_text(query_text)
        normalized_candidates = [normalize_text(candidate.text) for candidate in candidates]

        if not normalized_query:
            self._stats["rank_failures_total"] += 1
            self._stats["last_error"] = "Query text cannot be empty after normalization"
            raise ValueError("Query text cannot be empty after normalization")

        if not normalized_candidates:
            self._stats["last_rank_duration_ms"] = round((time.perf_counter() - started_at) * 1000, 2)
            self._stats["last_ranked_candidates"] = 0
            self._stats["last_rank_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            return {
                "model": self.model_name,
                "items": [],
                "query_text": normalized_query,
            }

        embeddings = self.encode_texts([normalized_query, *normalized_candidates])
        query_embedding = embeddings[0]
        candidate_embeddings = embeddings[1:]

        scores = candidate_embeddings @ query_embedding
        min_score_value = -1.0 if min_score is None else float(min_score)

        ranked: List[Dict[str, Any]] = []
        for index, candidate in enumerate(candidates):
            score = float(scores[index])
            if score < min_score_value:
                continue

            candidate_text = normalized_candidates[index]
            overlap = shared_keywords(normalized_query, candidate_text)

            ranked.append(
                {
                    "id": candidate.id,
                    "score": score,
                    "text_preview": candidate_text[:200],
                    "explanation": {
                        "shared_keywords": overlap,
                        "shared_keyword_count": len(overlap),
                        "relevance_label": self._score_relevance_label(score),
                        "summary": (
                            f"Shared terms: {', '.join(overlap)}"
                            if overlap
                            else "Semantic match found from profile and job context"
                        ),
                    },
                }
            )

        ranked.sort(key=lambda item: item["score"], reverse=True)
        self._stats["last_rank_duration_ms"] = round((time.perf_counter() - started_at) * 1000, 2)
        self._stats["last_ranked_candidates"] = len(candidates)
        self._stats["last_rank_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self._stats["last_error"] = None

        return {
            "model": self.model_name,
            "items": ranked[: max(1, int(top_k))],
            "query_text": normalized_query,
        }


matching_engine = MatchingEngine()
