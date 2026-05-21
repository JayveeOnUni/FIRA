# Matching Evaluation Metrics Guide

## Overview

FIRA computes ranking-quality metrics by comparing model/baseline rankings against human relevance labels.

Metrics are reported:

- overall (all jobs in the run)
- by segment (`job_category`, `skill_group`, `experience_level`, `data_completeness`)
- per method (`sbert`, `keyword_overlap`, `tfidf`)

## Relevance Mapping Used in Metrics

| Label | Graded score (NDCG) | Binary relevant (Precision/MRR) |
|---|---:|---|
| `highly_relevant` | 3 | yes |
| `relevant` | 2 | yes |
| `partially_relevant` | 1 | no |
| `not_relevant` | 0 | no |

Binary relevance treats `highly_relevant` and `relevant` as positive.

## Metrics

### Precision@5 / Precision@10

Fraction of top-k ranked candidates that are binary-relevant.

Interpretation:

- Higher is better.
- Sensitive to label sparsity; unstable when few labels exist per job.

### NDCG@10

Normalized Discounted Cumulative Gain at rank 10 using graded relevance.

Interpretation:

- Rewards placing highly relevant candidates near the top.
- Preferred when label granularity matters.

### Mean Reciprocal Rank (MRR)

Inverse rank of the first binary-relevant candidate.

Interpretation:

- High MRR means the first useful candidate appears early.
- Useful when recruiters mostly inspect the first result.

### Average Score by Relevance Label

Mean model score grouped by human label bucket.

Interpretation:

- Checks score separation between relevant and non-relevant groups.
- Large overlap suggests weak calibration for decision support.

### False-Positive / False-Negative Analysis

For top-10 results:

- **False positive**: appears in top-10 but label is not binary-relevant.
- **False negative**: binary-relevant candidate missing from top-10.

Use this for qualitative error analysis and profile/job text improvements.

## Baseline Comparison

Each run can include:

1. `keyword_overlap` — shared token overlap count
2. `tfidf` — cosine similarity over TF-IDF vectors
3. `sbert` — semantic ranking via AI service

Compare methods using the same dataset labels and segment breakdown. SBERT should be justified by measurable gains, not assumed superiority.

## Segment Metrics

Segments are heuristic and intended for operational diagnostics:

| Segment | Source |
|---|---|
| `job_category` | Job title token / role context |
| `skill_group` | First skill token in applicant profile |
| `experience_level` | Work experience text length bands |
| `data_completeness` | Count of populated profile/job text fields |

Segment metrics help identify where matching quality degrades (sparse profiles, incomplete job posts, etc.).

## Quality Warnings in Run Summaries

Typical warnings:

- `no_labels` — labels missing, metrics not meaningful
- `no_jobs` — dataset empty
- `ai_service_unavailable` — SBERT skipped/failed, run may be `partial`
- `decision_support_only` — mandatory responsible-use reminder
- `no_fairness_certification` — no bias/fairness claims

## Limitations

- Metrics depend on label quality and reviewer consistency.
- Small datasets can produce unstable scores.
- SBERT and baselines use structured profile/job text, not full resume OCR.
- Segment tags are approximate and should not be treated as formal HR taxonomy.
- Evaluation results do not replace human hiring judgment or legal review.
