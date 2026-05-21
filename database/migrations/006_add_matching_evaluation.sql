-- Phase 8 matching quality evaluation foundation

BEGIN;

CREATE TABLE IF NOT EXISTS match_eval_datasets (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  version VARCHAR(80) NOT NULL DEFAULT 'v1',
  description TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'draft',
  source_notes TEXT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE match_eval_datasets
  DROP CONSTRAINT IF EXISTS chk_match_eval_datasets_status;

ALTER TABLE match_eval_datasets
  ADD CONSTRAINT chk_match_eval_datasets_status
  CHECK (status IN ('draft', 'active', 'archived'));

ALTER TABLE match_eval_datasets
  DROP CONSTRAINT IF EXISTS uq_match_eval_datasets_name_version;

ALTER TABLE match_eval_datasets
  ADD CONSTRAINT uq_match_eval_datasets_name_version
  UNIQUE (name, version);

CREATE INDEX IF NOT EXISTS idx_match_eval_datasets_status
  ON match_eval_datasets(status);

CREATE INDEX IF NOT EXISTS idx_match_eval_datasets_created_at
  ON match_eval_datasets(created_at DESC);

CREATE TABLE IF NOT EXISTS match_eval_dataset_jobs (
  id BIGSERIAL PRIMARY KEY,
  dataset_id BIGINT NOT NULL REFERENCES match_eval_datasets(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE match_eval_dataset_jobs
  DROP CONSTRAINT IF EXISTS uq_match_eval_dataset_jobs_dataset_job;

ALTER TABLE match_eval_dataset_jobs
  ADD CONSTRAINT uq_match_eval_dataset_jobs_dataset_job
  UNIQUE (dataset_id, job_id);

CREATE INDEX IF NOT EXISTS idx_match_eval_dataset_jobs_dataset_id
  ON match_eval_dataset_jobs(dataset_id);

CREATE TABLE IF NOT EXISTS match_eval_dataset_applicants (
  id BIGSERIAL PRIMARY KEY,
  dataset_id BIGINT NOT NULL REFERENCES match_eval_datasets(id) ON DELETE CASCADE,
  applicant_id BIGINT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE match_eval_dataset_applicants
  DROP CONSTRAINT IF EXISTS uq_match_eval_dataset_applicants_dataset_applicant;

ALTER TABLE match_eval_dataset_applicants
  ADD CONSTRAINT uq_match_eval_dataset_applicants_dataset_applicant
  UNIQUE (dataset_id, applicant_id);

CREATE INDEX IF NOT EXISTS idx_match_eval_dataset_applicants_dataset_id
  ON match_eval_dataset_applicants(dataset_id);

CREATE TABLE IF NOT EXISTS match_eval_relevance_labels (
  id BIGSERIAL PRIMARY KEY,
  dataset_id BIGINT NOT NULL REFERENCES match_eval_datasets(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id BIGINT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  relevance_label VARCHAR(40) NOT NULL,
  label_notes TEXT,
  labeled_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  labeled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE match_eval_relevance_labels
  DROP CONSTRAINT IF EXISTS chk_match_eval_relevance_labels_label;

ALTER TABLE match_eval_relevance_labels
  ADD CONSTRAINT chk_match_eval_relevance_labels_label
  CHECK (relevance_label IN ('highly_relevant', 'relevant', 'partially_relevant', 'not_relevant'));

ALTER TABLE match_eval_relevance_labels
  DROP CONSTRAINT IF EXISTS uq_match_eval_relevance_labels_pair;

ALTER TABLE match_eval_relevance_labels
  ADD CONSTRAINT uq_match_eval_relevance_labels_pair
  UNIQUE (dataset_id, job_id, applicant_id);

CREATE INDEX IF NOT EXISTS idx_match_eval_relevance_labels_dataset_id
  ON match_eval_relevance_labels(dataset_id);

CREATE INDEX IF NOT EXISTS idx_match_eval_relevance_labels_job_id
  ON match_eval_relevance_labels(job_id);

CREATE INDEX IF NOT EXISTS idx_match_eval_relevance_labels_labeled_by
  ON match_eval_relevance_labels(labeled_by);

CREATE TABLE IF NOT EXISTS match_eval_runs (
  id BIGSERIAL PRIMARY KEY,
  dataset_id BIGINT NOT NULL REFERENCES match_eval_datasets(id) ON DELETE CASCADE,
  run_name VARCHAR(200) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  methods JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_version VARCHAR(120),
  scoring_config JSONB,
  summary JSONB,
  warnings JSONB,
  error_message TEXT,
  started_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE match_eval_runs
  DROP CONSTRAINT IF EXISTS chk_match_eval_runs_status;

ALTER TABLE match_eval_runs
  ADD CONSTRAINT chk_match_eval_runs_status
  CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial'));

CREATE INDEX IF NOT EXISTS idx_match_eval_runs_dataset_id
  ON match_eval_runs(dataset_id);

CREATE INDEX IF NOT EXISTS idx_match_eval_runs_started_at
  ON match_eval_runs(started_at DESC);

CREATE TABLE IF NOT EXISTS match_eval_run_rankings (
  id BIGSERIAL PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES match_eval_runs(id) ON DELETE CASCADE,
  method_key VARCHAR(80) NOT NULL,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id BIGINT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  rank_position INTEGER NOT NULL,
  score DOUBLE PRECISION NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE match_eval_run_rankings
  DROP CONSTRAINT IF EXISTS uq_match_eval_run_rankings_unique;

ALTER TABLE match_eval_run_rankings
  ADD CONSTRAINT uq_match_eval_run_rankings_unique
  UNIQUE (run_id, method_key, job_id, applicant_id);

CREATE INDEX IF NOT EXISTS idx_match_eval_run_rankings_run_method_job
  ON match_eval_run_rankings(run_id, method_key, job_id, rank_position);

CREATE TABLE IF NOT EXISTS match_eval_metric_results (
  id BIGSERIAL PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES match_eval_runs(id) ON DELETE CASCADE,
  method_key VARCHAR(80) NOT NULL,
  metric_name VARCHAR(80) NOT NULL,
  metric_value DOUBLE PRECISION,
  segment_type VARCHAR(80) NOT NULL DEFAULT 'overall',
  segment_value VARCHAR(120) NOT NULL DEFAULT 'all',
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_eval_metric_results_run_id
  ON match_eval_metric_results(run_id);

CREATE INDEX IF NOT EXISTS idx_match_eval_metric_results_run_method
  ON match_eval_metric_results(run_id, method_key);

DROP TRIGGER IF EXISTS trg_match_eval_datasets_updated_at ON match_eval_datasets;
CREATE TRIGGER trg_match_eval_datasets_updated_at
BEFORE UPDATE ON match_eval_datasets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_match_eval_dataset_jobs_updated_at ON match_eval_dataset_jobs;
CREATE TRIGGER trg_match_eval_dataset_jobs_updated_at
BEFORE UPDATE ON match_eval_dataset_jobs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_match_eval_dataset_applicants_updated_at ON match_eval_dataset_applicants;
CREATE TRIGGER trg_match_eval_dataset_applicants_updated_at
BEFORE UPDATE ON match_eval_dataset_applicants
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_match_eval_relevance_labels_updated_at ON match_eval_relevance_labels;
CREATE TRIGGER trg_match_eval_relevance_labels_updated_at
BEFORE UPDATE ON match_eval_relevance_labels
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_match_eval_runs_updated_at ON match_eval_runs;
CREATE TRIGGER trg_match_eval_runs_updated_at
BEFORE UPDATE ON match_eval_runs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

COMMIT;
