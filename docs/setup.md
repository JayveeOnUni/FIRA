# Local Setup Instructions (Phase 7)

## Prerequisites
- Node.js 20+
- npm 10+
- Python 3.11+ (for AI service)
- PostgreSQL 15+

## 0. Configure Environment Files
Copy templates:
- `client/.env.example` -> `client/.env`
- `server/.env.example` -> `server/.env`
- `ai-service/.env.example` -> `ai-service/.env`

Important backend variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_ORIGIN`

## 1. Frontend Setup
```bash
cd client
npm install
npm run dev
```

Default frontend URL: `http://localhost:5173`

## 2. Backend Setup
```bash
cd server
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Default backend URL: `http://localhost:4000`  
Health check: `http://localhost:4000/api/health`

Recommended functional validation command:
```bash
cd server
$env:DOTENV_CONFIG_QUIET='true'
npm run test:phase6:functional
```

Phase 7 governance/matching checks (manual):
- Employer/Staff ranked applicant pages should allow:
  - saving human review action
  - saving review note
  - viewing review timeline
  - exporting review summary CSV

## 3. Auth and Seed Notes
- Seed includes sample agency staff account:
  - Email: `staff@fira.local`
  - Password: `StaffPass123!`
- Applicant and employer accounts are created through the UI registration forms.

## 4. File Upload Notes (Phase 3)
- Applicant documents upload endpoint: `POST /api/applicants/documents`
- Local storage path: `server/uploads/applicant-documents`
- Allowed formats: PDF, DOC, DOCX, JPG, PNG
- Max size: controlled by `UPLOAD_MAX_FILE_SIZE_MB` in `server/.env`

## 5. AI Service Setup (Matching Enabled Through Phase 6)
```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Default AI service URL: `http://localhost:8001`  
Health checks:
- `http://localhost:8001/health`
- `http://localhost:8001/ready`

Matching endpoints:
- `POST /v1/embeddings`
- `POST /v1/match/rank`

## 6. Startup Order
1. PostgreSQL
2. AI service
3. Backend API
4. Frontend client

For deployment details, see `docs/deployment-guide.md`.
