# ATS Workflow (Phase 4)

## Status Definitions
- `Applied`: applicant submitted application.
- `Under Review`: agency staff started screening.
- `Verified`: agency staff validated applicant profile/documents for next review steps.
- `Shortlisted`: applicant passed initial review and is shortlisted.
- `Endorsed`: applicant is formally endorsed by agency staff for the job.
- `Rejected`: applicant is not moving forward.
- `Withdrawn`: application was withdrawn by applicant or closed from process flow.

## Transition Behavior
Transition rules are intentionally simple and controlled through a transition map.

Allowed transitions:
- `Applied` -> `Under Review`, `Rejected`, `Withdrawn`
- `Under Review` -> `Verified`, `Shortlisted`, `Endorsed`, `Rejected`, `Withdrawn`
- `Verified` -> `Shortlisted`, `Endorsed`, `Rejected`, `Withdrawn`
- `Shortlisted` -> `Endorsed`, `Rejected`, `Withdrawn`
- `Endorsed` -> `Rejected`, `Withdrawn`
- `Rejected` -> no transitions
- `Withdrawn` -> no transitions

Special rule:
- Transition to `Endorsed` is executed through the endorsement action endpoint to guarantee endorsement traceability.

## Status History Handling
- Every status mutation inserts a new row in `application_status_history`.
- History row captures:
  - `application_id`
  - `old_status`
  - `new_status`
  - `changed_by`
  - `note` (optional)
  - `created_at`
- Status history is never overwritten.
- Applicant, employer, and staff can query history only for permitted records.

## Role Visibility and Permissions
- `agency_staff`:
  - can update ATS statuses
  - can endorse candidates
  - can view cross-job ATS operational queues
- `employer`:
  - can view ATS status/history for applications tied to own company jobs
  - can view endorsed candidates for own company jobs
  - cannot directly change ATS statuses
- `applicant`:
  - can view ATS status/history for own applications only
  - can withdraw own applications

## Traceability and Audit
- Status and endorsement actions generate audit events in `audit_logs`.
- `applications.last_updated_by` tracks latest ATS actor.
- `endorsements` includes `endorsed_by`, timestamps, and note for operational traceability.
