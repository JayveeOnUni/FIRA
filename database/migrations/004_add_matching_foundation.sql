-- Phase 5 SBERT matching foundation

BEGIN;

CREATE TABLE IF NOT EXISTS match_scores (
  id BIGSERIAL PRIMARY KEY,
  applicant_id BIGINT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  score DOUBLE PRECISION NOT NULL,
  score_type VARCHAR(80) NOT NULL DEFAULT 'sbert_cosine_similarity',
  explanation_summary TEXT,
  explanation_keywords JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE match_scores
  DROP CONSTRAINT IF EXISTS uq_match_scores_applicant_job_score_type;

ALTER TABLE match_scores
  ADD CONSTRAINT uq_match_scores_applicant_job_score_type
  UNIQUE (applicant_id, job_id, score_type);

CREATE INDEX IF NOT EXISTS idx_match_scores_job_id_score
  ON match_scores(job_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_match_scores_applicant_id_score
  ON match_scores(applicant_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_match_scores_generated_at
  ON match_scores(generated_at DESC);

CREATE TABLE IF NOT EXISTS embeddings_metadata (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(30) NOT NULL,
  entity_id BIGINT NOT NULL,
  source_version VARCHAR(80),
  embedding_model VARCHAR(150) NOT NULL,
  text_hash VARCHAR(128),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE embeddings_metadata
  DROP CONSTRAINT IF EXISTS chk_embeddings_metadata_entity_type;

ALTER TABLE embeddings_metadata
  ADD CONSTRAINT chk_embeddings_metadata_entity_type
  CHECK (entity_type IN ('applicant', 'job'));

ALTER TABLE embeddings_metadata
  DROP CONSTRAINT IF EXISTS uq_embeddings_metadata_entity;

ALTER TABLE embeddings_metadata
  ADD CONSTRAINT uq_embeddings_metadata_entity
  UNIQUE (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_embeddings_metadata_generated_at
  ON embeddings_metadata(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_embeddings_metadata_model
  ON embeddings_metadata(embedding_model);

DROP TRIGGER IF EXISTS trg_match_scores_updated_at ON match_scores;
CREATE TRIGGER trg_match_scores_updated_at
BEFORE UPDATE ON match_scores
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_embeddings_metadata_updated_at ON embeddings_metadata;
CREATE TRIGGER trg_embeddings_metadata_updated_at
BEFORE UPDATE ON embeddings_metadata
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

COMMIT;
