# Priority 5 Optional Enhancement Notes

## Completed Optional Enhancements

- Added staff-only maintenance readiness summary endpoint:
  - `GET /api/agency-staff/maintenance/readiness`
- Added maintenance readiness card to the agency staff dashboard.
- Added restore workflow helper:
  - `npm run db:restore`
  - requires `RESTORE_FILE` and PostgreSQL `psql`.
- Added optional demo mode banner:
  - `VITE_DEMO_MODE=true`
- Updated deployment documentation with backup, restore, demo mode, and maintenance monitor guidance.

## Developer Handover Notes

- Preserve role guards before adding any new staff/admin operation.
- Keep matching as decision support only; do not let SBERT scores automatically mutate ATS statuses.
- Use `audit_logs` for administrative and workflow traceability.
- Use `diagnostics.service.js` for lightweight runtime events; use an external observability stack for production scale.
- Keep database migration files append-only after release.

## Maintenance Checklist

Weekly during demo/maintenance period:

- Run `npm run db:backup` and confirm a backup file is produced.
- Check `/api/health` for database and AI service status.
- Review staff dashboard audit monitor and maintenance readiness card.
- Confirm upload directory space and permissions.
- Confirm `JWT_SECRET`, `CLIENT_ORIGIN`, and `AI_SERVICE_URL` are correct in deployed environment.

Before thesis defense:

- Run `npm run db:migrate`.
- Run `npm run build` in `client`.
- Run backend validation scripts where the required services are available.
- Enable `VITE_DEMO_MODE=true` only for sample-data demonstrations.
- Prepare one applicant, one employer, one published job, one application, one status update, one endorsement, and one match explanation.

## Future-Readiness Roadmap

- Add a dedicated paginated admin console for audit logs and diagnostics.
- Add structured user satisfaction survey persistence if the evaluation needs live survey collection.
- Add CI checks for lint, build, API functional checks, and migration dry-runs.
- Add database archival policies for old applications, documents, and audit records.
- Add load testing and matching-quality benchmark datasets for future SBERT tuning.
- Integrate production observability such as centralized logs, uptime monitoring, and error tracking.

## Remaining Limitations

- Maintenance readiness is advisory and does not replace full production monitoring.
- Restore workflow intentionally requires an explicit `RESTORE_FILE` to reduce accidental restores.
- Demo mode is a UI banner only; it does not isolate or reset data.
- The repository still relies on separate functional scripts rather than a unified automated test suite.
