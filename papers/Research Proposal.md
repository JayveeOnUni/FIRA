# Research Proposal

## A. Basic Information

**Project Title:**  
Development of FIRA: Web-Based Recruitment Platform for Fil International Recruitment Agency with Applicant Tracking and SBERT-Based Candidate-Job Matching

**Keywords:**  
web-based recruitment platform; international recruitment agency; applicant tracking system; candidate-job matching; Sentence-BERT; semantic similarity; natural language processing; responsible AI

**Proponents:**  
III - DCSAD | Group 6 - XLR8

---

## B. Technical Description

### Project Context

Recruitment has increasingly moved toward digital platforms and AI-assisted decision support. Modern recruitment work involves large volumes of text, repeated screening decisions, document handling, applicant monitoring, employer coordination, and status tracking. These conditions make recruitment a suitable domain for integrated information systems that combine public job visibility, applicant submission, ATS workflows, and decision-support tools.

Many recruitment processes remain fragmented. In practice, agency websites often provide only public information, while applicant records, resumes, employer requirements, status updates, and endorsements are managed through separate tools or manual processes. This fragmentation slows screening, reduces traceability, and makes consistent applicant comparison difficult. The problem is more significant for international recruitment agencies because applicants, employers, and agency staff participate in different stages of a multi-step process.

The proposed system, FIRA, addresses this gap by integrating a public recruitment website, role-based applicant/employer/staff modules, ATS status monitoring, and SBERT-based candidate-job matching into one web-based prototype. The matching module is designed as decision support only. It ranks candidates or jobs based on semantic similarity, but final recruitment actions remain under human control.

Recent studies support the use of AI-assisted recruitment systems when they are useful, understandable, and governed by human oversight. However, literature also identifies important risks: incomplete resumes, inconsistent job descriptions, algorithmic bias, overreliance on automated scores, weak explainability, and legal or ethical concerns in automated hiring. Therefore, FIRA includes responsible-use safeguards such as advisory match labels, human review actions, review notes, and reminders that matching scores must not replace recruiter judgment.

---

## C. Objective of the Study

### General Objective

This study aims to design, develop, and evaluate FIRA, a web-based recruitment platform for an international recruitment agency that supports public job browsing, applicant management, employer job posting, ATS monitoring, staff endorsement, and SBERT-based candidate-job matching.

### Specific Objectives

1. Analyze the recruitment workflow, user roles, information requirements, and operational pain points of applicants, employers, and agency staff.
2. Review recent literature and systems related to e-recruitment, applicant tracking, semantic matching, fairness, explainability, and AI-enabled hiring.
3. Design the system architecture, database schema, role-based workflows, and core modules for the public website, applicant module, employer module, agency staff module, ATS, and matching service.
4. Develop the applicant module with registration, login, profile completion, document upload, job browsing, application submission, application tracking, and recommended jobs.
5. Develop the employer module with registration, login, company profile management, job posting, job management, applicant review, and viewing of endorsed or ranked candidates.
6. Develop the agency staff module with applicant monitoring, job and application management, ATS status updates, endorsement, review notes, review actions, audit visibility, and operational monitoring.
7. Implement an SBERT-based matching module that prepares applicant/job text, generates semantic rankings through a FastAPI AI service, stores match scores, and presents advisory explanation aids.
8. Test the system using functional, integration, reliability, performance, security, and dependency-failure test cases.
9. Evaluate selected ISO/IEC 25010 software quality characteristics, particularly functional suitability, usability, performance efficiency, and reliability.
10. Evaluate the matching module using a representative applicant-job dataset, expert relevance judgments, ranking metrics, and baseline comparison against simpler matching approaches.
11. Prepare technical documentation, user guides, test results, evaluation findings, and deployment-readiness notes for academic and organizational use.

---

## D. Scope and Limitations

### Scope

The study covers the design, development, and prototype evaluation of a web-based recruitment platform for the operational context of an international recruitment agency in the Philippines. The system supports online interactions among applicants, employers, and agency staff.

The platform includes:

1. Public-facing pages: Home, About, FAQ, News, Contact, Job Search, and Job Detail.
2. Applicant features: registration, login, profile management, document upload, job browsing, application submission, application tracking, and recommended jobs.
3. Employer features: registration, login, company profile management, job posting, job management, applicant review, ranked applicant view, and endorsed candidate view.
4. Agency staff features: dashboard, applicant records, job records, application monitoring, ATS status updates, status history, endorsement, review notes, review actions, audit visibility, and operational readiness information.
5. Matching features: applicant-job text preparation, SBERT-based semantic ranking, score persistence, cache freshness tracking, lightweight explanation aids, and human review governance.
6. Documentation: architecture notes, database schema, setup guide, user guides, responsible AI guidance, test cases, and quality evaluation support.

### Utilization of the Algorithm

The intelligent component uses Sentence-BERT (SBERT) embeddings and cosine similarity to compare applicant profile text with job requirement text. Applicant text is based mainly on structured profile fields such as skills, work experience, education, preferred job category, and limited document metadata. Job text is based on job title, description, qualifications, required skills, location, employment type, and company context.

The matching output is used only for recommendation, ranking, and shortlisting support. It does not automatically change ATS status, endorse applicants, reject applicants, or make hiring decisions.

### Limitations

The study has the following limitations:

1. The prototype does not claim production-level legal compliance, fairness certification, or bias elimination.
2. Matching quality depends on the completeness and clarity of applicant profile fields and job descriptions.
3. Uploaded document metadata is stored, but full PDF/DOCX resume text extraction is not treated as a completed capability unless separately implemented and tested.
4. The default SBERT model is general-purpose and not fine-tuned on the agency's historical recruitment data.
5. Explanation aids such as shared keywords and relevance labels are heuristic support indicators, not full explanations of the neural model's internal reasoning.
6. The system does not include external job board integration, payroll integration, interview scheduling, messaging, visa processing, or enterprise HR integrations.
7. Prototype performance results are based on controlled local or demonstration conditions and should not be interpreted as enterprise-scale load-test results.
8. Evaluation results may be affected by the number and type of available respondents.

---

## E. List of System Features

The proposed and implemented prototype includes the following major features:

- Public information pages and public job browsing.
- Applicant registration, login, profile management, document upload, applications, and recommended jobs.
- Employer registration, company profile management, job posting, job editing, applicant review, and endorsed candidate view.
- Agency staff dashboard, applicant monitoring, job monitoring, application pipeline monitoring, ATS status updates, endorsement, and review governance.
- Role-based authentication and authorization.
- SBERT-based candidate-job ranking through an external Python AI service.
- Matching score storage, cache freshness metadata, advisory explanation aids, and responsible-use notices.
- Audit and operational monitoring support.
- Functional test cases, reliability reruns, setup documentation, and user guides.

---

## F. Geographical and Temporal Scope

The geographical scope is the operational context of an international recruitment agency in the Philippines and its online interactions with applicants and overseas employers.

The temporal scope covers data gathering, development, testing, and evaluation during Academic Year 2025-2026 to Academic Year 2026-2027.

---

## G. Tools and Technologies

The prototype uses the following technologies:

- React.js with Vite and Tailwind CSS for the frontend.
- Node.js with Express.js for backend APIs and business logic.
- PostgreSQL for structured data storage.
- Python 3.11, FastAPI, and `sentence-transformers` for SBERT-based matching.
- RESTful APIs and JSON for service communication.
- Git-based version control.
- ISO/IEC 25010-aligned evaluation criteria for software quality assessment.

---

## H. Conceptual Model of the Study

The study follows an Input-Process-Output (IPO) conceptual model.

| Input | Process | Output |
|---|---|---|
| Applicant profiles, document metadata, job postings, employer requirements, staff actions, evaluation responses | Data capture, role-based workflow processing, ATS tracking, text preprocessing, SBERT ranking, human review, testing, and quality evaluation | Web-based recruitment prototype, ATS records, ranked candidate-job matches, review notes/actions, test results, evaluation findings, and documentation |

The model emphasizes that AI matching is only one process within a broader recruitment management workflow. Human review remains responsible for recruitment decisions.

---

## I. Evaluation Plan

The system will be evaluated in two levels.

### Software Quality Evaluation

The platform will be evaluated using selected ISO/IEC 25010 characteristics:

1. Functional suitability.
2. Usability.
3. Performance efficiency.
4. Reliability.

Evaluation will use functional test results, usability feedback, prototype performance observations, reliability reruns, and respondent ratings using a Likert-scale instrument.

### Matching Module Evaluation

The matching module should be evaluated using:

1. A representative set of applicant-job pairs.
2. Expert relevance judgments.
3. Baseline comparison against keyword overlap or TF-IDF matching.
4. Ranking metrics such as Precision@5, NDCG@10, or MRR.
5. Qualitative error analysis of poor or questionable matches.

This evaluation is necessary because endpoint functionality alone does not prove that the SBERT ranking is useful for recruitment.

---

## J. Expected Deliverables

The study will produce:

1. A responsive web-based recruitment platform prototype.
2. Public website pages for agency information and job exploration.
3. Applicant, employer, and agency staff modules with role-based access.
4. An ATS workflow for application status monitoring and staff updates.
5. An SBERT-based candidate-job matching service for advisory ranking.
6. Review governance features such as notes, actions, timelines, and export-ready summaries.
7. System architecture, database schema, setup guide, user guides, test cases, quality evaluation support, and responsible AI documentation.
8. Final thesis evaluation results and recommendations for future system improvement.

---

## References

1. Akkasi, A. (2024). Job description parsing with explainable transformer based ensemble models to extract the technical and non-technical skills. *Natural Language Processing Journal, 9*, 100102.

2. Almeida, F., Junca Silva, A., Lopes, S., & Braz, I. (2025). Understanding recruiters' acceptance of artificial intelligence: Insights from the technology acceptance model. *Applied Sciences, 15*(2), 746.

3. Alonso, R., Dessi, D., Meloni, A., & Reforgiato Recupero, D. (2025). A novel approach for job matching and skill recommendation using transformers and the O*NET database. *Big Data Research, 39*, 100509.

4. Bevara, R. V. K., Mannuru, N. R., Karedla, S. P., Lund, B., Xiao, T., Pasem, H., Dronavalli, S. C., & Rupeshkumar, S. (2025). Resume2Vec: Transforming applicant tracking systems with intelligent resume embeddings for precise candidate matching. *Electronics, 14*(4), 794.

5. Celik Ertugrul, D., & Bitirim, S. (2025). Job recommender systems: A systematic literature review, applications, open issues, and challenges. *Journal of Big Data, 12*, 140.

6. Hadzic, B. H. B., Brandner, L. T., Weber, T., & Ratsch, M. (2025). AI-driven active sourcing in recruitment: Addressing contestability in automated hiring systems. *Frontiers in Computer Science, 7*, 1629522.

7. Horodyski, P. (2023). Applicants' perception of artificial intelligence in the recruitment process. *Computers in Human Behavior Reports, 11*, 100303.

8. Iso, H., Pezeshkpour, P., Bhutani, N., & Hruschka, E. (2025). Evaluating bias in LLMs for job-resume matching: Gender, race, and education. In *Proceedings of the 2025 Conference of the Nations of the Americas Chapter of the Association for Computational Linguistics: Human Language Technologies (Volume 3: Industry Track)* (pp. 672-683). Association for Computational Linguistics.

9. Kumar, D., Grosz, T., Rekabsaz, N., Greif, E., & Schedl, M. (2023). Fairness of recommender systems in the recruitment domain: An analysis from technical and legal perspectives. *Frontiers in Big Data, 6*, 1245198.

10. Ligeiro, N., Dias, I., & Moreira, A. (2024). Recruitment and selection process using artificial intelligence: How do candidates react? *Administrative Sciences, 14*(7), 155.

11. Madanchian, M. (2024). From recruitment to retention: AI tools for human resource decision-making. *Applied Sciences, 14*(24), 11750.

12. Mashayekhi, Y., Li, N., Kang, B., Lijffijt, J., & De Bie, T. (2024). A challenge-based survey of e-recruitment recommendation systems. *ACM Computing Surveys, 56*(10).

13. Rosenberger, J., Wolfrum, L., Weinzierl, S., Kraus, M., & Zschech, P. (2025). CareerBERT: Matching resumes to ESCO jobs in a shared embedding space for generic job recommendations. *Expert Systems with Applications, 275*, 127043.

14. Skondras, P., Zervas, P., & Tzimas, G. (2025). Zero-shot resume-job matching with LLMs via structured prompting and semantic embeddings. *Electronics, 14*(24), 4960.

15. Tusquellas, N., Palau, R., & Santiago, R. (2024). Analysis of the potential of artificial intelligence for professional development and talent management: A systematic literature review. *International Journal of Information Management Data Insights, 4*(2), 100288.

16. Xue, X., Wang, J., Ma, B., Ren, J., Zhang, W., Gao, S., Tian, M., Chang, Y., Wang, C., & Wang, H. (2025). Fine-grained semantics-enhanced graph neural network model for person-job fit. *Entropy, 27*(7), 703.

17. Zhang, G., Pan, L., Tang, F., & Yao, F. (2025). Explainable artificial intelligence in the talent recruitment process: A literature review. *Cogent Business & Management, 12*(1), 2570881.
