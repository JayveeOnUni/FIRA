-- Phase 4 agency staff operations and ATS workflow expansion

BEGIN;

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS last_updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS chk_applications_status_phase3;

ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS chk_applications_status_phase4;

ALTER TABLE applications
  ADD CONSTRAINT chk_applications_status_phase4
  CHECK (status IN ('Applied', 'Under Review', 'Verified', 'Shortlisted', 'Endorsed', 'Rejected', 'Withdrawn'));

ALTER TABLE application_status_history
  DROP CONSTRAINT IF EXISTS chk_application_status_history_new_status_phase3;

ALTER TABLE application_status_history
  DROP CONSTRAINT IF EXISTS chk_application_status_history_new_status_phase4;

ALTER TABLE application_status_history
  ADD CONSTRAINT chk_application_status_history_new_status_phase4
  CHECK (new_status IN ('Applied', 'Under Review', 'Verified', 'Shortlisted', 'Endorsed', 'Rejected', 'Withdrawn'));

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE TABLE IF NOT EXISTS endorsements (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT REFERENCES applications(id) ON DELETE SET NULL,
  applicant_id BIGINT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  endorsed_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  note TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE endorsements
  DROP CONSTRAINT IF EXISTS chk_endorsements_status_phase4;

ALTER TABLE endorsements
  ADD CONSTRAINT chk_endorsements_status_phase4
  CHECK (status IN ('active', 'revoked'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_endorsements_applicant_job
  ON endorsements(applicant_id, job_id);

CREATE INDEX IF NOT EXISTS idx_applications_status_updated_at
  ON applications(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_last_updated_by
  ON applications(last_updated_by);

CREATE INDEX IF NOT EXISTS idx_endorsements_job_id
  ON endorsements(job_id);

CREATE INDEX IF NOT EXISTS idx_endorsements_application_id
  ON endorsements(application_id);

CREATE INDEX IF NOT EXISTS idx_endorsements_endorsed_by
  ON endorsements(endorsed_by);

CREATE INDEX IF NOT EXISTS idx_endorsements_created_at
  ON endorsements(created_at DESC);

DROP TRIGGER IF EXISTS trg_endorsements_updated_at ON endorsements;
CREATE TRIGGER trg_endorsements_updated_at
BEFORE UPDATE ON endorsements
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

COMMIT;
