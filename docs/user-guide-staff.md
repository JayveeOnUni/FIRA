# Agency Staff User Guide

## 1) Login
1. Open `/login`.
2. Sign in with an agency staff account.
3. You are routed to `Dashboard -> Staff Overview`.

Demo seed account:
- Email: `staff@fira.local`
- Password: `StaffPass123!`

## 2) Staff Dashboard
The dashboard provides:
- applicant/job/application totals
- ATS status distribution
- recent updates and activity snapshots
- quick links to queue pages

## 3) Review Applicants and Applications
1. Open `Dashboard -> Applicants` to browse applicant records.
2. Open applicant detail to inspect profile and document metadata.
3. Open `Dashboard -> ATS Queue` for application-level monitoring.
4. Use filters to narrow records by status and job where available.

## 4) Monitor Jobs and Pipelines
1. Open `Dashboard -> Jobs Monitor`.
2. Select a job to view pipeline applications and statuses.
3. Use this view to track bottlenecks and progress.

## 5) Update ATS Status
1. Open an application in staff queue/job applications.
2. Select a valid next status.
3. Add optional note and submit update.
4. Status history is recorded for traceability.

Current status set:
- Applied
- Under Review
- Verified
- Shortlisted
- Endorsed
- Rejected
- Withdrawn

## 6) Create Endorsements
1. Open an eligible application.
2. Trigger endorsement action.
3. Enter optional note and confirm.
4. Employer-side views will show endorsed candidate entries.

## 7) Record Human Review Governance Actions
1. In ranked applicant pipeline views, select a human review action.
2. Save action and optional reviewer note.
3. Open review timeline to verify traceability.
4. Use CSV export for review-summary handoff when needed.

## 8) Operational Monitoring
- Use summary/report endpoints/views for counts and queue health.
- Use activity/status history for auditing operational decisions.
- Staff dashboard includes matching operations snapshot and diagnostics summary.

## 9) Access Rules
- Only `agency_staff` can perform ATS status updates and create endorsements.
- Staff actions are logged for auditability.
