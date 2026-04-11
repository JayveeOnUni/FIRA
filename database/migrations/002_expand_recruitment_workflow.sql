-- Phase 3 recruitment workflow expansion

BEGIN;

ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS education_summary TEXT,
  ADD COLUMN IF NOT EXISTS work_experience_summary TEXT,
  ADD COLUMN IF NOT EXISTS skills_summary TEXT,
  ADD COLUMN IF NOT EXISTS preferred_job_category VARCHAR(120);

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS country VARCHAR(120);

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS qualifications TEXT,
  ADD COLUMN IF NOT EXISTS required_skills TEXT,
  ADD COLUMN IF NOT EXISTS salary VARCHAR(120),
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

UPDATE jobs
SET status = 'published'
WHERE status = 'open';

UPDATE jobs
SET status = 'draft'
WHERE status NOT IN ('draft', 'published', 'closed');

ALTER TABLE jobs
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE jobs
  DROP CONSTRAINT IF EXISTS chk_jobs_status_phase3;

ALTER TABLE jobs
  ADD CONSTRAINT chk_jobs_status_phase3
  CHECK (status IN ('draft', 'published', 'closed'));

UPDATE jobs
SET is_public = TRUE
WHERE status = 'published';

CREATE TABLE IF NOT EXISTS applicant_documents (
  id BIGSERIAL PRIMARY KEY,
  applicant_id BIGINT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL DEFAULT 'resume',
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type VARCHAR(120),
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applicant_documents_applicant_id
  ON applicant_documents(applicant_id);

CREATE INDEX IF NOT EXISTS idx_applicant_documents_uploaded_at
  ON applicant_documents(uploaded_at DESC);

CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  applicant_id BIGINT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'Applied',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_applications_applicant_job UNIQUE (applicant_id, job_id)
);

ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS chk_applications_status_phase3;

ALTER TABLE applications
  ADD CONSTRAINT chk_applications_status_phase3
  CHECK (status IN ('Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Withdrawn'));

CREATE INDEX IF NOT EXISTS idx_applications_applicant_id
  ON applications(applicant_id);

CREATE INDEX IF NOT EXISTS idx_applications_job_id
  ON applications(job_id);

CREATE INDEX IF NOT EXISTS idx_applications_status
  ON applications(status);

CREATE TABLE IF NOT EXISTS application_status_history (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE application_status_history
  DROP CONSTRAINT IF EXISTS chk_application_status_history_new_status_phase3;

ALTER TABLE application_status_history
  ADD CONSTRAINT chk_application_status_history_new_status_phase3
  CHECK (new_status IN ('Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Withdrawn'));

CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id
  ON application_status_history(application_id);

CREATE INDEX IF NOT EXISTS idx_application_status_history_created_at
  ON application_status_history(created_at DESC);

DROP TRIGGER IF EXISTS trg_applicant_documents_updated_at ON applicant_documents;
CREATE TRIGGER trg_applicant_documents_updated_at
BEFORE UPDATE ON applicant_documents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_applications_updated_at ON applications;
CREATE TRIGGER trg_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

COMMIT;
