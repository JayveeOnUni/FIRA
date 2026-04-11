# Employer Workflow (Phase 4)

## 1. Company Profile Flow
1. Employer logs in and opens `/dashboard/employer/company`.
2. Form loads current linked company profile.
3. Employer updates company details and saves.
4. Backend upserts company data and keeps employer-company relationship.

API endpoints:
- `GET /api/employers/company`
- `PUT /api/employers/company`

## 2. Job Creation and Edit Flow
1. Employer opens `/dashboard/employer/jobs/new` to create a job.
2. Employer fills core fields (title, description, qualifications, skills, location, type, salary).
3. Employer sets status (`draft`, `published`, `closed`) and public visibility.
4. Job is saved and appears in `/dashboard/employer/jobs`.
5. Employer can edit an existing job via `/dashboard/employer/jobs/:jobId/edit`.

API endpoints:
- `POST /api/employers/jobs`
- `GET /api/employers/jobs`
- `GET /api/employers/jobs/:jobId`
- `PUT /api/employers/jobs/:jobId`

Public visibility behavior:
- Jobs appear on public job search only when:
  - `status = published`
  - `is_public = true`

## 3. Viewing Applicants Per Job
1. Employer opens `/dashboard/employer/jobs/:jobId/applicants`.
2. Page lists applicants, basic profile context, current ATS status, and endorsement markers.
3. Employer can inspect status history for each application.
4. ATS status mutation is now staff-controlled in Phase 4 (read-only for employer).

API endpoints:
- `GET /api/employers/jobs/:jobId/applicants`
- `GET /api/applications/:applicationId/history` (for audit visibility)

## 4. Viewing Endorsed Candidates
1. Employer opens `/dashboard/employer/jobs/:jobId/endorsed`.
2. Page shows active staff endorsements tied to that job.
3. Employer can review who endorsed each candidate and any endorsement note.

API endpoint:
- `GET /api/employers/jobs/:jobId/endorsed-candidates`
