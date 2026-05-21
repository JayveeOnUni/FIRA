# CHAPTER 3

# RESEARCH METHODOLOGY

## 3.1 Chapter Overview

This chapter presents the research design, system development methodology, data-gathering procedure, system architecture, algorithm design, testing procedure, evaluation criteria, and ethical safeguards used in the development of FIRA: a web-based recruitment platform for Fil International Recruitment Agency with Applicant Tracking System (ATS) support and SBERT-based candidate-job matching.

The study is treated as a developmental research project with a descriptive-evaluative component. The developmental component covers the design and implementation of the working prototype. The descriptive component documents the recruitment workflow, user requirements, and operational pain points of applicants, employers, and agency staff. The evaluative component determines whether the prototype satisfies selected software quality characteristics and whether the matching module provides useful decision-support output under prototype conditions.

This chapter intentionally separates general system quality evaluation from algorithm evaluation. Functional correctness alone is not sufficient for a system whose title includes SBERT-based candidate-job matching. The matching component must also be evaluated through ranking-oriented measures, expert review, and comparison against simpler baseline approaches.

## 3.2 Research Design

The study uses a developmental research design because its primary output is a working software prototype. Developmental research is appropriate for studies that design, build, test, and evaluate a technological solution for a defined organizational context.

The study also includes a descriptive-evaluative design. The descriptive portion identifies the existing recruitment process, information requirements, user roles, and workflow problems. The evaluative portion measures the quality of the developed system using selected ISO/IEC 25010 characteristics and evaluates the practical usefulness of the SBERT-based matching module.

The research design covers the following major activities:

1. Analyze the recruitment workflow and user requirements of applicants, employers, and agency staff.
2. Design the system architecture, database schema, role-based modules, and recruitment workflows.
3. Develop the public website, applicant module, employer module, agency staff module, ATS features, and matching module.
4. Implement SBERT-based semantic matching through an external AI service connected to the backend through REST APIs.
5. Test the system through functional, integration, reliability, performance, security, and usability-oriented procedures.
6. Evaluate selected ISO/IEC 25010 quality characteristics: functional suitability, usability, performance efficiency, and reliability.
7. Evaluate the matching module using ranking metrics, expert relevance review, and baseline comparison.

## 3.3 Research Locale and Participants

The research is situated in the operational context of an international recruitment agency in the Philippines. The system is designed for three stakeholder groups:

1. **Applicants** who register, complete profiles, upload documents, browse jobs, apply for vacancies, and monitor application status.
2. **Employers** who register company accounts, maintain company profiles, create job postings, and review applicants or endorsed candidates.
3. **Agency staff** who manage applicant records, verify applications, update ATS statuses, endorse candidates, review matching results, and monitor operational activity.

For evaluation, the study should include representatives from each user group. If access to real employers or applicants is limited, the study may use qualified proxy evaluators, but the paper must disclose this limitation. The recommended minimum respondent distribution is:

| Respondent Group | Recommended Minimum | Evaluation Focus |
|---|---:|---|
| Applicants or applicant proxies | 10 | Registration, profile, job search, application tracking, recommended jobs |
| Employers or employer proxies | 5 | Company profile, job posting, applicant review, endorsed candidates |
| Agency staff or recruitment-domain evaluators | 3 | ATS workflow, endorsement, review governance, reports, matching usefulness |
| Technical evaluators | 2 | Architecture, security, maintainability, API behavior |

The final manuscript must report the actual number of respondents, their roles, selection method, and whether they are real target users or proxy evaluators.

## 3.4 Data-Gathering Procedure

The study uses the following data-gathering methods:

1. **Document review** of the proposal, related literature, workflow notes, system requirements, database schema, and implementation documents.
2. **Workflow analysis** of applicant registration, job posting, application submission, ATS status monitoring, endorsement, and review processes.
3. **User consultation or structured interview** with available stakeholders to identify pain points and validate module requirements.
4. **Prototype observation** where evaluators perform role-specific tasks and report usability, correctness, and workflow issues.
5. **System testing evidence** from functional test cases, reliability reruns, build checks, API response observations, and dependency-failure checks.
6. **Matching evaluation evidence** from a prepared set of applicant-job pairs rated for relevance by domain evaluators.

The requirement-gathering output is translated into functional requirements, role-based access rules, database entities, API endpoints, user-interface flows, and test cases.

## 3.5 System Development Methodology

The study uses an Agile-inspired iterative development process. The process is considered Agile-inspired rather than a full industrial Scrum implementation because the project is a student prototype with limited team size, fixed academic deadlines, and controlled evaluation conditions.

The development process follows these stages:

### 3.5.1 Planning

The researchers define the project objectives, scope, limitations, user roles, target modules, development tools, expected outputs, and evaluation criteria. Planning outputs include the proposal, initial module breakdown, technology stack, and development roadmap.

### 3.5.2 Requirements Analysis

The researchers identify functional and non-functional requirements for the three main user groups.

Applicants require registration, login, profile completion, document upload, job browsing, application submission, application status tracking, and job recommendations.

Employers require registration, login, company profile management, job creation, job management, applicant review, and viewing of endorsed or ranked candidates.

Agency staff require access to applicant records, job records, application pipelines, ATS status updates, status history, endorsements, review actions, notes, audit information, and operational monitoring.

### 3.5.3 System Design

The system design includes architecture, database schema, role-based access control, data flow, API structure, interface layout, matching workflow, and governance workflow.

The prototype is organized into three major layers:

1. **Public Website Layer**: home, about, FAQ, news, contact, job search, and public job detail pages.
2. **Recruitment Management Layer**: applicant, employer, and agency staff modules, including ATS and endorsement workflows.
3. **Intelligent Matching Layer**: text preparation, SBERT embedding generation, cosine similarity scoring, ranking, caching, explanation hints, and human review records.

The implemented system uses a React + Vite frontend, Node.js + Express backend, PostgreSQL database, and Python FastAPI AI service.

### 3.5.4 Development

Development is divided into incremental modules:

1. Public website and job browsing.
2. Authentication and role-based access.
3. Applicant profile, document metadata, and applications.
4. Employer company profile and job management.
5. Agency staff ATS operations and endorsement workflow.
6. Matching service integration.
7. Responsible-use features such as review actions, review notes, advisory labels, and data-quality warnings.
8. Diagnostics, health checks, audit summaries, and deployment-readiness support.

### 3.5.5 Testing and Iteration

Each module is tested after implementation. Defects are recorded, corrected, and retested. The testing process includes functional workflow tests, integration checks, reliability reruns, dependency-failure handling, and manual review of the user interface.

### 3.5.6 Evaluation and Documentation

The completed prototype is evaluated using selected ISO/IEC 25010 criteria and matching-specific evaluation measures. Documentation includes setup instructions, user guides, architecture notes, database schema, matching workflow, responsible AI guidance, test cases, and quality evaluation evidence.

## 3.6 System Architecture

The system uses a three-service architecture:

```text
[React Client]
      |
      | REST/JSON with cookie-based authentication
      v
[Express API Server]
      |                         \
      | SQL                      \ HTTP/JSON
      v                           v
[PostgreSQL Database]      [FastAPI AI Service]
```

The frontend is a route-driven single-page application with public routes and protected dashboard routes for applicants, employers, and agency staff. The backend exposes REST endpoints for authentication, jobs, applications, applicant records, employer records, agency staff workflows, ATS operations, matching, health checks, and diagnostics. PostgreSQL serves as the transactional source of truth. The AI service generates embeddings and ranked matches using SBERT.

The backend remains the authority for authentication, authorization, data ownership, workflow changes, and persistence. The AI service does not update ATS statuses, create endorsements, or make hiring decisions.

## 3.7 Database and Data Management Design

The database supports identity management, recruitment workflow, matching records, and governance records. Core tables include:

1. `roles` and `users` for identity and role mapping.
2. `applicants`, `employers`, `companies`, and `agency_staff_profiles` for role-specific profiles.
3. `jobs` for job postings.
4. `applications` and `application_status_history` for ATS tracking.
5. `applicant_documents` for uploaded document metadata.
6. `endorsements` for staff-endorsed candidate records.
7. `match_scores` and `embeddings_metadata` for matching results and cache freshness.
8. `review_notes` and `match_review_actions` for human review governance.
9. `audit_logs` for traceability of key actions.

The schema uses constraints and indexes to prevent duplicate applications, preserve ATS history, support role-safe lookups, and retrieve ranked matching results efficiently.

The current prototype stores document metadata and uploaded files. Matching text is mainly derived from structured applicant profile fields and job fields, with uploaded document filename metadata used only as lightweight context. Full PDF/DOCX resume text extraction is a recommended future enhancement and should not be overstated as already implemented unless added to the system.

## 3.8 SBERT-Based Matching Methodology

### 3.8.1 Matching Objective

The matching module provides decision-support rankings between applicant profiles and job postings. It does not replace recruiter judgment and does not automatically approve, reject, endorse, or hire applicants.

### 3.8.2 Matching Inputs

Applicant matching text combines available structured profile fields, including:

1. Preferred job category.
2. Skills summary.
3. Work experience summary.
4. Education summary.
5. Applicant name context.
6. Document filename metadata as limited supporting context.

Job matching text combines:

1. Job title.
2. Job description.
3. Qualifications.
4. Required skills.
5. Location.
6. Employment type.
7. Company name.

### 3.8.3 Text Preprocessing

The system normalizes matching text before embedding generation. Preprocessing includes lowercasing, whitespace cleanup, removal of noisy punctuation, preservation of useful technical tokens, and construction of deterministic labeled segments such as `Skills`, `Work Experience`, and `Qualifications`.

Preprocessing is designed to reduce formatting noise while preserving meaningful recruitment terms. The study does not claim advanced resume parsing, named-entity extraction, or skill taxonomy normalization in the current prototype.

### 3.8.4 Embedding Generation

The AI service uses the `sentence-transformers/all-MiniLM-L6-v2` model by default. The model generates vector embeddings for applicant and job text. The model is selected because it is lightweight, locally deployable, widely used for semantic similarity tasks, and practical for prototype hardware constraints.

The limitation is that the model is general-purpose and not specifically trained on Philippine international recruitment data. Therefore, the system should be evaluated with actual or representative recruitment examples before claiming strong matching accuracy.

### 3.8.5 Similarity Scoring and Ranking

The system computes cosine similarity between normalized embeddings. Candidates or jobs are ranked in descending order of similarity score.

The study must avoid treating fixed cosine ranges as universal quality labels. Similarity thresholds depend on the model, text length, domain vocabulary, and dataset. Any labels such as "high match" or "moderate match" should be treated as advisory UI guidance and calibrated using evaluation data.

### 3.8.6 Explanation and Governance Support

The system provides lightweight explanation aids such as shared keywords, relevance labels, score guidance, overlap hints, and data-quality warnings. These are not full explanations of the neural model's internal reasoning. They are interface-level aids that help users inspect why a match may appear relevant.

Human review is supported through review actions, review notes, review timelines, and exportable summaries. These records are intended to reduce blind reliance on AI scores and preserve traceability for employer and staff review.

## 3.9 Matching Evaluation Plan

Because the project title includes SBERT-based matching, the matching module must be evaluated separately from ordinary functional testing.

### 3.9.1 Evaluation Dataset

The researchers should prepare a representative matching dataset composed of applicant-job pairs. The dataset may use anonymized real records, synthetic records based on realistic recruitment scenarios, or a combination of both. The final paper must disclose which type of data was used.

Recommended minimum dataset:

| Item | Recommended Minimum |
|---|---:|
| Job postings | 10 |
| Applicant profiles | 30 |
| Applicant-job relevance judgments | 100 |
| Domain evaluators for relevance labels | 2 |

Each applicant-job pair should be labeled using a relevance scale, for example:

| Score | Meaning |
|---:|---|
| 0 | Not relevant |
| 1 | Weakly relevant |
| 2 | Moderately relevant |
| 3 | Highly relevant |

If only one evaluator is available, the study must report this as a limitation. If two or more evaluators are available, the study should report agreement or resolve disagreements through discussion.

### 3.9.2 Baseline Comparison

SBERT should be compared against simpler approaches to justify its use. Recommended baselines are:

1. Keyword overlap count.
2. TF-IDF cosine similarity.
3. SBERT cosine similarity.

The study does not need to prove that SBERT is universally superior. It must show whether SBERT improves ranking quality for the prototype dataset or explain cases where it does not.

### 3.9.3 Ranking Metrics

Recommended metrics include:

| Metric | Purpose |
|---|---|
| Precision@K | Measures how many top-ranked results are relevant |
| Recall@K | Measures whether relevant candidates appear in the top results |
| NDCG@K | Measures ranking quality using graded relevance |
| MRR | Measures how quickly the first relevant result appears |
| Expert acceptability rate | Measures whether domain evaluators consider top results usable |

For a thesis prototype, Precision@5 and NDCG@10 are sufficient minimum metrics if the dataset is small.

### 3.9.4 Qualitative Error Analysis

The researchers should manually inspect incorrect or questionable matches and classify failure causes, such as:

1. Sparse applicant profile.
2. Incomplete job description.
3. Missing resume text extraction.
4. Ambiguous job title.
5. Skill synonym mismatch.
6. Overweighting of general terms.
7. Domain mismatch between local recruitment language and model training data.

This error analysis is important because it identifies practical system limitations and future improvement areas.

## 3.10 Testing Procedure

The system undergoes several testing procedures to verify correctness, integration, reliability, usability, performance, and safe failure behavior.

### 3.10.1 Unit Testing

Unit testing verifies individual functions and validation rules, including login validation, registration payload validation, job payload validation, upload validation, role checks, status transitions, text normalization, and score interpretation helpers.

### 3.10.2 Integration Testing

Integration testing verifies interactions among frontend, backend, database, and AI service. Example integration scenarios include:

1. Applicant registration creates a user and applicant profile.
2. Employer job creation makes the job visible in public listings when published.
3. Applicant application creates an ATS record.
4. Staff status update creates status history.
5. Matching endpoints retrieve data, call the AI service, return rankings, and preserve ATS state.
6. AI service failure returns a controlled dependency error instead of corrupting workflow data.

### 3.10.3 Functional Testing

Functional testing verifies whether system features meet expected requirements.

| Module | Test Scenario | Expected Result |
|---|---|---|
| Authentication | User registers or logs in with valid credentials | Session is created and role is returned |
| Role Guard | User accesses unauthorized dashboard/API route | Access is denied |
| Applicant Profile | Applicant updates profile fields | Profile is saved and retrievable |
| Document Upload | Applicant uploads an allowed document | File metadata is stored and listed |
| Job Search | Public user searches or filters jobs | Relevant published jobs are displayed |
| Job Application | Applicant applies to a job | Application record is created |
| Duplicate Application | Applicant repeats the same application | Duplicate is blocked |
| Employer Job Posting | Employer creates or updates a job | Job record is saved under employer company |
| ATS Status Update | Staff updates application status | Current status and history are recorded |
| Endorsement | Staff endorses an applicant | Endorsement record is created |
| Matching | System ranks candidates or jobs | Ranked results and advisory explanations are returned |
| Decision-Support Integrity | Matching is invoked after ATS updates | ATS status remains unchanged by AI output |

### 3.10.4 Usability Testing

Usability testing asks evaluators to perform role-specific tasks and rate the system. Evaluation should cover navigation clarity, ease of completing tasks, readability, form clarity, error messages, information organization, and confidence in using matching outputs.

Task completion observations should be recorded when possible, including failed tasks, confusion points, and suggestions.

### 3.10.5 Performance Testing

Performance testing measures response time under controlled prototype conditions. The final paper should report:

1. Testing environment.
2. Number of test records.
3. Network condition.
4. API response times for common operations.
5. Matching response time with candidate count.
6. Whether AI responses used live model inference or mock service.

Prototype timing results must not be presented as production-scale benchmarks unless load testing is performed.

### 3.10.6 Reliability Testing

Reliability testing verifies whether workflows behave consistently across repeated runs. Recommended checks include repeated API workflow runs, duplicate prevention, persistence of ATS history, repeated matching calls, and graceful handling of AI service unavailability.

### 3.10.7 Security and Access-Control Testing

Security testing verifies baseline protections, including:

1. Password hashing.
2. HttpOnly cookie-based session handling.
3. Role-protected API routes.
4. Ownership checks for applicant and employer resources.
5. Upload file type and size restrictions.
6. Input validation.
7. Baseline HTTP security headers.
8. Production configuration checks for required secrets.

The study does not claim enterprise-grade penetration testing unless such testing is conducted.

## 3.11 ISO/IEC 25010 Evaluation Criteria

The system is evaluated using selected ISO/IEC 25010 characteristics: functional suitability, usability, performance efficiency, and reliability.

### 3.11.1 Functional Suitability

Functional suitability evaluates whether the system provides functions that meet stated needs.

Sample indicators:

1. The system provides required modules for applicants, employers, and agency staff.
2. Applicants can submit profiles, documents, and applications.
3. Employers can manage company profiles and job postings.
4. Agency staff can manage applications, ATS statuses, and endorsements.
5. The system generates candidate-job match rankings.
6. Matching outputs do not automatically change hiring or ATS decisions.

### 3.11.2 Usability

Usability evaluates whether users can understand and operate the system effectively.

Sample indicators:

1. Navigation is clear and consistent.
2. Forms are understandable.
3. Important recruitment information is easy to find.
4. Error messages guide the user toward correction.
5. Matching results are presented as advisory and understandable.

### 3.11.3 Performance Efficiency

Performance efficiency evaluates response time and resource behavior under prototype conditions.

Sample indicators:

1. Pages and API requests respond within acceptable time during local testing.
2. Job search and filtering are responsive.
3. Application submission and ATS updates complete without unnecessary delay.
4. Matching results are generated within a reasonable time for the tested candidate volume.
5. Cached matching results are reused when inputs have not changed.

### 3.11.4 Reliability

Reliability evaluates whether the system performs consistently and handles errors without data loss.

Sample indicators:

1. Records are saved accurately.
2. Application status history is preserved.
3. Invalid inputs are rejected safely.
4. Repeated workflow tests produce consistent results.
5. The system returns a clear error when the AI service is unavailable.

## 3.12 Evaluation Instrument and Statistical Treatment

The ISO/IEC 25010 evaluation instrument should use a five-point Likert scale:

| Scale | Verbal Interpretation |
|---:|---|
| 5 | Strongly Agree |
| 4 | Agree |
| 3 | Neutral |
| 2 | Disagree |
| 1 | Strongly Disagree |

Weighted mean is used to summarize responses for each indicator and quality characteristic:

```text
Weighted Mean = sum(frequency x scale value) / total number of responses
```

Recommended interpretation ranges:

| Weighted Mean Range | Interpretation |
|---:|---|
| 4.21-5.00 | Very Acceptable |
| 3.41-4.20 | Acceptable |
| 2.61-3.40 | Moderately Acceptable |
| 1.81-2.60 | Less Acceptable |
| 1.00-1.80 | Not Acceptable |

The final paper should report mean scores per ISO/IEC 25010 characteristic and, when possible, separate results by respondent group.

## 3.13 Ethical, Privacy, and Responsible AI Considerations

The system handles personal and recruitment-related data, including names, contact information, profiles, work experience, education, skills, applications, and uploaded document metadata. The study must apply the following safeguards:

1. Collect only information needed for the prototype.
2. Use consent-based evaluation and disclose how data will be used.
3. Avoid exposing applicant records to unauthorized users.
4. Restrict employer access to jobs and applicants associated with their company.
5. Restrict staff-only monitoring and governance functions to agency staff.
6. Avoid using AI scores as automatic hiring, rejection, or endorsement decisions.
7. Label matching outputs as advisory.
8. Record human review actions where matching results influence shortlist discussions.
9. Avoid claiming bias elimination, legal compliance certification, or fairness certification.
10. Use anonymized or synthetic records for defense demonstrations when real data is not permitted.

The system's responsible AI position is decision support. High scores should not be treated as automatic qualification, and low scores should not be used as the sole basis for rejection.

## 3.14 Scope and Limitations of the Methodology

The methodology is appropriate for prototype development and academic evaluation, but it has limitations:

1. The system is not certified for production recruitment compliance.
2. AI matching quality depends on the completeness and clarity of applicant and job text.
3. The current prototype does not perform full resume text extraction unless extended beyond the present implementation.
4. The matching model is general-purpose and not fine-tuned on the agency's historical hiring data.
5. Fairness awareness is supported through warnings and review governance, but formal fairness auditing is not yet implemented.
6. Performance results from local tests do not represent enterprise-scale load behavior.
7. Respondent evaluation results may be limited if real employers, applicants, or agency staff are unavailable.

## 3.15 Summary

This chapter defined the methodology for developing and evaluating the FIRA recruitment platform. The study uses a developmental and descriptive-evaluative design, an Agile-inspired development process, a three-service architecture, structured database design, SBERT-based semantic ranking, and ISO/IEC 25010-aligned software evaluation.

The chapter also establishes that the matching module must be evaluated through ranking metrics and baseline comparison, not merely through functional endpoint testing. This distinction is necessary because the system's intelligent matching feature is central to the study. The methodology therefore treats FIRA as both a recruitment management prototype and an AI-assisted decision-support system with clear human oversight, privacy safeguards, and prototype limitations.
