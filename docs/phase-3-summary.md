# Phase 3 Summary

## What Phase 3 Implemented
- Expanded database with workflow entities:
  - `applicant_documents`
  - `applications`
  - `application_status_history`
  - extended applicant/company/job fields
- Applicant workflow foundation:
  - profile view/update
  - resume/supporting-document upload
  - document metadata listing
  - job application submission
  - application tracking with status history access
- Employer workflow foundation:
  - company profile create/update
  - job create/list/detail/update
  - public visibility controls (`status`, `is_public`)
  - applicants-per-job view
  - ATS status update actions (`Under Review`, `Shortlisted`, `Rejected`)
- Public workflow:
  - real job listing and filtering
  - job detail page
- ATS baseline:
  - status values: `Applied`, `Under Review`, `Shortlisted`, `Rejected`, `Withdrawn`
  - status history records for apply/update/withdraw actions

## What Remains for Later Phases
- SBERT matching and recommendation engine
- advanced ATS routing and endorsement workflows
- advanced staff operations and reporting dashboards
- interview scheduling workflows
- advanced notifications and analytics
- production-grade deployment automation and hardening

## Assumptions Made
- Job applications are limited to one application per applicant per job.
- Public listings include jobs where `status='published'` and `is_public=true`.
- File uploads use local storage (`server/uploads/applicant-documents`) in dev.
- Employer status updates are limited to `Under Review`, `Shortlisted`, `Rejected`.
- Applicant withdrawal sets status to `Withdrawn` and appends history.
