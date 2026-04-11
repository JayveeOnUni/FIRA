# Functional Test Cases and Results (Phase 6)

## Execution Context
- Primary automated run timestamp: `2026-04-11T03:48:03.251Z`
- Test runner: `server/scripts/phase6-functional-check.js`
- Output artifact: `docs/test-results-raw.json`
- Reliability reruns artifact: `docs/test-reliability-runs.json`
- Environment: local PostgreSQL + backend + mock AI service for deterministic API validation

## Test Case Matrix
| Test ID | Module/Workflow | Preconditions | Steps | Expected Result | Actual Result | Status | Notes |
|---|---|---|---|---|---|---|---|
| TC-001 | Health and readiness | Server, DB, and AI mock service running | `GET /api/health` | `200` with dependency checks | `200`, status `ok` | Pass | Response time `189ms` |
| TC-002 | Authentication (applicant register) | Email not yet used | `POST /api/auth/register/applicant` | Applicant user/session created | `201`, role `applicant` | Pass | `297ms` |
| TC-003 | Authentication (employer register) | Email not yet used | `POST /api/auth/register/employer` | Employer user/session created | `201`, role `employer` | Pass | `263ms` |
| TC-004 | Authentication (staff login) | Seeded staff account exists | `POST /api/auth/login` | Staff login success | `200`, role `agency_staff` | Pass | `252ms` |
| TC-005 | Role access guard | Authenticated applicant | `GET /api/employers/jobs` | Access denied | `403` | Pass | Role protection confirmed |
| TC-006 | Employer job create | Employer authenticated | `POST /api/employers/jobs` | Job created | `201`, job id returned | Pass | `10ms` |
| TC-007 | Public job listing | Published public job exists | `GET /api/jobs` | Created job is visible | `200`, listing includes job | Pass | `6ms` |
| TC-008 | Applicant apply flow | Applicant + published job | `POST /api/jobs/:jobId/apply` | Application created with `Applied` | `201`, application id returned | Pass | `27ms` |
| TC-009 | Duplicate prevention | Existing applicant-job application | Repeat apply request | Duplicate blocked | `409` | Pass | Unique behavior verified |
| TC-010 | ATS staff update | Staff authenticated, application exists | `PATCH /api/agency-staff/applications/:id/status` | Status updates to `Under Review` | `200`, status updated | Pass | `7ms` |
| TC-011 | Endorsement flow | Staff authenticated, active application | `POST /api/agency-staff/applications/:id/endorse` | Endorsement created and status set `Endorsed` | `201`, status `Endorsed` | Pass | `6ms` |
| TC-012 | Applicant recommendations | Applicant authenticated, jobs available | `GET /api/matching/applicant/recommended-jobs` | Ranked jobs with scores | `200`, recommendations returned | Pass | `27ms` |
| TC-013 | Employer ranked applicants | Employer authenticated, applicants available | `GET /api/matching/employer/jobs/:jobId/ranked-applicants` | Ranked applicants with scores | `200`, ranked list returned | Pass | `10ms` |
| TC-014 | Staff ranked applicants | Staff authenticated, applicants available | `GET /api/matching/staff/jobs/:jobId/ranked-applicants` | Ranked applicants with scores | `200`, ranked list returned | Pass | `6ms` |
| TC-015 | Decision-support integrity | Application status already set | Invoke matching endpoints then re-check application | ATS status unchanged | Status remained `Endorsed` | Pass | Confirms no auto ATS mutation from matching |
| TC-016 | Dependency failure handling | AI service intentionally stopped | `GET /api/matching/applicant/recommended-jobs` | Graceful dependency error | `503`, message `AI matching service health check failed` | Pass | Clear fallback behavior |

## Defect Tracking Summary
| Defect ID | Issue Description | Severity | Affected Module | Status | Resolution Summary |
|---|---|---|---|---|---|
| DEF-001 | Matching endpoints returned `500` due invalid JSON syntax while writing `explanation_keywords` to `match_scores` (`JSONB`) | High | Matching integration | Resolved | Serialized keywords to JSONB-safe payload and normalized keyword parsing in matching service |

## Retest Notes
- After applying the fix for DEF-001, the full suite was rerun and achieved `16/16` pass.
- Additional reliability reruns were executed 3 consecutive times; all runs passed all 16 checks.
