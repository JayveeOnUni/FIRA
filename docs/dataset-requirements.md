# Dataset Requirements for FIRA

## Purpose

This document defines the datasets required by FIRA: a web-based recruitment platform with applicant tracking and SBERT-based candidate-job matching. The datasets are organized according to system architecture, business logic, AI matching needs, and thesis evaluation requirements.

The datasets fall into three major categories:

1. **Operational datasets** used by the actual recruitment platform.
2. **AI and matching datasets** used by the SBERT-based recommendation and ranking module.
3. **Research and evaluation datasets** used to support thesis validation, ISO/IEC 25010 evaluation, and matching quality assessment.

## 1. Operational Datasets

Operational datasets are required for the platform's normal recruitment workflows. These datasets support authentication, applicant management, employer job posting, ATS tracking, endorsements, audit logs, and administrative monitoring.

### 1.1 User Accounts Dataset

**Purpose:** Stores system users and supports authentication.

| Field | Description |
|---|---|
| user_id | Unique user identifier |
| email | Login email address |
| password_hash | Hashed password |
| role_id | Linked role record |
| first_name | User first name |
| last_name | User last name |
| is_active | Account active/inactive status |
| created_at | Account creation timestamp |
| updated_at | Last update timestamp |

**Used by:** authentication, role guards, audit logging, ownership checks.

### 1.2 Roles Dataset

**Purpose:** Defines available system roles.

| Field | Description |
|---|---|
| role_id | Unique role identifier |
| role_name | Role name, such as `applicant`, `employer`, or `agency_staff` |
| description | Role description |

**Used by:** route protection, authorization, dashboard redirection.

### 1.3 Applicant Profiles Dataset

**Purpose:** Stores applicant information used for profile management, applications, and matching.

| Field | Description |
|---|---|
| applicant_id | Unique applicant identifier |
| user_id | Linked user account |
| phone | Contact number |
| address | Applicant address |
| date_of_birth | Applicant birth date |
| education_summary | Education background summary |
| work_experience_summary | Work experience summary |
| skills_summary | Skills summary |
| preferred_job_category | Preferred job category |
| profile_status | Profile completion or verification status |
| created_at | Record creation timestamp |
| updated_at | Last update timestamp |

**Used by:** applicant dashboard, staff applicant monitoring, matching text preparation.

### 1.4 Applicant Documents Dataset

**Purpose:** Stores metadata for uploaded applicant documents.

| Field | Description |
|---|---|
| document_id | Unique document identifier |
| applicant_id | Linked applicant |
| document_type | Resume, agency form, certificate, or other document type |
| original_filename | Original uploaded file name |
| stored_filename | Internal stored file name |
| storage_path | File storage location |
| mime_type | File MIME type |
| file_size | File size |
| uploaded_at | Upload timestamp |

**Used by:** applicant document management, staff review, audit support.

**Current implementation note:** Uploaded document metadata is stored. Full PDF/DOCX resume body extraction is not treated as a completed matching input unless separately implemented and tested.

### 1.5 Companies Dataset

**Purpose:** Stores company records connected to employer users and job postings.

| Field | Description |
|---|---|
| company_id | Unique company identifier |
| name | Company name |
| description | Company description |
| address | Company address |
| website | Company website |
| contact_number | Company contact number |
| country | Company country |
| created_at | Record creation timestamp |
| updated_at | Last update timestamp |

**Used by:** employer company profile, job posting context, matching text preparation.

### 1.6 Employer Profiles Dataset

**Purpose:** Stores employer user profile information.

| Field | Description |
|---|---|
| employer_id | Unique employer identifier |
| user_id | Linked user account |
| company_id | Linked company |
| job_title | Employer representative's job title |
| created_at | Record creation timestamp |
| updated_at | Last update timestamp |

**Used by:** employer dashboard, company ownership checks, job management.

### 1.7 Agency Staff Profiles Dataset

**Purpose:** Stores agency staff profile information.

| Field | Description |
|---|---|
| staff_profile_id | Unique staff profile identifier |
| user_id | Linked staff user account |
| position | Staff position or assignment |
| created_at | Record creation timestamp |
| updated_at | Last update timestamp |

**Used by:** staff dashboard, ATS updates, endorsements, audit actions.

### 1.8 Job Postings Dataset

**Purpose:** Stores job vacancies and employer requirements.

| Field | Description |
|---|---|
| job_id | Unique job identifier |
| company_id | Linked company |
| title | Job title |
| description | Job description |
| qualifications | Required qualifications |
| required_skills | Required skills |
| location | Job location |
| employment_type | Employment type |
| salary | Salary information if provided |
| status | Draft, published, or closed |
| is_public | Public visibility flag |
| created_by | User who created the job |
| created_at | Record creation timestamp |
| updated_at | Last update timestamp |

**Used by:** public job search, employer job management, applicant applications, matching.

### 1.9 Applications Dataset

**Purpose:** Tracks applicant applications to job postings.

| Field | Description |
|---|---|
| application_id | Unique application identifier |
| applicant_id | Linked applicant |
| job_id | Linked job |
| status | Current ATS status |
| applied_at | Application timestamp |
| last_updated_by | User who last updated the application |
| created_at | Record creation timestamp |
| updated_at | Last update timestamp |

**Used by:** applicant application tracking, staff ATS workflow, employer applicant review.

### 1.10 Application Status History Dataset

**Purpose:** Preserves the timeline of ATS status changes.

| Field | Description |
|---|---|
| status_history_id | Unique history identifier |
| application_id | Linked application |
| old_status | Previous status |
| new_status | Updated status |
| changed_by | User who changed the status |
| note | Optional status-change note |
| created_at | Status-change timestamp |

**Used by:** ATS traceability, staff workflow, applicant status visibility.

### 1.11 Endorsements Dataset

**Purpose:** Records staff-endorsed candidates for job postings.

| Field | Description |
|---|---|
| endorsement_id | Unique endorsement identifier |
| application_id | Linked application, if available |
| applicant_id | Linked applicant |
| job_id | Linked job |
| endorsed_by | Staff user who endorsed the applicant |
| note | Endorsement note |
| status | Active or revoked |
| created_at | Endorsement timestamp |
| updated_at | Last update timestamp |

**Used by:** employer endorsed candidate view, staff endorsement workflow.

### 1.12 Audit Logs Dataset

**Purpose:** Records important system actions for traceability.

| Field | Description |
|---|---|
| audit_log_id | Unique audit log identifier |
| actor_user_id | User who performed the action |
| action_type | Type of action performed |
| target_type | Entity type affected |
| target_id | Entity identifier affected |
| metadata | Additional JSON context |
| created_at | Audit timestamp |

**Used by:** staff monitoring, troubleshooting, governance evidence.

### 1.13 System Settings Dataset

**Purpose:** Stores configurable system values.

| Field | Description |
|---|---|
| setting_key | Unique setting key |
| setting_value | Setting value |
| description | Setting description |
| created_at | Record creation timestamp |
| updated_at | Last update timestamp |

**Used by:** future configuration management and administrative settings.

## 2. AI and Matching Datasets

AI and matching datasets support semantic matching, score persistence, explanation aids, cache freshness, and human review governance.

### 2.1 Applicant Matching Text Dataset

**Purpose:** Stores or derives the text used to represent applicants for matching.

| Field | Description |
|---|---|
| applicant_id | Linked applicant |
| preferred_job_category | Applicant's preferred category |
| skills_summary | Applicant skills text |
| work_experience_summary | Applicant work experience text |
| education_summary | Applicant education text |
| document_metadata_context | Limited document filename/type context |
| combined_applicant_text | Final text prepared for embedding |
| text_hash | Hash of the prepared text |
| generated_at | Text generation timestamp |

**Used by:** embedding generation, applicant-to-job recommendations, ranked applicant lists.

### 2.2 Job Matching Text Dataset

**Purpose:** Stores or derives the text used to represent jobs for matching.

| Field | Description |
|---|---|
| job_id | Linked job |
| title | Job title |
| description | Job description |
| qualifications | Job qualifications |
| required_skills | Required skills |
| location | Job location |
| employment_type | Employment type |
| company_name | Company name |
| combined_job_text | Final text prepared for embedding |
| text_hash | Hash of the prepared text |
| generated_at | Text generation timestamp |

**Used by:** embedding generation, candidate ranking, job recommendations.

### 2.3 Match Scores Dataset

**Purpose:** Stores generated similarity scores between applicants and jobs.

| Field | Description |
|---|---|
| match_score_id | Unique score identifier |
| applicant_id | Linked applicant |
| job_id | Linked job |
| score | Cosine similarity score |
| score_type | Score method, such as `sbert_cosine_similarity` |
| explanation_summary | Human-readable score summary |
| explanation_keywords | Shared or supporting keywords |
| generated_at | Score generation timestamp |
| created_at | Record creation timestamp |
| updated_at | Last update timestamp |

**Used by:** recommendations, ranked applicant views, cache reuse, thesis matching evidence.

### 2.4 Embeddings Metadata Dataset

**Purpose:** Tracks model and source-text freshness for matching.

| Field | Description |
|---|---|
| embedding_metadata_id | Unique metadata identifier |
| entity_type | Applicant or job |
| entity_id | Linked entity identifier |
| source_version | Source text version |
| embedding_model | Model name used |
| text_hash | Hash of source text |
| generated_at | Embedding generation timestamp |
| created_at | Record creation timestamp |
| updated_at | Last update timestamp |

**Used by:** cache validation, recomputation decisions, reproducibility.

### 2.5 Matching Explanation Dataset

**Purpose:** Provides user-facing context for match results.

| Field | Description |
|---|---|
| applicant_id | Linked applicant |
| job_id | Linked job |
| shared_keywords | Keywords appearing in both texts |
| relevance_label | Advisory label |
| score_guidance | Explanation of how to read the score |
| skills_overlap | Matching skill hints |
| qualifications_overlap | Matching qualification hints |
| experience_overlap | Experience-related hints |
| data_quality_warnings | Warnings for sparse or incomplete text |

**Used by:** applicant, employer, and staff matching screens.

**Important note:** These are explanation aids, not full explanations of the neural model's internal reasoning.

### 2.6 Review Notes Dataset

**Purpose:** Captures human reviewer notes tied to applicant-job contexts.

| Field | Description |
|---|---|
| review_note_id | Unique note identifier |
| application_id | Linked application, if available |
| applicant_id | Linked applicant |
| job_id | Linked job |
| created_by | User who created the note |
| note_type | General, manual assessment, fairness check, or data quality |
| note | Review note content |
| created_at | Note timestamp |

**Used by:** human-in-the-loop governance, review traceability, export summaries.

### 2.7 Match Review Actions Dataset

**Purpose:** Records explicit human actions near AI-ranked results.

| Field | Description |
|---|---|
| match_review_action_id | Unique action identifier |
| application_id | Linked application, if available |
| applicant_id | Linked applicant |
| job_id | Linked job |
| acted_by | User who performed the action |
| action_type | Reviewed, shortlisted by human, deferred, or needs more information |
| note | Optional action note |
| created_at | Action timestamp |

**Used by:** governance, auditability, responsible-use evidence.

## 3. Research and Thesis Evaluation Datasets

Research and evaluation datasets are required to defend the thesis. They show that the system was developed from real requirements, tested systematically, and evaluated using appropriate software quality and matching-quality methods.

### 3.1 Requirements Gathering Dataset

**Purpose:** Provides evidence for system requirements.

| Data Item | Description |
|---|---|
| respondent_role | Applicant, employer, staff, or technical evaluator |
| pain_point | Identified recruitment problem |
| current_process | Existing workflow description |
| requested_feature | Suggested system feature |
| priority_level | Importance of the requirement |
| source | Interview, observation, document review, or consultation |

**Used by:** Chapter 3 methodology, requirements analysis, system justification.

### 3.2 Respondent Profile Dataset

**Purpose:** Describes thesis evaluators and supports interpretation of evaluation results.

| Field | Description |
|---|---|
| respondent_id | Anonymous respondent identifier |
| respondent_group | Applicant, employer, agency staff, technical evaluator, or proxy evaluator |
| experience_level | Relevant recruitment or technical experience |
| evaluation_date | Date of evaluation |
| evaluation_scope | Modules evaluated |

**Used by:** ISO/IEC 25010 evaluation reporting.

### 3.3 Functional Test Dataset

**Purpose:** Documents whether core workflows behave as expected.

| Field | Description |
|---|---|
| test_id | Unique test case identifier |
| module | System module tested |
| preconditions | Required starting conditions |
| steps | Test steps |
| expected_result | Expected behavior |
| actual_result | Observed behavior |
| status | Pass, fail, blocked, or pending |
| notes | Additional observations |

**Used by:** functional suitability evidence, defect tracking, retesting.

### 3.4 Reliability Test Dataset

**Purpose:** Shows whether workflows behave consistently across repeated runs.

| Field | Description |
|---|---|
| run_id | Unique test run identifier |
| test_suite | Test suite name |
| run_timestamp | Execution timestamp |
| passed_count | Number of passed tests |
| failed_count | Number of failed tests |
| repeated_run_number | Repeat sequence number |
| failure_notes | Failure details if any |

**Used by:** reliability evaluation.

### 3.5 Performance Test Dataset

**Purpose:** Records prototype response behavior under controlled conditions.

| Field | Description |
|---|---|
| test_id | Unique performance test identifier |
| endpoint_or_page | API endpoint or page tested |
| operation | Action performed |
| record_count | Number of records involved |
| response_time_ms | Response time in milliseconds |
| environment | Local, demo, or hosted environment |
| ai_service_mode | Live AI service or mock service |
| notes | Testing context |

**Used by:** performance efficiency evaluation.

### 3.6 Usability Evaluation Dataset

**Purpose:** Records user feedback on ease of use and task completion.

| Field | Description |
|---|---|
| respondent_id | Anonymous respondent identifier |
| role_tested | Applicant, employer, or staff |
| task_id | Task performed |
| task_completed | Yes or no |
| difficulty_rating | Rating of task difficulty |
| navigation_rating | Rating for navigation clarity |
| interface_rating | Rating for interface clarity |
| comments | Qualitative feedback |

**Used by:** usability evaluation and interface improvement.

### 3.7 ISO/IEC 25010 Evaluation Dataset

**Purpose:** Stores Likert-scale ratings for selected software quality characteristics.

| Field | Description |
|---|---|
| respondent_id | Anonymous respondent identifier |
| quality_characteristic | Functional suitability, usability, performance efficiency, or reliability |
| indicator_id | Evaluation item identifier |
| rating | Likert rating from 1 to 5 |
| comment | Optional respondent comment |
| evaluation_date | Date of evaluation |

**Used by:** weighted mean computation and thesis evaluation results.

### 3.8 Matching Evaluation Dataset

**Purpose:** Validates the usefulness of SBERT-based ranking.

| Field | Description |
|---|---|
| evaluation_pair_id | Unique applicant-job pair identifier |
| applicant_id | Linked applicant |
| job_id | Linked job |
| applicant_text_snapshot | Text used for matching |
| job_text_snapshot | Text used for matching |
| sbert_score | SBERT similarity score |
| sbert_rank | SBERT ranking position |
| evaluator_relevance_label | Expert relevance score |
| evaluator_comment | Optional expert comment |

**Used by:** matching quality analysis, thesis defense, AI module validation.

### 3.9 Baseline Matching Dataset

**Purpose:** Compares SBERT against simpler matching approaches.

| Field | Description |
|---|---|
| evaluation_pair_id | Linked applicant-job pair |
| keyword_overlap_score | Keyword overlap score |
| keyword_overlap_rank | Keyword baseline rank |
| tfidf_score | TF-IDF similarity score |
| tfidf_rank | TF-IDF baseline rank |
| sbert_score | SBERT similarity score |
| sbert_rank | SBERT rank |
| relevance_label | Expert relevance label |

**Used by:** justifying SBERT selection and reporting baseline comparison.

### 3.10 Expert Relevance Judgment Dataset

**Purpose:** Provides ground truth or reference labels for applicant-job relevance.

| Field | Description |
|---|---|
| judgment_id | Unique judgment identifier |
| evaluator_id | Anonymous evaluator identifier |
| applicant_id | Linked applicant |
| job_id | Linked job |
| relevance_score | 0 to 3 relevance label |
| rationale | Reason for rating |
| judged_at | Judgment timestamp |

**Used by:** Precision@K, NDCG@K, MRR, expert acceptability analysis.

### 3.11 Matching Error Analysis Dataset

**Purpose:** Explains weak, incorrect, or questionable matching results.

| Field | Description |
|---|---|
| error_case_id | Unique error case identifier |
| applicant_id | Linked applicant |
| job_id | Linked job |
| expected_relevance | Expert-expected relevance |
| actual_rank | Rank produced by system |
| error_category | Sparse profile, incomplete job, synonym mismatch, missing resume text, generic term dominance, or other |
| analysis_note | Explanation of the error |
| recommended_fix | Suggested system or data improvement |

**Used by:** thesis discussion, limitations, future work.

## 4. Minimum Dataset Package for Thesis Defense

For a defensible academic prototype, the following minimum dataset package is recommended:

| Dataset | Recommended Minimum |
|---|---:|
| Staff account | 1 |
| Employer accounts | 3 |
| Applicant accounts | 30 |
| Company records | 3 |
| Job postings | 10 |
| Applicant applications | 50 |
| Application status history records | 50 |
| Endorsement records | 10 |
| Applicant document metadata records | 30 |
| Applicant-job relevance judgments | 100 |
| Domain evaluators for matching labels | 2 |
| ISO/IEC 25010 respondents | 20 |
| Functional test cases | 15 or more |
| Reliability reruns | 3 or more |
| Performance observations | 10 or more operations |

## 5. Recommended Seed Dataset for Demonstration

A demonstration dataset should show the complete recruitment workflow.

Recommended contents:

1. One agency staff account.
2. Three employer accounts connected to three companies.
3. Ten published jobs across different categories.
4. Thirty applicant accounts with varied skills, education, and work experience.
5. Fifty applications spread across the published jobs.
6. ATS statuses covering `Applied`, `Under Review`, `Verified`, `Shortlisted`, `Endorsed`, `Rejected`, and `Withdrawn`.
7. Ten endorsements created by agency staff.
8. Match scores for applicant-job pairs.
9. Review notes and match review actions showing human oversight.
10. Audit logs for login, job creation, application submission, status updates, endorsements, and matching review actions.

## 6. Dataset Quality Requirements

The datasets should satisfy the following quality requirements:

1. **Completeness:** Required fields must be populated for core workflows.
2. **Consistency:** Job categories, skills, statuses, and role names must use consistent wording.
3. **Traceability:** Applications, endorsements, review notes, and audit logs must link back to users, applicants, and jobs.
4. **Representativeness:** Applicant and job records should reflect realistic recruitment scenarios.
5. **Privacy:** Real applicant data must be anonymized or replaced with synthetic records for defense and demonstration.
6. **Reproducibility:** Matching evaluation records should preserve text snapshots, model name, score, and timestamp.
7. **Separation of concerns:** Operational test data should not be confused with expert-labeled matching evaluation data.

## 7. Priority Implementation Order

If dataset preparation time is limited, prepare datasets in this order:

1. User accounts, roles, applicants, companies, employers, and jobs.
2. Applications and ATS status history.
3. Applicant document metadata.
4. Endorsements, review notes, and match review actions.
5. Match scores and embeddings metadata.
6. Functional, reliability, and performance test datasets.
7. ISO/IEC 25010 evaluation responses.
8. Expert-labeled matching evaluation dataset.
9. Baseline matching comparison dataset.
10. Matching error analysis dataset.

## 8. Key Thesis Defense Reminder

Operational data proves that the recruitment platform can run. Test data proves that workflows behave correctly. Evaluation data proves that users find the system acceptable. Matching evaluation data proves whether SBERT ranking is useful.

These must not be treated as the same evidence. A successful matching endpoint response is not enough to prove AI matching quality. The thesis should include expert-labeled applicant-job pairs, baseline comparison, and ranking metrics to defend the SBERT component.
