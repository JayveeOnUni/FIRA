-- Phase 7 responsible AI support and human review governance foundation

BEGIN;

CREATE TABLE IF NOT EXISTS review_notes (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT REFERENCES applications(id) ON DELETE SET NULL,
  applicant_id BIGINT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  note_type VARCHAR(60) NOT NULL DEFAULT 'general',
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE review_notes
  DROP CONSTRAINT IF EXISTS chk_review_notes_note_type_phase7;

ALTER TABLE review_notes
  ADD CONSTRAINT chk_review_notes_note_type_phase7
  CHECK (note_type IN ('general', 'manual_assessment', 'fairness_check', 'data_quality'));

CREATE INDEX IF NOT EXISTS idx_review_notes_job_id
  ON review_notes(job_id);

CREATE INDEX IF NOT EXISTS idx_review_notes_applicant_id
  ON review_notes(applicant_id);

CREATE INDEX IF NOT EXISTS idx_review_notes_created_by
  ON review_notes(created_by);

CREATE INDEX IF NOT EXISTS idx_review_notes_created_at
  ON review_notes(created_at DESC);

CREATE TABLE IF NOT EXISTS match_review_actions (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT REFERENCES applications(id) ON DELETE SET NULL,
  applicant_id BIGINT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  acted_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action_type VARCHAR(80) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE match_review_actions
  DROP CONSTRAINT IF EXISTS chk_match_review_actions_action_type_phase7;

ALTER TABLE match_review_actions
  ADD CONSTRAINT chk_match_review_actions_action_type_phase7
  CHECK (action_type IN ('reviewed', 'shortlisted_by_human', 'deferred', 'needs_more_information'));

CREATE INDEX IF NOT EXISTS idx_match_review_actions_job_id
  ON match_review_actions(job_id);

CREATE INDEX IF NOT EXISTS idx_match_review_actions_applicant_id
  ON match_review_actions(applicant_id);

CREATE INDEX IF NOT EXISTS idx_match_review_actions_acted_by
  ON match_review_actions(acted_by);

CREATE INDEX IF NOT EXISTS idx_match_review_actions_created_at
  ON match_review_actions(created_at DESC);

DROP TRIGGER IF EXISTS trg_review_notes_updated_at ON review_notes;
CREATE TRIGGER trg_review_notes_updated_at
BEFORE UPDATE ON review_notes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_match_review_actions_updated_at ON match_review_actions;
CREATE TRIGGER trg_match_review_actions_updated_at
BEFORE UPDATE ON match_review_actions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

COMMIT;
