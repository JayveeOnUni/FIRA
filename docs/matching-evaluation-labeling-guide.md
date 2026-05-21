# Matching Evaluation Labeling Guide

## Who Should Label

Relevance labels should be created by recruitment-domain reviewers (agency staff with role knowledge), not by the matching model itself.

Recommended practice:

- At least one trained reviewer per dataset version.
- Optional second reviewer for disagreement analysis on critical jobs.

## Labeling Unit

Each label applies to one **job-applicant pair** inside a specific evaluation dataset version.

```json
{
  "jobId": 12,
  "applicantId": 4,
  "relevanceLabel": "relevant",
  "labelNotes": "Strong caregiving experience; limited driver license requirement"
}
```

## Label Definitions

| Label | When to use |
|---|---|
| `highly_relevant` | Candidate clearly meets core requirements and would be reasonable in top shortlist |
| `relevant` | Candidate is suitable with manageable gaps |
| `partially_relevant` | Some overlap exists, but not recommended for prioritized review |
| `not_relevant` | Candidate should not be prioritized for this role |

## Labeling Procedure

1. Open the job requirements and full applicant profile context.
2. Ignore current AI match score while labeling (avoid anchoring bias).
3. Record a short `labelNotes` rationale for disputed or edge cases.
4. If a second reviewer is available, set `reviewedBy` after reconciliation.
5. Re-label when profile or job text materially changes; create a new dataset version if needed.

## Sparse or Incomplete Text

If applicant or job text is sparse:

- Use `partially_relevant` or `not_relevant` when uncertainty is high.
- Add `labelNotes` describing missing fields (resume body, skills detail, etc.).
- Do not infer protected attributes or undisclosed personal traits.

## Missing Labels During Runs

Evaluation runs still execute without labels, but:

- Precision/recall-style metrics become zero or undefined for affected jobs.
- Run warnings include `no_labels` severity `high`.
- Results must not be interpreted as production quality evidence until labels exist.

## Reviewer Accountability

FIRA stores:

- `labeled_by` user ID and timestamp
- optional `reviewed_by` user ID and `reviewed_at`
- dataset version metadata for reproducibility

Treat labels as operational ground truth for **evaluation**, not as automatic hiring decisions.
