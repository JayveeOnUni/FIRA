# Authentication and Access Control

## Auth Strategy
- **Method:** JWT token in HttpOnly cookie
- **Cookie Name:** `AUTH_COOKIE_NAME` (default: `fira_auth_token`)
- **Token Payload:** `userId`, `email`, `role`
- **Session Persistence:** Browser keeps cookie until expiration or logout

## Implemented Auth Flows
1. `POST /api/auth/register/applicant`
   - Creates user with `applicant` role
   - Creates linked `applicants` profile row
   - Sets auth cookie and returns user payload
2. `POST /api/auth/register/employer`
   - Creates user with `employer` role
   - Creates linked `companies` and `employers` rows
   - Sets auth cookie and returns user payload
3. `POST /api/auth/login`
   - Validates credentials against hashed password
   - Sets auth cookie
4. `POST /api/auth/logout`
   - Clears auth cookie
5. `GET /api/auth/me`
   - Returns current authenticated user

## Role Access Behavior
- Roles:
  - `applicant`
  - `employer`
  - `agency_staff`
- Backend guard middleware:
  - `requireAuth`: rejects unauthenticated requests (`401`)
  - `requireRole(...roles)`: rejects unauthorized role access (`403`)
- Role-restricted foundation endpoints:
  - `GET /api/applicants/dashboard` -> applicant only
  - `GET /api/employers/dashboard` -> employer only
  - `GET /api/agency-staff/dashboard` -> agency staff only

## Frontend Route Protection
- `ProtectedRoute` ensures auth before accessing `/dashboard/*`
- `RoleProtectedRoute` enforces role-specific dashboard pages:
  - `/dashboard/applicant`
  - `/dashboard/employer`
  - `/dashboard/staff`
- Unauthorized users are redirected to `/unauthorized`

## Validation and Security Baseline
- Required payload fields validated with Zod schemas
- Passwords stored as `bcrypt` hashes (no plaintext storage)
- Duplicate email registration blocked by unique constraint
- Sensitive internal errors are not exposed in API responses
