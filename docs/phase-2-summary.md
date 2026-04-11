# Phase 2 Summary

## What Phase 2 Implemented
- PostgreSQL foundation schema with migration and seed scripts
- Authentication module:
  - applicant registration
  - employer registration
  - login/logout
  - current-session user lookup
- Password hashing using `bcryptjs`
- Token-based auth using JWT stored in HttpOnly cookie
- Backend route protection (`requireAuth`) and role guard (`requireRole`)
- Public jobs read endpoint for job browsing foundation
- Frontend auth state bootstrap and protected route handling
- Role-protected dashboard shells:
  - Applicant Dashboard
  - Employer Dashboard
  - Agency Staff Dashboard
- Public website pages fully routed and styled with consistent layout

## What Remains for Later Phases
- Full ATS workflow and status transitions
- Applicant document workflows and agency forms
- Employer full job posting and candidate review lifecycle
- Staff verification workflows and reports
- SBERT embedding and matching engine integration
- Advanced tests and production hardening

## Assumptions Made
- Auth strategy uses JWT in HttpOnly cookie for simple server-client integration.
- Role list is fixed to `applicant`, `employer`, and `agency_staff` for this phase.
- Employer registration creates a company record as part of account setup.
- Agency staff accounts are seeded for development login support.
- Public jobs page is read-only in this phase.
