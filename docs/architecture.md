# Architecture Summary (Through Phase 7)

## 1) Service Topology
```text
[React Client (Vite)]
        |
        | REST/JSON + cookie auth
        v
[Express API Server]
     |            \
     | SQL         \ HTTP/JSON
     v              v
[PostgreSQL]   [Python AI Service (FastAPI + SBERT)]
```

## 2) Frontend Architecture
- Route-driven SPA with role-based sections:
  - public pages
  - applicant dashboard flows
  - employer dashboard flows
  - agency staff ATS operations
- Shared layouts:
  - public shell
  - dashboard shell with role-aware navigation
- API service layer (`src/services`) and auth context bootstrap.
- Protected and role-protected route wrappers enforce client-side navigation boundaries.

## 3) Backend Architecture
- Express modular routing with separation across:
  - routes
  - controllers
  - services
  - middleware
  - validation helpers
- Auth:
  - registration/login/logout/current-user
  - JWT stored in HttpOnly cookie
  - role guard middleware (`applicant`, `employer`, `agency_staff`)
- Domain APIs:
  - applicant profile/documents/applications
  - employer company/jobs/applicants
  - staff ATS operations/status updates/endorsements/monitoring
  - public jobs and application submission
  - matching recommendations/rankings
- Readiness:
  - dependency-aware health endpoint (DB + AI status)
  - request trace id support and runtime diagnostics summary

## 4) AI Service Architecture
- FastAPI service exposes:
  - `GET /health`
  - `GET /ready`
  - `POST /v1/embeddings`
  - `POST /v1/match/rank`
- Matching engine:
  - text normalization
  - SBERT embedding generation
  - cosine similarity ranking
  - lightweight explanation payloads (shared keyword overlap + relevance label)
- Backend integration via `AI_SERVICE_URL`, with graceful `503` handling on dependency failure.

## 5) Database Architecture
- PostgreSQL as transactional source of truth.
- Core groups:
  - identity and roles (`roles`, `users`, profile tables)
  - recruitment workflow (`companies`, `jobs`, `applications`, `application_status_history`)
  - operations (`endorsements`, `audit_logs`)
  - matching (`match_scores`, `embeddings_metadata`)
  - governance (`review_notes`, `match_review_actions`)
- Constraints and indexes support:
  - role-safe ownership checks
  - duplicate prevention (applications/endorsements)
  - ATS timeline traceability
  - ranked retrieval performance

## 6) Request Flow
1. Client calls backend endpoint under `/api`.
2. Middleware validates auth, role, and request payload.
3. Service layer executes DB operations and/or AI service call.
4. Response returns normalized JSON with role-safe payload.
5. ATS and matching remain decision-support-oriented; no automatic hiring actions are performed.
