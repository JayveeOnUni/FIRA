# Deployment Guide (Controlled Prototype Environment)

## Purpose
This guide prepares FIRA for thesis/demo deployment in a controlled environment. It is not a full enterprise production operations manual.

## Services
1. PostgreSQL database
2. AI service (`ai-service`, FastAPI + sentence-transformers)
3. Backend API (`server`, Express)
4. Frontend (`client`, Vite build/static hosting)

## 1) Environment Files
Copy and update:
- `client/.env.example` -> `client/.env`
- `server/.env.example` -> `server/.env`
- `ai-service/.env.example` -> `ai-service/.env`

Minimum variables:

Server:
- `NODE_ENV`
- `PORT`
- `CLIENT_ORIGIN`
- `DATABASE_URL`
- `AI_SERVICE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `AUTH_COOKIE_NAME`
- `UPLOAD_MAX_FILE_SIZE_MB`
- `BACKUP_DIR`

Client:
- `VITE_API_BASE_URL`
- `VITE_AI_SERVICE_URL` (optional currently)

AI Service:
- `APP_ENV`
- `APP_PORT`
- `MODEL_NAME`
- `MODEL_DEVICE`

## 2) Database Initialization
From `server/`:
```bash
npm install
npm run db:migrate
npm run db:seed
```

Expected result:
- core schema and workflow tables created
- seed role data and staff demo account inserted
- Phase 7 governance tables (`review_notes`, `match_review_actions`) created

## 3) AI Service Setup
From `ai-service/`:
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

Health checks:
- `GET http://localhost:8001/health`
- `GET http://localhost:8001/ready`

Notes:
- first startup may download model assets
- ensure `AI_SERVICE_URL` in server env points to this running service

## 4) Backend API Setup
From `server/`:
```bash
npm install
npm run dev
```

Health check:
- `GET http://localhost:4000/api/health`

Expected readiness behavior:
- `status: ok` when dependencies are reachable
- `status: degraded` when DB/AI dependency errors are detected

## 5) Frontend Setup
Development:
```bash
cd client
npm install
npm run dev
```

Production build:
```bash
cd client
npm run build
```

Output directory:
- `client/dist`

## 6) Service Startup Order
1. PostgreSQL
2. AI service
3. Backend API
4. Frontend

Shutdown order (reverse recommended):
1. Frontend
2. Backend API
3. AI service
4. PostgreSQL

## 7) Validation Before Demo/Deployment
From `server/`:
```bash
$env:DOTENV_CONFIG_QUIET='true'
npm run test:phase6:functional
```

Expected:
- all functional checks passing
- output usable for demo readiness evidence

Phase 7 governance check:
```bash
cd server
$env:DOTENV_CONFIG_QUIET='true'
npm run test:phase7:governance
```

## 8) Database Backup / Export
Before a final demo, defense rehearsal, or deployment change, create a PostgreSQL SQL dump:

```bash
cd server
npm run db:backup
```

Requirements:
- PostgreSQL client tools must be installed.
- `pg_dump` must be available on `PATH`.
- `DATABASE_URL` must point to the target database.
- Backups are written to `BACKUP_DIR` (`backups` by default).

Restore a SQL dump into the configured database:

```bash
cd server
$env:RESTORE_FILE="..\backups\fira-backup-example.sql"
npm run db:restore
```

Restore requirements:
- `psql` must be installed and available on `PATH`.
- `RESTORE_FILE` must point to an existing `.sql` dump.
- Restore into a prepared database and confirm the target environment before running.

## 9) Security Readiness Checks
- Use `NODE_ENV=production` for deployed backend services.
- Use a strong `JWT_SECRET` with at least 32 characters.
- Confirm `CLIENT_ORIGIN` matches the deployed frontend URL exactly.
- Confirm HTTPS is enabled at the hosting/proxy layer so secure cookies and HSTS work correctly.
- Verify staff-only routes such as `/api/agency-staff/audit/logs` return `403` for applicant and employer accounts.
- Review audit activity before the final demo and export CSV evidence when needed.

## 10) Demo Data Preparation
Options:
1. Keep seeded staff account from `db:seed` and create applicant/employer accounts through UI.
2. Run the functional validation script once to auto-generate sample jobs/applications/matching records in local DB.

## 11) Controlled Deployment Notes
- keep secrets out of source control
- use strong `JWT_SECRET` in non-local environments
- configure `CLIENT_ORIGIN` to deployed frontend URL
- confirm upload directory permissions (`server/uploads/applicant-documents`)
- keep matching as decision support only; no automatic ATS mutation

## 12) Thesis Defense Demo Checklist
- Staff can log in and access ATS Queue, Applicants, Jobs Monitor, Endorsements, and audit monitoring.
- Employer can create/edit jobs, view applicants, view ranked applicants, export job review CSV, and see match explanations.
- Applicant can update profile, upload documents, apply to jobs, view application history, and view recommended jobs.
- Matching screens show decision-support notices, confidence/explanation details, and human-review reminders.
- Backup command has been tested or a recent database dump is available.
- Frontend production build has been generated with `npm run build`.

## 13) Optional Demo Mode
Set `VITE_DEMO_MODE=true` in `client/.env` to display demo-mode banners in public and dashboard layouts. This is intended for thesis presentation walkthroughs and sample-data environments.

## 14) Maintenance Readiness Monitor
Agency staff can use the dashboard maintenance card, powered by `/api/agency-staff/maintenance/readiness`, to review health, audit activity, runtime diagnostics, and final handover reminders.
