# Matching Workflow (Enhanced Through Phase 7)

## 1. Matching Inputs
Applicant matching text combines:
- preferred job category
- skills summary
- work experience summary
- education summary
- applicant name context
- resume/document filename metadata (as lightweight context only)

The current prototype does not perform full PDF/DOCX resume body extraction for matching. Any thesis or defense discussion should describe matching as profile-field-based unless resume text extraction is later implemented and tested.

Job matching text combines:
- job title
- job description
- qualifications
- required skills
- location
- employment type
- company name

## 2. Text Preprocessing
- Normalize to lowercase
- Collapse repeated whitespace
- Remove noisy punctuation while preserving useful technical tokens (`c++`, `c#`, `api/v1`)
- Build deterministic labeled segments (`Skills: ... | Work Experience: ...`)

The same normalization approach is applied consistently before embedding and keyword-overlap extraction.

## 3. Embedding Generation Flow
1. Backend prepares query/candidate texts.
2. Backend calls AI service (`POST /v1/match/rank`).
3. AI service loads SBERT model (`all-MiniLM-L6-v2`) and encodes query + candidates.
4. Embeddings are normalized for cosine scoring.

## 4. Similarity Scoring Flow
1. AI service computes cosine similarity (dot product of normalized vectors).
2. Candidates are sorted descending by score.
3. Basic explanation payload is generated per candidate:
  - shared keyword list
  - shared keyword count
  - summary string
4. Backend enriches explanation for UI/governance use:
  - relevance label and score guidance
  - overlap hints (skills, qualifications, experience)
  - data-quality warning hints for sparse text inputs

## 5. Ranking Flows
### Applicant -> Job Recommendations
- Endpoint: `GET /api/matching/applicant/recommended-jobs`
- Scope: authenticated applicant, own recommendations only
- Candidate set: published, public jobs

### Employer -> Ranked Applicants per Job
- Endpoint: `GET /api/matching/employer/jobs/:jobId/ranked-applicants`
- Scope: authenticated employer, own jobs only
- Candidate set: applicants already applied to that job

### Staff -> Ranked Applicants per Job
- Endpoint: `GET /api/matching/staff/jobs/:jobId/ranked-applicants`
- Scope: agency staff
- Candidate set: applicants already applied to that job

## 6. Persistence/Caching Strategy
- `match_scores` stores latest score and explanation summary per applicant-job pair.
- `embeddings_metadata` stores text hash and model metadata per entity (`applicant` or `job`).
- Backend checks metadata/hash freshness and cached score age before reusing cached scores.
- `refresh=true` forces recomputation through the AI service.
- Phase 7 optimization: partial cache reuse with selective recompute for only uncached candidates.

## 7. Governance and Human Review Support (Phase 7)
- `match_review_actions` captures explicit reviewer actions (`reviewed`, `shortlisted_by_human`, `deferred`, `needs_more_information`).
- `review_notes` captures reviewer notes tied to job-applicant context.
- Review timeline endpoint provides traceability for employer/staff reviewers.
- Review summary export endpoint provides CSV-ready governance artifacts.

## 8. Role Visibility Rules
- Applicant: can only view own recommendations.
- Employer: can only view ranked applicants for own company jobs.
- Agency staff: can view ranked applicants for jobs via staff routes.
- No matching endpoint performs ATS status changes or endorsements.

## 9. Decision-Support Constraint
Matching is explicitly presented as decision support only.  
Human users (staff/employer) keep full control over ATS transitions, endorsements, and final hiring actions.

## 10. Evaluation Constraint
Functional endpoint tests only prove that matching routes, AI-service calls, caching, and persistence work. They do not prove ranking quality.

For thesis evaluation, matching quality should be measured with:
- labeled applicant-job pairs
- baseline comparison against keyword overlap or TF-IDF
- ranking metrics such as Precision@5 and NDCG@10
- qualitative error analysis

Raw cosine similarity thresholds must not be treated as universal hiring categories without calibration on representative data.
