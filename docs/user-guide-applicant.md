# Applicant User Guide

## 1) Register and Login
1. Open `/register/applicant`.
2. Enter required account details and submit.
3. You are redirected into the applicant dashboard after successful registration.
4. For returning users, use `/login`.

## 2) Complete Profile
1. Go to `Dashboard -> My Profile`.
2. Fill personal/professional fields (phone, address, summaries, skills, preferred category).
3. Save updates.
4. Confirm success message and refreshed profile values.

## 3) Upload Resume/Documents
1. Go to `Dashboard -> My Documents`.
2. Choose a file and document type.
3. Submit upload.
4. Verify file appears in document metadata list.

Notes:
- allowed types and file size are validated by backend rules
- this phase stores files in local server upload storage for development/demo

## 4) Browse Jobs and View Details
1. Open public `Jobs` page.
2. Use search/filter input.
3. Open a job card to view full details.

## 5) Apply to a Job
1. Login as applicant.
2. Open job detail page.
3. Click apply action.
4. Confirmation appears if application is created.

If you already applied, duplicate request is blocked.

## 6) Track Applications and ATS Status
1. Go to `Dashboard -> My Applications`.
2. View current status for each application.
3. Open status history details where available.
4. You can withdraw an active application using the provided action.

## 7) View Recommended Jobs (Decision Support)
1. Go to `Dashboard -> Recommended Jobs`.
2. Review ranked jobs with match score, relevance label, and overlap hints.
3. Check any data-quality warnings shown in recommendation cards.
3. Use this as guidance only; final recruitment decisions are human-managed.

## 8) Access Rules
- Applicants can access only their own profile, documents, applications, and recommendations.
- Unauthorized route attempts redirect or return access errors.
