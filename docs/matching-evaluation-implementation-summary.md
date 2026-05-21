# Matching Evaluation Implementation Summary

## What Was Added

Phase 8 introduces a production-oriented matching evaluation module:

- **Migration:** `database/migrations/006_add_matching_evaluation.sql`
- **API routes:** `/api/matching-evaluation/*` (agency staff only)
- **Services/utilities:** dataset lifecycle, labeling, run execution, metrics, baselines
- **Persistence:** datasets, labels, runs, rankings, metric results, audit events
- **Exports:** JSON summaries + optional CSV (`?format=csv`)
- **Validation scripts:** metric unit checks + workflow integration checks
- **Docs:** dataset guide, labeling guide, metrics guide

## Run and Verify

### 1) Apply migration

```bash
cd server
npm run db:migrate
```

### 2) Start services

```bash
# Terminal A
cd ai-service
uvicorn main:app --reload --port 8001

# Terminal B
cd server
npm run dev
```

Set `AI_SERVICE_URL` if not using default.

### 3) Run validation scripts

```bash
cd server
npm run test:matching-evaluation:metrics
npm run test:matching-evaluation:workflow
```

`metrics` is deterministic and does not require PostgreSQL.
`workflow` requires DB connectivity, seeded `staff@fira.local`, and at least one job/applicant.

### 4) Manual API smoke test (staff session)

1. `POST /api/auth/login` as agency staff.
2. `POST /api/matching-evaluation/datasets` to create a dataset.
3. Add jobs/applicants and relevance labels.
4. `POST /api/matching-evaluation/datasets/:datasetId/runs` with methods `["keyword_overlap","tfidf","sbert"]`.
5. `GET /api/matching-evaluation/runs/:runId` and `?format=csv`.

## Key Files

| Area | Path |
|---|---|
| Migration | `database/migrations/006_add_matching_evaluation.sql` |
| Service | `server/src/services/matchEvaluation.service.js` |
| Metrics | `server/src/utils/matchEvalMetrics.js` |
| Baselines | `server/src/utils/matchEvalBaselines.js` |
| Routes | `server/src/routes/matching-evaluation.routes.js` |
| Controller | `server/src/controllers/matchEvaluation.controller.js` |
| Validation | `server/src/validation/matchEvaluation.validation.js` |
| Metric tests | `server/scripts/match-evaluation-metrics-check.js` |
| Workflow tests | `server/scripts/match-evaluation-workflow-check.js` |

## Governance Constraints Preserved

- No ATS status automation from evaluation or matching scores.
- No automated hiring decisions.
- No fairness/bias certification claims in API summaries.
- Responsible-use warnings included in every completed run summary.

## Historical Tracking

Each evaluation run is stored in `match_eval_runs` with:

- methods and scoring configuration
- warnings and JSON summary snapshot
- per-method metric rows for trend comparison across runs and dataset versions

Use dataset version increments (`v1`, `v2`, ...) when label sets or job/applicant membership materially changes.
