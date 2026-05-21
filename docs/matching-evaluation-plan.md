# Matching Evaluation Plan

## Purpose

This document defines how the SBERT-based matching module should be evaluated for thesis defense. Functional endpoint tests show that the matching workflow runs, but they do not prove that the ranking quality is useful for recruitment. This plan fills that gap.

## Current Implementation Boundary

The current matching workflow uses structured applicant profile fields and job fields as its main text sources.

Applicant text includes:
- preferred job category
- skills summary
- work experience summary
- education summary
- applicant name context
- uploaded document filename metadata as lightweight context only

Job text includes:
- job title
- job description
- qualifications
- required skills
- location
- employment type
- company name

The current prototype does not claim full PDF/DOCX resume text extraction, skill taxonomy normalization, protected-trait fairness auditing, or automated legal compliance.

## Evaluation Dataset

Recommended minimum dataset for academic evaluation:

| Item | Recommended Minimum |
|---|---:|
| Job postings | 10 |
| Applicant profiles | 30 |
| Applicant-job relevance judgments | 100 |
| Domain evaluators | 2 |

The dataset may use anonymized real records, synthetic records based on realistic recruitment scenarios, or a combination of both. The final paper must disclose which source was used.

## Relevance Labels

Each applicant-job pair should be rated by a recruitment-domain evaluator.

| Label | Meaning |
|---:|---|
| 0 | Not relevant |
| 1 | Weakly relevant |
| 2 | Moderately relevant |
| 3 | Highly relevant |

If two evaluators are available, disagreements should be resolved through discussion or reported as evaluator disagreement.

## Baselines

SBERT should be compared against simpler matching methods:

1. Keyword overlap count.
2. TF-IDF cosine similarity.
3. SBERT cosine similarity.

This comparison is needed to justify the use of SBERT instead of assuming that transformer embeddings automatically improve recruitment matching.

## Metrics

Recommended metrics:

| Metric | Use |
|---|---|
| Precision@5 | Measures relevant results in the top 5 |
| NDCG@10 | Measures graded ranking quality in the top 10 |
| MRR | Measures rank position of the first relevant result |
| Expert acceptability rate | Measures whether evaluators consider top results usable |

For a small thesis prototype, Precision@5 and NDCG@10 are the minimum recommended metrics.

## Error Analysis

Questionable or poor matches should be manually reviewed and categorized.

Common categories:
- sparse applicant profile
- incomplete job description
- missing resume body text
- ambiguous job title
- skill synonym mismatch
- generic terms dominating the match
- model not tuned for recruitment-domain vocabulary

## Reporting Requirements

The thesis should report:

1. Dataset size and source.
2. Number and role of evaluators.
3. Relevance label scale.
4. Baseline methods.
5. SBERT ranking results.
6. Metric scores.
7. Error analysis findings.
8. Limitations and recommended improvements.

## Interpretation Guidance

Do not interpret raw cosine similarity values as universal grades. Score meaning depends on the model, text quality, and dataset. Any match labels shown in the interface should be described as advisory guidance calibrated for prototype use, not as objective hiring classifications.
