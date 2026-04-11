# Responsible AI Guidance

## Decision-Support Positioning
FIRA matching outputs are decision-support signals only.

Implemented safeguards:
- match scores are labeled as advisory
- UI reminders emphasize manual review before hiring decisions
- ATS statuses are not automatically changed by model scores
- endorsement and review actions require explicit human action

## Fairness-Awareness Support
Phase 7 introduces practical fairness-awareness features for prototype use:
- reminder text that score quality depends on text completeness and wording
- data-quality warnings for sparse profiles or incomplete job descriptions
- explicit human-review action capture to discourage blind score-only decisions

This phase does **not** claim:
- bias elimination
- demographic fairness certification
- legal compliance certification

## Human Review Recommendations
For employer and staff reviewers:
1. Review applicant profile, ATS history, and job context in addition to score.
2. Record a review action (`reviewed`, `shortlisted_by_human`, `deferred`, `needs_more_information`).
3. Add review notes when context or concerns need traceability.
4. Use exported summary data for governance discussions, not as automated decision output.

## Governance Notes
- review actions and notes are persisted for traceability
- review timeline is role-restricted to employer/staff for relevant job context
- export endpoint supports transparent review-audit preparation at prototype scale

## Limitations
- no protected-trait inference
- no automated fairness remediation engine
- no formal policy engine for mandatory review routing
- no legal/compliance automation

## Safe Usage Reminder
Do not interpret high relevance scores as automatic qualification.
Do not reject solely on low relevance score without manual assessment.
Use model output as one input in a broader human-led recruitment process.
