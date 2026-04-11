# Explainability Notes

## How Explanation Summaries Are Generated
Matching explanations combine:
1. AI-service semantic similarity output (cosine-based SBERT score).
2. Shared keyword hints reported by the matching service.
3. Backend overlap heuristics from available text fields:
   - skills overlap
   - qualification overlap
   - experience overlap
4. score interpretation labels and guidance:
   - high relevance
   - moderate relevance
   - exploratory relevance
5. data-quality warnings when profile/job text is sparse.

## What Explanations Mean
- They indicate textual alignment signals between applicant and job data.
- They help reviewers prioritize manual assessment order.
- They improve transparency compared to raw score-only ranking.

## What Explanations Do Not Mean
- They do not prove final fit, competence, or hiring readiness.
- They do not infer intent, behavior, or protected demographic attributes.
- They are not legal or compliance judgments.

## Score Interpretation Risk
Over-interpreting score values can create unsafe hiring shortcuts.

Safe interpretation:
- high relevance: strong textual overlap, still needs full review
- moderate relevance: mixed overlap, requires deeper manual check
- exploratory relevance: weak textual overlap, should not be auto-rejected

## Data Quality Effects
Explanation reliability decreases when:
- applicant profile has limited skills/experience text
- job post lacks clear qualifications/required skills
- descriptions are too short or ambiguous

The UI warns reviewers when these conditions are detected.

## Responsible Usage Guidance
- Use explanation fields as context, not final judgment.
- Record human review actions and notes for accountability.
- Keep ATS/hiring decisions explicitly human-controlled.
