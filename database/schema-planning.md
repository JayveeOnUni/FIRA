# Schema Planning Notes (Phase 1)

## Goals
- Provide a stable baseline for Phase 2 migration creation.
- Keep schema normalized for ATS traceability and role-based workflows.
- Preserve flexibility for AI matching expansion.

## Proposed Relationship Summary
1. `roles` 1--* `users`
2. `users` 1--1 `applicants` (for applicant role)
3. `users` 1--1 `employers` (for employer role)
4. `companies` 1--* `employers`
5. `companies` 1--* `jobs`
6. `jobs` 1--* `applications`
7. `applicants` 1--* `applications`
8. `applications` 1--* `application_status_history`
9. `applicants` 1--* `applicant_documents`
10. `applicants` 1--* `agency_forms`
11. `jobs` 1--* `match_scores`
12. `applicants` 1--* `match_scores`
13. `users` 1--* `audit_logs`
14. `users` 1--* `notifications` (optional)

## Naming and Convention Baseline
- Table names in `snake_case`.
- Primary key as `id` (UUID preferred in future phase).
- Foreign key columns as `<related_entity>_id`.
- Required audit fields on core tables:
  - `created_at`
  - `updated_at`

## Planned Index Baseline
- Unique index on `users.email`.
- Composite index on `applications(job_id, applicant_id)`.
- Index on `applications.current_status`.
- Index on `application_status_history(application_id, changed_at DESC)`.
- Index on `jobs.status`.
- Index on `match_scores(job_id, score DESC)`.

## Data Integrity Considerations
- Enforce non-null `role_id` for all users.
- Restrict `current_status` values using enum/check constraints in Phase 2.
- Use soft-delete strategy selectively for business entities; avoid on audit history.

## Migration Plan Placeholder
- `database/migrations/` is reserved for SQL migration files starting Phase 2.
- `database/seed/` is reserved for baseline role/status seed scripts.
