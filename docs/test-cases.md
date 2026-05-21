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
| TC-017 | Staff audit monitoring access | Agency staff authenticated | `GET /api/agency-staff/audit/summary` | Audit summary returned | Pending final manual run | Pending | Priority 4 release-readiness test |
| TC-018 | Staff audit access guard | Applicant or employer authenticated | `GET /api/agency-staff/audit/logs` | Access denied | Pending final manual run | Pending | Confirms role-based access preservation |
| TC-019 | Audit CSV export | Agency staff authenticated, audit logs available | `GET /api/agency-staff/audit/logs?format=csv` | CSV file response with audit rows | Pending final manual run | Pending | Export evidence for defense/demo |
| TC-020 | Production env guard | Backend started with `NODE_ENV=production` and weak `JWT_SECRET` | Start API server | Startup fails with clear configuration error | Pending final manual run | Pending | Security hardening check |
| TC-021 | Database backup command | PostgreSQL client tools available and `DATABASE_URL` configured | `npm run db:backup` from `server` | SQL dump written to backup directory | Pending final manual run | Pending | Deployment preparation check |
| TC-022 | Accessibility skip links | Frontend running in browser | Keyboard tab from page top | Skip link appears and moves focus to main content | Pending final manual run | Pending | UI/UX accessibility check |
| TC-023 | Maintenance readiness summary | Agency staff authenticated, API dependencies available | `GET /api/agency-staff/maintenance/readiness` | Readiness payload includes health, audit, diagnostics, and checklist | Pending final manual run | Pending | Priority 5 monitoring preparation |
| TC-024 | Database restore command guard | `RESTORE_FILE` unset | `npm run db:restore` from `server` | Command fails safely with explicit `RESTORE_FILE` message | Pending final manual run | Pending | Prevents accidental restore |
| TC-025 | Demo mode banner | `VITE_DEMO_MODE=true` and frontend rebuilt | Open public and dashboard pages | Demo banner is visible | Pending final manual run | Pending | Thesis demo mode support |

## Defect Tracking Summary
| Defect ID | Issue Description | Severity | Affected Module | Status | Resolution Summary |
|---|---|---|---|---|---|
| DEF-001 | Matching endpoints returned `500` due invalid JSON syntax while writing `explanation_keywords` to `match_scores` (`JSONB`) | High | Matching integration | Resolved | Serialized keywords to JSONB-safe payload and normalized keyword parsing in matching service |

## Retest Notes
- After applying the fix for DEF-001, the full suite was rerun and achieved `16/16` pass.
- Additional reliability reruns were executed 3 consecutive times; all runs passed all 16 checks.
