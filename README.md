# FIRA - Phase 7 Responsible AI, Governance, and Operational Optimization

## Project Title
FIRA: Web-Based Recruitment Platform for Fil International Recruitment Agency with Applicant Tracking and SBERT-Based Candidate-Job Matching

## Current Implemented Phase
This repository is now on **Phase 7: Post-Prototype Enhancement, Responsible AI Support, and Operational Optimization**.

Phase 7 delivered:
- enhanced explainability payloads (relevance labels, overlap factors, score guidance, data-quality warnings)
- fairness-awareness and limitation reminders in applicant/employer/staff matching views
- human-review governance actions and notes (with timeline and export-ready summary)
- role-restricted review-summary CSV export for employer/staff job pipelines
- matching workflow optimization with partial-cache + selective recompute behavior
- operational diagnostics foundation (runtime counters, recent events, matching operations summary)
- improved backend request traceability (`x-request-id`) and safer diagnostic logging
- updated responsible-use, explainability, monitoring, and roadmap documentation

## Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express.js (REST + JSON)
- Database: PostgreSQL
- AI Service: Python + FastAPI + sentence-transformers

## Repository Structure
```text
root/
  client/
  server/
  ai-service/
  database/
  docs/
```

## Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 15+
- Python 3.11+ (recommended for AI service dependencies)

## Local Setup
1. Copy environment files:
- `client/.env.example` -> `client/.env`
- `server/.env.example` -> `server/.env`
- `ai-service/.env.example` -> `ai-service/.env`

2. Install dependencies:
```bash
cd client && npm install
cd ../server && npm install
```

3. Prepare database:
```bash
cd server
npm run db:migrate
npm run db:seed
```

4. Start services in this order:
```bash
# 1) AI service
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001

# 2) Backend API
cd ../server
npm run dev

# 3) Frontend client
cd ../client
npm run dev
```

## Build and Validation Commands
- Frontend production build:
```bash
cd client
npm run build
```

- Database backup/export:
```bash
cd server
npm run db:backup
```

- Database restore from SQL dump:
```bash
cd server
$env:RESTORE_FILE="..\backups\fira-backup-example.sql"
npm run db:restore
```

- Run functional API validation suite (regression baseline):
```bash
cd server
$env:DOTENV_CONFIG_QUIET='true'
npm run test:phase6:functional
```

- Optional: run additional Phase 7 governance flow checks manually
```bash
cd server
$env:DOTENV_CONFIG_QUIET='true'
npm run test:phase7:governance
```

## Demo/Test Credentials
- Seeded agency staff account:
  - Email: `staff@fira.local`
  - Password: `StaffPass123!`
- Applicant and employer demo accounts can be created from registration pages.

## Workflow Coverage (Current Prototype)
- Public pages and job browsing
- Applicant profile/documents/applications/recommendations
- Employer company/job/applicant review workflows
- Agency staff ATS updates, status history, endorsements, monitoring
- SBERT-based decision-support matching views for applicant/employer/staff
- Human-in-the-loop governance actions on ranked candidates (review actions + notes)
- Responsible-use reminders and explainability support in matching screens

## Decision Support Policy
Matching scores are decision-support signals only.
- ATS statuses are not auto-mutated by model output
- endorsements and hiring actions remain explicit human actions
- review actions must be human-recorded; AI cannot finalize hiring outcomes

## Known Limitations
- No formal fairness certification or bias-elimination guarantee
- No protected-trait inference or automated fairness remediation
- No interview scheduling, messaging, or external integrations
- No enterprise-scale CI/CD and observability stack
- AI service setup requires local Python environment and model download

## Documentation Index
- [Phase 7 Summary](docs/phase-7-summary.md)
- [Priority 3 Summary](docs/priority-3-summary.md)
- [Priority 4 Finalization Notes](docs/priority-4-finalization.md)
- [Priority 5 Optional Enhancements](docs/priority-5-optional-enhancements.md)
- [Phase 7 Governance Results](docs/phase-7-governance-results.json)
- [Test Cases](docs/test-cases.md)
- [Quality Evaluation](docs/quality-evaluation.md)
- [Deployment Guide](docs/deployment-guide.md)
- [Responsible AI](docs/responsible-ai.md)
- [Explainability](docs/explainability.md)
- [Operations and Monitoring](docs/operations-and-monitoring.md)
- [Applicant User Guide](docs/user-guide-applicant.md)
- [Employer User Guide](docs/user-guide-employer.md)
- [Staff User Guide](docs/user-guide-staff.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Database Schema](docs/database-schema.md)
- [Development Roadmap](docs/development-roadmap.md)
