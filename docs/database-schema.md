# Database Schema (Final Alignment Through Phase 6)

## Migration Sources
- `database/migrations/001_create_core_foundation.sql`
- `database/migrations/002_expand_recruitment_workflow.sql`
- `database/migrations/003_expand_staff_ats_workflow.sql`
- `database/migrations/004_add_matching_foundation.sql`
- `database/migrations/005_phase7_responsible_ai_and_review.sql`

## Seed Source
- `database/seed/001_seed_phase2.sql`

## Phase 6/7 Notes
- Phase 6 focused on validation and stabilization.
- Phase 7 introduced review-governance persistence tables for human-in-the-loop matching decisions.
- Matching persistence behavior remains stabilized with JSONB-safe serialization for `match_scores.explanation_keywords`.

## Implemented Tables

1. `roles`
- Role catalog (`applicant`, `employer`, `agency_staff`)

2. `users`
- Core identity: email, password hash, role mapping, names, active flag

3. `applicants`
- Applicant profile linked to `users`
- Includes:
  - `phone`, `address`, `date_of_birth`
  - `education_summary`, `work_experience_summary`, `skills_summary`
  - `preferred_job_category`, `profile_status`

4. `applicant_documents`
- File metadata for applicant uploads
- Includes `document_type`, original/stored filenames, storage path, mime type, file size, upload timestamp

5. `companies`
- Employer company profile
- Includes `name`, `description`, `address`, `website`, `contact_number`, `country`

6. `employers`
- Employer profile linked to `users`
- Includes `company_id`, `job_title`

7. `agency_staff_profiles`
- Staff profile linked to `users` (minimal for this phase)

8. `jobs`
- Job posting records linked to `companies`
- Includes:
  - `title`, `description`
  - `qualifications`, `required_skills`
  - `location`, `employment_type`, `salary`
  - `status` (`draft`, `published`, `closed`)
  - `is_public`
  - `created_by`

9. `applications`
- Applicant-job link table
- Includes:
  - `status` (`Applied`, `Under Review`, `Verified`, `Shortlisted`, `Endorsed`, `Rejected`, `Withdrawn`)
  - `applied_at`
  - `last_updated_by` (user reference for latest ATS mutation actor)
- Unique constraint on `(applicant_id, job_id)` to prevent duplicate applies

10. `application_status_history`
- Status change timeline for each application
- Includes `old_status`, `new_status`, `changed_by`, `note`, `created_at`

11. `endorsements`
- Staff endorsement records linking applicant and job
- Includes:
  - `application_id` (optional direct linkage)
  - `applicant_id`, `job_id`
  - `endorsed_by` (staff user)
  - `note`
  - `status` (`active`, `revoked`)
  - timestamps
- Unique index on `(applicant_id, job_id)` prevents duplicate active endorsement records

12. `audit_logs`
- Basic action tracking for implemented flows
- Includes optional `metadata` JSONB for action context

13. `match_scores`
- Semantic similarity scores between applicant and job
- Includes:
  - `applicant_id`
  - `job_id`
  - `score`
  - `score_type` (default: `sbert_cosine_similarity`)
  - `explanation_summary`
  - `explanation_keywords` (JSONB)
  - `generated_at`
  - timestamps
- Unique constraint on `(applicant_id, job_id, score_type)` for upsert-safe score refresh

14. `embeddings_metadata`
- Metadata for latest embedding generation context per entity
- Includes:
  - `entity_type` (`applicant`, `job`)
  - `entity_id`
  - `source_version`
  - `embedding_model`
  - `text_hash`
  - `generated_at`
  - timestamps
- Unique constraint on `(entity_type, entity_id)`

15. `review_notes` (Phase 7)
- Human reviewer note capture for job-applicant assessment context
- Includes:
  - `application_id` (optional linkage)
  - `applicant_id`
  - `job_id`
  - `created_by`
  - `note_type` (`general`, `manual_assessment`, `fairness_check`, `data_quality`)
  - `note`
  - timestamps

16. `match_review_actions` (Phase 7)
- Explicit reviewer action log near ranked matching outputs
- Includes:
  - `application_id` (optional linkage)
  - `applicant_id`
  - `job_id`
  - `acted_by`
  - `action_type` (`reviewed`, `shortlisted_by_human`, `deferred`, `needs_more_information`)
  - optional `note`
  - timestamps

17. `system_settings`
- Placeholder configuration store

18. `_schema_migrations`
- Migration execution tracking

19. `_seed_runs`
- Seed execution tracking

## Relationship Summary
- `roles (1) -> users (many)`
- `users (1) -> applicants (0..1)`
- `users (1) -> employers (0..1)`
- `users (1) -> agency_staff_profiles (0..1)`
- `applicants (1) -> applicant_documents (many)`
- `companies (1) -> employers (many)`
- `companies (1) -> jobs (many)`
- `users (1) -> jobs.created_by (many)`
- `applicants (1) -> applications (many)`
- `jobs (1) -> applications (many)`
- `users (1) -> applications.last_updated_by (many)`
- `applications (1) -> application_status_history (many)`
- `users (1) -> application_status_history.changed_by (many)`
- `applications (1) -> endorsements (0..many)`
- `applicants (1) -> endorsements (many)`
- `jobs (1) -> endorsements (many)`
- `users (1) -> endorsements.endorsed_by (many)`
- `applicants (1) -> match_scores (many)`
- `jobs (1) -> match_scores (many)`
- `users (1) -> audit_logs (many)`
- `jobs (1) -> review_notes (many)`
- `applicants (1) -> review_notes (many)`
- `users (1) -> review_notes.created_by (many)`
- `jobs (1) -> match_review_actions (many)`
- `applicants (1) -> match_review_actions (many)`
- `users (1) -> match_review_actions.acted_by (many)`

## Indexes and Constraints Highlights
- `users.email` unique
- `applications (applicant_id, job_id)` unique
- `endorsements (applicant_id, job_id)` unique
- `match_scores (applicant_id, job_id, score_type)` unique
- `embeddings_metadata (entity_type, entity_id)` unique
- `review_notes.note_type` check constraint
- `match_review_actions.action_type` check constraint
- status check constraints on:
  - `jobs`
  - `applications`
  - `application_status_history`
  - `endorsements`
- indexes on common lookup columns:
  - `jobs.status`
  - `applications.job_id`
  - `applications.applicant_id`
  - `applications.status, updated_at`
  - `applications.last_updated_by`
  - `application_status_history.application_id, created_at`
  - `endorsements.job_id`
  - `endorsements.application_id`
  - `endorsements.endorsed_by`
  - `endorsements.created_at`
  - `match_scores.job_id, score DESC`
  - `match_scores.applicant_id, score DESC`
  - `match_scores.generated_at`
  - `embeddings_metadata.generated_at`
  - `embeddings_metadata.embedding_model`
  - `review_notes.job_id`
  - `review_notes.applicant_id`
  - `review_notes.created_by`
  - `review_notes.created_at`
  - `match_review_actions.job_id`
  - `match_review_actions.applicant_id`
  - `match_review_actions.acted_by`
  - `match_review_actions.created_at`

## Future Extension Notes
- Add interview and scheduling entities
- Add notification delivery and communication logs
- Add advanced cached-result payload tables if batch/offline matching is introduced
- Add fairness and evaluation measurement tables in a later dedicated phase
- Add optional archival/partitioning strategy for long-term `audit_logs` and ATS history retention
