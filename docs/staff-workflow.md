# Staff Workflow (Phase 4)

## 1. Staff Dashboard Flow
1. Agency staff signs in using a role mapped to `agency_staff`.
2. Staff opens `/dashboard/staff`.
3. Dashboard loads:
  - total applicants
  - active jobs
  - total applications
  - active endorsements
  - counts by ATS status
  - recent status changes
  - recent endorsements
4. Staff navigates to operational queues using quick links.

## 2. Applicant Review Flow
1. Staff opens `/dashboard/staff/applicants`.
2. Staff filters by:
  - search (name/email)
  - profile status
  - latest application status
3. Staff opens an applicant detail page.
4. Applicant detail includes:
  - profile fields
  - document metadata
  - applied jobs with current ATS status and endorsement marker

## 3. Vacancy and Application Monitoring Flow
1. Staff opens `/dashboard/staff/jobs`.
2. Staff monitors each job with:
  - job status and visibility
  - application totals
  - pipeline counts (Applied, Under Review, Verified, Shortlisted, Endorsed)
3. Staff drills down to `/dashboard/staff/jobs/:jobId/applications`.
4. Staff manages per-job ATS actions from this queue.

## 4. ATS Status Update Flow
1. Staff opens job queue or global queue.
2. Staff selects a new status and optional note.
3. Backend validates:
  - role is `agency_staff`
  - status value is allowed
  - transition from old status to new status is allowed
4. System updates `applications.status` and `applications.last_updated_by`.
5. System inserts a new `application_status_history` record.
6. Applicant and employer views reflect updated status.

## 5. Endorsement Flow
1. Staff chooses an application and clicks `Endorse`.
2. Backend validates:
  - role is `agency_staff`
  - application is not rejected/withdrawn
  - transition to `Endorsed` is allowed
3. System upserts endorsement record in `endorsements`.
4. System moves application status to `Endorsed` if not already endorsed.
5. System adds status history and audit logs.
6. Employer can view endorsed candidates under the job-level endorsed view.

## 6. Reporting Flow
1. Staff dashboard and report endpoint provide operational summaries:
  - applications by status
  - applicants by profile status
  - jobs with application counts
2. Data is report-ready (JSON tables) for later export/report extensions.
