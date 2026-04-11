# Operations and Monitoring

## Health and Readiness Endpoints
Backend:
- `GET /api/health`
  - database status
  - AI service status
  - diagnostics snapshot (counters/events summary)
  - phase and uptime information

Matching operational endpoint (staff-only):
- `GET /api/matching/operations/summary`
  - match score/metadata counts
  - review governance counts
  - runtime diagnostics summary
  - recent diagnostic events
  - guidance reminders

AI service:
- `GET /health`
- `GET /ready`
- `GET /diagnostics`

## Logging and Diagnostics Support
Phase 7 introduces:
- request trace id (`x-request-id`) for backend requests
- lightweight diagnostics event tracking in backend runtime memory
- AI client failure diagnostics capture
- server error diagnostics capture in global error handler

## Matching Optimization Notes
- cache policy remains time-window based (`match_scores` freshness check)
- partial cache reuse is enabled:
  - cached candidate/job scores are reused
  - only missing entries are recomputed
- explicit `refresh=true` still forces recomputation behavior by endpoint design

## Governance Export Support
Role-restricted export endpoint:
- `GET /api/matching/jobs/:jobId/review-summary?format=csv`
- includes:
  - applicant and application context
  - match score
  - latest human review action
  - latest review note summary fields
  - review note count

## Troubleshooting Flow
1. Check backend health (`/api/health`).
2. Check AI health (`/health` and `/ready` on AI service).
3. Check matching operations summary (`/api/matching/operations/summary`) as staff.
4. Verify role and ownership rules for matching/review endpoints.
5. Validate DB migration state includes Phase 7 migration (`005_phase7_responsible_ai_and_review.sql`).

## Validation Commands
```bash
cd server
$env:DOTENV_CONFIG_QUIET='true'
npm run test:phase6:functional
npm run test:phase7:governance
```

## Operational Limitations
- diagnostics events are in-memory and reset on process restart
- no persistent log aggregation or external alerting integration yet
- monitoring remains prototype-level, designed for controlled deployments
