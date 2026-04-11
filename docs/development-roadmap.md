# Development Roadmap

## Phase 1 (Completed): Planning and Foundation
- Requirements and scope decomposition
- Module and workflow mapping
- Architecture and data planning
- Repository and starter setup
- Baseline documentation

## Phase 2 (Completed): Core Platform and Auth Foundations
- Implement authentication and session/token strategy
- Implement baseline role-based route protection
- Build foundational API for users, profiles, companies, jobs
- Integrate PostgreSQL migrations and seed scripts
- Implement public website pages and role-aware dashboard shells

## Phase 3 (Completed): Core Recruitment Workflow Implementation
- Implement applicant profile completion and persistence
- Implement applicant document upload foundation
- Implement employer company profile and job management foundation
- Implement public job listing/detail backed by live API data
- Implement applicant apply-to-job flow and tracking view
- Implement employer applicants-per-job review view
- Implement baseline ATS statuses and status history records

## Phase 4 (Completed): Agency Staff Operations and Full ATS Workflow
- Implement staff dashboard summaries and operational queues
- Implement staff applicant review and vacancy monitoring pages
- Implement staff-controlled ATS status transitions
- Persist status history and surface ATS progress across roles
- Implement candidate endorsement foundation with traceable records
- Extend employer/applicant views for staff-managed ATS progress
- Add operational summary/report-ready endpoints

## Phase 5 (Completed): Intelligent Matching Layer
- Implemented deterministic text preprocessing strategy for applicant/job matching input
- Integrated SBERT-based AI inference service (`all-MiniLM-L6-v2`)
- Implemented cosine similarity scoring and ranked matching endpoints
- Added applicant recommendations and employer/staff ranked candidate visibility
- Added basic explanation hints (shared keywords) and decision-support messaging
- Added `match_scores` and `embeddings_metadata` persistence foundations

## Phase 6 (Completed): Validation, Stabilization, and Deployment Preparation
- Created and executed structured functional test coverage for major implemented workflows
- Fixed discovered defects and stabilized matching persistence behavior
- Added dependency-aware health/readiness behavior and improved controlled error responses
- Captured prototype-grade quality evidence for:
  - functional suitability
  - usability
  - performance efficiency
  - reliability
- Finalized deployment guide, troubleshooting, and role-based user manuals

## Phase 7 (Completed): Responsible AI and Operational Optimization
- Enhanced explainability payloads with relevance labels, factor overlap hints, and score guidance
- Added fairness-awareness and limitation reminders in matching views
- Implemented human-review governance records (`match_review_actions`, `review_notes`)
- Added role-restricted review timeline and CSV export summary endpoints
- Added matching operations summary endpoint and diagnostics counters/events
- Improved matching recompute behavior with partial cache reuse
- Improved backend request traceability with request id support

## Deferred After Phase 7 (Post-Thesis / Future Work)
1. Formal fairness/bias measurement framework with benchmark datasets
2. Extended explainability validation studies and user calibration testing
3. Persistent observability stack (centralized logs, alerting, dashboards)
4. Full CI-backed automated test suites (unit/integration/e2e)
5. Enterprise deployment hardening (autoscaling, high availability, secret management)
6. New modules outside approved scope (interview scheduling, messaging, external integrations)
