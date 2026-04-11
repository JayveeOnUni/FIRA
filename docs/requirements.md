# Requirements Breakdown

## 0. Proposal Extraction Summary
- **Title:** FIRA: Web-Based Recruitment Platform for Fil International Recruitment Agency with Applicant Tracking and SBERT-Based Candidate-Job Matching
- **Scope:** Public website, recruitment operations, intelligent matching support
- **Primary Objectives:** streamline recruitment workflows, provide ATS visibility, support better candidate-job fit
- **Users:** Applicant, Employer, Agency Staff
- **Core Feature Groups:** website pages, applicant/employer/staff modules, ATS module, matching module, auth/access control
- **Suggested Tools:** React + Vite + Tailwind, Node.js + Express, Python 3.11, PostgreSQL, REST + JSON
- **Phase 1 Deliverables:** requirements, architecture, workflow map, repo scaffolds, database planning, setup docs
- **Known Limitations for Phase 1:** no full auth, no full CRUD/ATS, no production matching model, no deployment hardening

## 1. Scope Summary
Phase 1 covers planning, decomposition, architecture design, repository initialization, and minimal runnable stubs for frontend, backend, and AI service.

## 2. Functional Requirements

### Public Website Module
- Provide public-facing pages: Home, About, FAQ, News, Contact, Job Search.
- Expose job search entry points for applicants (placeholder in Phase 1).

### Applicant Module
- Support registration/login entry flow (planned).
- Maintain applicant profile and resume upload feature design.
- Support agency form download/submission planning.
- Enable job browsing and application tracking (planned endpoints/pages).

### Employer Module
- Support employer registration/login entry flow (planned).
- Capture company profile and vacancy posting data model.
- Define requirement specification and matched-applicant review flow.

### Agency Staff Module
- Provide dashboard planning for operations overview.
- Define workflows for applicant verification and vacancy management.
- Define ATS update flow, endorsements, and reporting placeholders.

### ATS Module
- Track application status lifecycle.
- Maintain status history per application.
- Enable applicant monitoring views.

### Matching Module
- Define preprocessing pipeline inputs/outputs.
- Define embedding-generation and scoring interfaces.
- Define ranked recommendation response contract.

### Authentication and Access Control Module
- Define registration/login/logout API boundaries.
- Define user-role mapping and protected route approach.
- Define role-based permission policy structure (implementation deferred).

### Documentation and Testing Foundation
- Maintain technical docs for scope, architecture, workflows, and roadmap.
- Define testing strategy baseline for later implementation phases.

## 3. Non-Functional Requirements
- **Maintainability:** modular code structure for frontend/backend/AI service.
- **Scalability:** service boundaries ready for increased traffic and model usage.
- **Security baseline:** environment-based config, protected API planning, audit-ready entities.
- **Performance baseline:** health endpoints and asynchronous-ready service boundaries.
- **Usability:** clear page and workflow separation by user role.
- **Reliability:** health checks and predictable API contracts.
- **Traceability:** status history and audit log planning.
- **Portability:** local-first setup with environment templates.
- **Extensibility:** architecture allows advanced ATS/matching features in later phases.

## 4. In-Scope vs Out-of-Scope (Phase 1)

### In Scope
- requirement extraction and technical translation
- module and workflow definition
- architecture planning
- initial database entity planning
- starter repository structure and stub services
- setup documentation and phase roadmap

### Out of Scope
- full auth and RBAC implementation
- end-to-end ATS logic
- production resume parsing
- real SBERT embedding + similarity pipeline
- deployment infrastructure
- advanced analytics/reporting
- production hardening and full tests

## 5. Dependency Notes
- Auth module is a prerequisite for secured Applicant/Employer/Agency features.
- ATS depends on Jobs, Applications, and Status History entities.
- Matching depends on normalized job/applicant text data and document availability.
- Reporting depends on ATS events, audit logs, and status transitions.
