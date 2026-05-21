# Matching Evaluation Dataset Guide

## Purpose

This guide explains how agency staff create and maintain evaluation datasets used to measure candidate-job matching quality over time.

Matching evaluation is a **decision-support quality workflow**. It does not automate hiring decisions or ATS status changes.

## Prerequisites

- Database migration `006_add_matching_evaluation.sql` applied (`npm run db:migrate` in `server/`).
- Authenticated `agency_staff` account.
- Published jobs and applicant profiles available in FIRA.

## API Base Path

All evaluation-management routes are mounted at:

`/api/matching-evaluation`

Access is restricted to `agency_staff` via `requireAuth` + `requireRole('agency_staff')`.

## Step 1: Create a Versioned Dataset

```http
POST /api/matching-evaluation/datasets
```

Example body:

```json
{
  "name": "Q2 Domestic Helper Matching Benchmark",
  "version": "v1",
  "description": "Expert-labeled benchmark for domestic helper roles",
  "status": "active",
  "sourceNotes": "Synthetic + anonymized operational samples"
}
```

Dataset versions are unique by `(name, version)`.

## Step 2: Add Jobs and Applicants

```http
POST /api/matching-evaluation/datasets/:datasetId/jobs
POST /api/matching-evaluation/datasets/:datasetId/applicants
```

Example:

```json
{ "jobIds": [12, 15, 18] }
```

```json
{ "applicantIds": [4, 9, 11, 20] }
```

Each evaluation run ranks dataset applicants against each dataset job.

## Step 3: Record Expert Relevance Labels

```http
POST /api/matching-evaluation/datasets/:datasetId/labels
```

Supported labels:

| Label | Meaning |
|---|---|
| `highly_relevant` | Strong fit for role requirements |
| `relevant` | Usable fit with minor gaps |
| `partially_relevant` | Some overlap but not recommended for shortlist |
| `not_relevant` | Should not appear in top recommendations |

Each label stores:

- `labeled_by` (current staff user)
- optional `reviewed_by`
- `labeled_at` / `reviewed_at` timestamps

## Step 4: Execute an Evaluation Run

```http
POST /api/matching-evaluation/datasets/:datasetId/runs
```

Example:

```json
{
  "runName": "SBERT vs baselines - May 2026",
  "methods": ["keyword_overlap", "tfidf", "sbert"],
  "scoringConfig": { "topK": 50 }
}
```

The run stores:

- per-method rankings (`match_eval_run_rankings`)
- metric aggregates (`match_eval_metric_results`)
- JSON summary and warnings (`match_eval_runs.summary`, `match_eval_runs.warnings`)

## Step 5: Retrieve Results

```http
GET /api/matching-evaluation/runs/:runId
GET /api/matching-evaluation/runs/:runId?format=csv
```

JSON responses are dashboard-ready. CSV export supports spreadsheet analysis.

## Dataset Lifecycle Statuses

| Status | Use |
|---|---|
| `draft` | Under construction, labels incomplete |
| `active` | Approved for benchmark runs |
| `archived` | Retained for historical comparison only |

## Audit Trail

The following actions are written to `audit_logs`:

- `matching_evaluation.dataset.create`
- `matching_evaluation.dataset.update`
- `matching_evaluation.dataset.jobs.add`
- `matching_evaluation.dataset.applicants.add`
- `matching_evaluation.label.upsert`
- `matching_evaluation.run.execute`
- `matching_evaluation.run.failed`

## Responsible Use Boundary

- Evaluation metrics measure ranking usefulness against human labels.
- Metrics do **not** certify fairness, legal compliance, or bias elimination.
- AI scores remain advisory and require human review before recruitment actions.
