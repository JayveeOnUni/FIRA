# Troubleshooting Guide

## 1) Database Connection Issues
Symptoms:
- backend startup error about `DATABASE_URL`
- migration/seed script failures

Checks:
1. Verify PostgreSQL is running.
2. Verify `server/.env` has valid `DATABASE_URL`.
3. Confirm credentials and DB name are correct.
4. Run from `server/`:
```bash
npm run db:migrate
npm run db:seed
```

## 2) AI Service Issues
Symptoms:
- matching endpoints return `503`
- `/api/health` shows `aiService.status = error`

Checks:
1. Start AI service and verify:
  - `GET http://localhost:8001/health`
  - `GET http://localhost:8001/ready`
2. Ensure backend `AI_SERVICE_URL` points to running AI host/port.
3. Install AI dependencies in active Python environment:
```bash
pip install -r ai-service/requirements.txt
```

## 3) Authentication Problems
Symptoms:
- protected routes redirect unexpectedly
- `401` or `403` from API

Checks:
1. Confirm user is logged in and session cookie is set.
2. Confirm role matches route requirements.
3. Verify `CLIENT_ORIGIN` and CORS credentials configuration.
4. If needed, logout/login again to refresh session.

## 4) File Upload Failures
Symptoms:
- document upload rejected
- `400`/`413` errors

Checks:
1. Ensure file type is allowed by backend validation.
2. Check file size against `UPLOAD_MAX_FILE_SIZE_MB`.
3. Confirm upload directory exists and is writable:
  - `server/uploads/applicant-documents`

## 5) Route/Config Problems
Symptoms:
- frontend cannot reach backend
- API calls fail with network errors

Checks:
1. Verify `client/.env` -> `VITE_API_BASE_URL`.
2. Verify backend is running and reachable at configured host/port.
3. Verify frontend and backend ports are not blocked/conflicting.

## 6) Matching Endpoint Errors
Symptoms:
- ranked/recommendation views fail

Checks:
1. Confirm AI service health is `ok`.
2. Confirm applicant/job text fields are populated enough for matching.
3. Run Phase 6 validation script for reproducible diagnostics:
```bash
cd server
$env:DOTENV_CONFIG_QUIET='true'
npm run test:phase6:functional
```
4. If ranked lists load but review actions fail, confirm Phase 7 migration was applied:
```bash
cd server
npm run db:migrate
```
5. Verify reviewer role/ownership:
- employer must access only own company job review routes
- agency staff can access staff-matching review routes

## 7) Build Failures
Frontend:
```bash
cd client
npm run build
```

Backend module sanity check:
```bash
cd server
node -e "require('./src/app'); console.log('ok')"
```

If failures persist:
- clear `node_modules` and reinstall
- verify Node.js version compatibility
- re-check env files for missing values
