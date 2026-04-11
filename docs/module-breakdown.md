# Module Breakdown

## 1. Public Website Module
**Purpose:** Present agency information and public job opportunities.  
**Phase 1 Outputs:** route/page placeholders, shared public layout, navigation shell.  
**Planned Features:** Home, About, FAQ, News, Contact, Job Search.

## 2. Applicant Module
**Purpose:** Manage applicant onboarding and application lifecycle visibility.  
**Phase 1 Outputs:** module placeholders in frontend/backend, entity planning references.  
**Planned Features:** registration/login, profile, resume upload, form submission, job browsing, application tracking.

## 3. Employer Module
**Purpose:** Enable employers to publish vacancies and review candidates.  
**Phase 1 Outputs:** route and API placeholders; company/job data model planning.  
**Planned Features:** registration/login, company profile, vacancy posting, requirement specification, matched applicant review.

## 4. Agency Staff Module
**Purpose:** Operate recruitment workflows and monitor progress.  
**Phase 1 Outputs:** module stubs and workflow maps for operational tasks.  
**Planned Features:** dashboard, applicant verification, vacancy management, ATS updates, endorsements, reports.

## 5. ATS Module
**Purpose:** Manage application state transitions and lifecycle traceability.  
**Phase 1 Outputs:** placeholder API route and status-history entity planning.  
**Planned Features:** tracking workflow, status history, monitoring views.

## 6. Matching Module
**Purpose:** Rank candidates against job postings using text similarity.  
**Phase 1 Outputs:** AI service stub and integration contract planning.  
**Planned Features:** preprocessing, embedding generation, similarity scoring, ranking, recommendations.

## 7. Authentication and Access Control Module
**Purpose:** Secure identity, role ownership, and endpoint access.  
**Phase 1 Outputs:** API route placeholders and role model planning.  
**Planned Features:** user registration, login/logout, role mapping, protected routes, permissions.

## 8. Documentation and Testing Foundation
**Purpose:** Keep implementation aligned with scope and architecture.  
**Phase 1 Outputs:** requirements, workflows, architecture, roadmap, schema planning docs.  
**Planned Features:** phase-level checklists, test strategy baseline, implementation notes.

## Cross-Module Dependency Snapshot
1. Auth and Roles -> all secured modules
2. Applicants + Employers + Jobs -> ATS lifecycle
3. ATS + Documents + Jobs -> Matching
4. ATS + Audit Logs -> Reporting and governance
