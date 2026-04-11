# Testing Foundation and Artifacts (Phase 6)

## Current Validation Assets
- Functional test matrix and executed outcomes: `docs/test-cases.md`
- Raw automated run output: `docs/test-results-raw.json`
- Repeatability/reliability reruns: `docs/test-reliability-runs.json`

## Current Automation Entry Point
- Script: `server/scripts/phase6-functional-check.js`
- NPM command:
```bash
cd server
$env:DOTENV_CONFIG_QUIET='true'
npm run test:phase6:functional
```

## Covered Workflow Areas
- authentication and role-based route protection
- public job browsing
- applicant apply flow and duplicate prevention
- ATS status updates and endorsements by staff
- matching recommendations/ranking endpoints
- dependency failure handling for AI service availability
- decision-support integrity (matching does not auto-change ATS)

## Deferred Testing Work
- full unit test suite across frontend/backend/AI modules
- full integration suite with real AI runtime and database fixtures
- browser-level end-to-end automation
- performance/load profiling beyond prototype checks
