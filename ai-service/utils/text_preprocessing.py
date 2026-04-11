import re
from typing import List, Set

_STOPWORDS: Set[str] = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "to",
    "with",
    "will",
    "can",
    "you",
    "your",
    "our",
    "their",
    "this",
    "those",
    "these",
}


def normalize_text(value: str) -> str:
    """Normalize text for stable embedding input and token extraction."""
    if value is None:
        return ""

    normalized = value.lower().strip()
    normalized = re.sub(r"[\r\n\t]+", " ", normalized)
    normalized = re.sub(r"[^a-z0-9\s\-\+\#\/]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def tokenize_keywords(value: str, min_length: int = 3) -> List[str]:
    normalized = normalize_text(value)
    if not normalized:
        return []

    tokens = re.findall(r"[a-z0-9\+\#\/\-]+", normalized)
    filtered = [token for token in tokens if len(token) >= min_length and token not in _STOPWORDS]

    seen = set()
    unique_tokens = []
    for token in filtered:
        if token in seen:
            continue
        seen.add(token)
        unique_tokens.append(token)

    return unique_tokens


def shared_keywords(query_text: str, candidate_text: str, limit: int = 6) -> List[str]:
    query_tokens = tokenize_keywords(query_text)
    candidate_tokens = tokenize_keywords(candidate_text)

    candidate_token_set = set(candidate_tokens)
    overlap = [token for token in query_tokens if token in candidate_token_set]

    return overlap[:limit]
