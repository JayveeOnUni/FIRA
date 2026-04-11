# Applicant Workflow (Phase 4)

## 1. Profile Flow
1. Applicant logs in and opens `/dashboard/applicant/profile`.
2. Profile form loads current applicant + user name data.
3. Applicant updates personal/professional summary fields.
4. Backend persists updates to `users` and `applicants`.
5. `profile_status` is recalculated (`complete` or `incomplete`) based on required summary fields.

API endpoints:
- `GET /api/applicants/profile`
- `PUT /api/applicants/profile`

## 2. Resume/Document Flow
1. Applicant opens `/dashboard/applicant/documents`.
2. Applicant selects `resume` or `supporting` document type.
3. Applicant uploads a valid file (PDF/DOC/DOCX/JPG/PNG).
4. Backend validates type and size, stores file in local upload directory, and saves metadata.
5. Applicant sees metadata list of uploaded documents.

API endpoints:
- `POST /api/applicants/documents`
- `GET /api/applicants/documents`

Dev storage strategy:
- Files saved under `server/uploads/applicant-documents`
- Metadata stored in `applicant_documents`

## 3. Apply-to-Job Flow
1. Applicant browses jobs from `/jobs`.
2. Applicant opens `/jobs/:jobId` for detailed information.
3. Applicant submits application through `Apply` action.
4. Backend creates `applications` row with status `Applied`.
5. Backend creates `application_status_history` entry for initial status.
6. Duplicate applications are blocked by unique constraint.

API endpoint:
- `POST /api/jobs/:jobId/apply`

## 4. Application Tracking Flow
1. Applicant opens `/dashboard/applicant/applications`.
2. Page shows submitted applications and current ATS statuses.
3. Applicant can view status history, including staff-updated transitions and optional notes.
4. Applicant sees endorsement marker when staff endorses an application.
5. Applicant may withdraw an application (status becomes `Withdrawn` with history entry).

API endpoints:
- `GET /api/applicants/applications`
- `PATCH /api/applicants/applications/:applicationId/withdraw`
- `GET /api/applications/:applicationId/history`
