# Initial Database Entity Planning

This document defines planning-level entities only. It is not the final production schema.

## 1. users
- **Purpose:** Central identity record for all account types.
- **Likely Key Fields:** `id`, `email`, `password_hash`, `role_id`, `is_active`, `last_login_at`, `created_at`, `updated_at`
- **Relationships:** many-to-one with `roles`; one-to-one with `applicants` or `employers`; one-to-many with `audit_logs`, `notifications`

## 2. roles
- **Purpose:** Role catalog for access mapping.
- **Likely Key Fields:** `id`, `name` (`applicant`, `employer`, `agency_staff`), `description`
- **Relationships:** one-to-many with `users`

## 3. applicants
- **Purpose:** Applicant profile and recruitment-specific metadata.
- **Likely Key Fields:** `id`, `user_id`, `first_name`, `last_name`, `phone`, `address`, `profile_status`, `resume_document_id`, `created_at`, `updated_at`
- **Relationships:** one-to-one with `users`; one-to-many with `applications`, `applicant_documents`, `agency_forms`

## 4. employers
- **Purpose:** Employer account profile mapped to company ownership/management.
- **Likely Key Fields:** `id`, `user_id`, `company_id`, `position_title`, `contact_number`, `created_at`, `updated_at`
- **Relationships:** one-to-one with `users`; many-to-one with `companies`; one-to-many with `jobs`

## 5. companies
- **Purpose:** Company-level information for job postings.
- **Likely Key Fields:** `id`, `name`, `industry`, `description`, `website_url`, `contact_email`, `contact_phone`, `address`, `created_at`, `updated_at`
- **Relationships:** one-to-many with `employers`; one-to-many with `jobs`

## 6. jobs
- **Purpose:** Vacancy postings submitted by employers/agency.
- **Likely Key Fields:** `id`, `company_id`, `title`, `description`, `requirements_text`, `location`, `employment_type`, `salary_range`, `status`, `posted_by_user_id`, `created_at`, `updated_at`
- **Relationships:** many-to-one with `companies`; one-to-many with `applications`; one-to-many with `match_scores`

## 7. applications
- **Purpose:** Tracks applicant submissions to jobs.
- **Likely Key Fields:** `id`, `job_id`, `applicant_id`, `current_status`, `submitted_at`, `reviewed_by_user_id`, `updated_at`
- **Relationships:** many-to-one with `jobs`; many-to-one with `applicants`; one-to-many with `application_status_history`

## 8. application_status_history
- **Purpose:** Append-only log of ATS status transitions.
- **Likely Key Fields:** `id`, `application_id`, `status`, `changed_by_user_id`, `notes`, `changed_at`
- **Relationships:** many-to-one with `applications`; many-to-one with `users` (staff/employer actors)

## 9. applicant_documents
- **Purpose:** Stores references to applicant-uploaded files.
- **Likely Key Fields:** `id`, `applicant_id`, `document_type`, `file_name`, `file_url`, `mime_type`, `uploaded_at`, `verified_at`, `verified_by_user_id`
- **Relationships:** many-to-one with `applicants`; optional many-to-one with `users` for verification

## 10. agency_forms
- **Purpose:** Tracks agency-specific forms downloaded/submitted by applicants.
- **Likely Key Fields:** `id`, `applicant_id`, `form_type`, `template_version`, `status`, `submitted_file_url`, `submitted_at`, `reviewed_by_user_id`
- **Relationships:** many-to-one with `applicants`; optional many-to-one with `users`

## 11. match_scores
- **Purpose:** Stores matching output between applicant and job.
- **Likely Key Fields:** `id`, `job_id`, `applicant_id`, `score`, `model_name`, `model_version`, `run_id`, `explanation_summary`, `computed_at`
- **Relationships:** many-to-one with `jobs`; many-to-one with `applicants`

## 12. audit_logs
- **Purpose:** Immutable action log for compliance and traceability.
- **Likely Key Fields:** `id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `payload_snapshot`, `ip_address`, `created_at`
- **Relationships:** many-to-one with `users`

## 13. notifications (optional, planning level)
- **Purpose:** In-app/email notification queue and delivery tracking.
- **Likely Key Fields:** `id`, `user_id`, `channel`, `message`, `is_read`, `sent_at`, `read_at`, `created_at`
- **Relationships:** many-to-one with `users`

## 14. system_settings (optional, planning level)
- **Purpose:** Global feature flags and configurable thresholds.
- **Likely Key Fields:** `id`, `key`, `value`, `value_type`, `updated_by_user_id`, `updated_at`
- **Relationships:** optional many-to-one with `users`
