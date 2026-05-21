# Quality Evaluation Support (ISO/IEC 25010-Aligned)

## Scope and Method
This is a prototype-grade evaluation support document for Phase 6 through Priority 4 finalization. It maps validation evidence to selected ISO/IEC 25010 characteristics:
- Functional suitability
- Usability
- Performance efficiency
- Reliability
- Security
- Maintainability/Portability readiness

Evidence comes from:
- `docs/test-cases.md`
- `docs/test-results-raw.json`
- `docs/test-reliability-runs.json`
- `docs/matching-evaluation-plan.md`
- build and startup checks executed in Phase 6

## 1) Functional Suitability
### Evidence
- Functional API workflow suite covers auth, role guards, jobs, applications, ATS updates, endorsements, and matching.
- Result: `16/16` passing on latest run.
- Decision-support integrity explicitly tested (matching does not auto-change ATS status).

### Interpretation
- Implemented features satisfy intended core behavior for current prototype scope.
- No failed mandatory workflow remained open after retest.

## 2) Usability
### Evidence
- Role-specific routes and dashboards exist for applicant, employer, and agency staff.
- Validation/error states are present on implemented forms and protected routes.
- Unauthorized access is handled via role-guarded routes and `403` API responses (TC-005).
- User guide set added:
  - `docs/user-guide-applicant.md`
  - `docs/user-guide-employer.md`
  - `docs/user-guide-staff.md`

### Interpretation
- Core flows are navigable and understandable for each role in demo conditions.
- Documentation now supports first-time usage without code inspection.

## 3) Performance Efficiency (Prototype Observations)
### Evidence
From latest functional run timing notes:
- Measured cases with explicit timings: 12
- Min observed API response: `6ms`
- Max observed API response: `297ms` (auth with hashing and session setup)
- Average observed response: `91.67ms`
- Matching endpoints observed:
  - applicant recommendations: `27ms`
  - employer ranked applicants: `10ms`
  - staff ranked applicants: `6ms`

Frontend build check:
- `client` production build succeeded (`vite build`) in under 1 second on local environment.

### Interpretation
- Performance is acceptable for controlled demo/thesis usage.
- Measurements are local-environment observations, not load-test benchmarks.

## 4) Reliability
### Evidence
- Primary functional run: `16/16` pass.
- Repeatability check: 3 consecutive reruns, each `16/16` pass.
- Duplicate application prevention validated (`409`, TC-009).
- Dependency failure handling validated (`503` with clear message when AI service is unavailable, TC-016).
- Health endpoint includes dependency-aware status (`ok`/`degraded`) with DB and AI checks.

### Interpretation
- Implemented workflows behave consistently across repeated runs.
- System fails gracefully for a key dependency-down scenario.

## Evaluation Limitations
- No formal certification-grade ISO/IEC audit was performed.
- No heavy load/stress testing or distributed performance profiling.
- Existing functional tests confirm matching workflow integration, but they do not prove ranking quality.
- Matching quality must be evaluated separately with relevance labels, baseline comparison, and ranking metrics as defined in `docs/matching-evaluation-plan.md`.
- Automated functional suite used a deterministic mock AI endpoint for integration reliability checks in this environment.
- Fairness/bias instrumentation remains deferred beyond this prototype phase.

## Matching Quality Evaluation Addendum
The thesis methodology should treat AI matching evaluation as separate from ordinary API testing.

Recommended thesis evidence:
- representative applicant-job evaluation dataset
- expert relevance labels
- baseline comparison against keyword overlap or TF-IDF
- ranking metrics such as Precision@5 and NDCG@10
- qualitative error analysis of weak or incorrect matches

This addendum prevents the project from claiming SBERT effectiveness based only on successful endpoint responses.

## 5) Security
### Evidence
- Role-guarded backend routes protect applicant, employer, and agency staff workflows.
- Priority 4 adds baseline HTTP hardening headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, conditional HSTS).
- Production startup validates that `DATABASE_URL`, `CLIENT_ORIGIN`, `AI_SERVICE_URL`, and a strong `JWT_SECRET` are configured.
- Staff audit monitoring endpoints are protected by existing `requireAuth` and `requireRole('agency_staff')` middleware.

### Interpretation
- The prototype has release-ready baseline security controls for a controlled deployment.
- It still requires HTTPS, secret management, and hosting-level protections in the target environment.

## 6) Maintainability and Portability Readiness
### Evidence
- Environment examples are present for client, server, and AI service.
- Deployment guide now includes backup/export, security readiness, and defense-demo checklist.
- `server/scripts/db-backup.js` provides a repeatable database export command using standard PostgreSQL tooling.
- Request IDs and diagnostic logging support issue tracing during demos and regression checks.

### Interpretation
- The system is easier to move between local demo and controlled deployment environments.
- Backup/export preparation supports final project handover and defense evidence.
