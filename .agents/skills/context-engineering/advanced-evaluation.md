---
name: advanced-evaluation
description: This skill should be used for advanced LLM evaluation: LLM-as-judge systems, direct scoring, pairwise comparison, rubric calibration, evaluator bias mitigation, confidence scoring, and automated quality assessment.
---

# Advanced Evaluation

Production-grade techniques for LLM-as-Judge evaluation. Key insight: LLM-as-a-Judge is a family of approaches, each suited to different contexts.

## Core Concepts

### Evaluation Taxonomy

- **Direct Scoring**: Use when objective criteria exist (factual accuracy, instruction following). Single LLM rates one response on a defined scale. Moderate-to-high reliability for well-defined criteria.
- **Pairwise Comparison**: Use for subjective preferences (tone, style, persuasiveness). Often correlates better with human preference for subjective tasks. Mitigate position bias by swapping positions.

### Bias Landscape

| Bias | Mitigation |
|------|------------|
| Position bias | Evaluate twice with swapped positions; majority vote / consistency check |
| Length bias | Explicitly prompt to ignore length; length-normalized scoring |
| Self-enhancement bias | Different models for generation and evaluation |
| Verbosity bias | Criteria-specific rubrics that penalize irrelevant detail |
| Authority bias | Require evidence citation; add fact-checking layer |

### Metric Selection

| Task Type | Primary Metrics | Secondary Metrics |
|-----------|-----------------|-------------------|
| Binary (pass/fail) | Recall, Precision, F1 | Cohen's kappa |
| Ordinal (1-5) | Spearman's rho, Kendall's tau | Cohen's kappa (weighted) |
| Pairwise preference | Agreement rate, Position consistency | Confidence calibration |
| Multi-label | Macro-F1, Micro-F1 | Per-label precision/recall |

Prioritize systematic disagreement patterns over absolute agreement rates.

## Evaluation Approaches

### Direct Scoring

Prompt structure: criteria definition, calibrated scale, output format.

Scale granularity:
- 1-3: Binary with neutral, lowest cognitive load
- 1-5: Standard Likert, best balance of granularity and reliability
- 1-10: Only use with detailed per-level rubrics

Require evidence before the score — anchor decision in observable output features before emitting a number.

### Pairwise Comparison

1. Deterministic pre-checks (schema, evidence requirements, scope)
2. First pass: A in first position, B in second
3. Second pass (swapped): B in first position, A in second
4. Consistency check — if passes disagree, return TIE with reduced confidence
5. Final verdict: consistent winner with averaged confidence

Confidence calibration:
- Both passes agree: confidence = average of individual confidences
- Passes disagree: confidence = 0.5, verdict = TIE

### Rubric Generation

Include: level descriptions with clear boundaries, observable characteristics per level, edge case guidance, scoring guidelines.

Strictness calibration: Lenient (encourage iteration), Balanced (production defaults), Strict (safety-critical).

Adapt rubric terminology to domain (code readability vs medical accuracy).

## Decision Framework: Direct vs Pairwise

```
Is there objective ground truth?
+-- Yes -> Direct Scoring (factual accuracy, instruction following, format compliance)
+-- No -> Is it preference or quality judgment?
    +-- Yes -> Pairwise Comparison (tone, style, persuasiveness, creativity)
    +-- No -> Consider reference-based evaluation (summarization, translation)
```

## Scaling Evaluation

1. **Panel of LLMs (PoLL)**: Multiple judges, aggregate votes — more reliable for high-stakes
2. **Hierarchical**: Fast cheap model for screening, expensive model for edge cases
3. **Human-in-the-loop**: Automate clear cases, route low-confidence to humans

## Guidelines

1. Always require evidence before scores — easier to audit, reduces ungrounded scoring
2. Always swap positions in pairwise comparison — single-pass is corrupted by position bias
3. Match scale granularity to rubric specificity — don't use 1-10 without detailed level descriptions
4. Separate objective and subjective criteria — direct scoring for objective, pairwise for subjective
5. Include confidence scores — calibrate to position consistency and evidence strength
6. Define edge cases explicitly — ambiguous situations cause the most evaluation variance
7. Use domain-specific rubrics — generic rubrics produce generic evaluations
8. Validate against human judgments — automated eval only valuable if it correlates with human assessment
9. Monitor for systematic bias — track disagreement patterns by criterion, response type, model
10. Design for iteration — evaluation systems improve with feedback loops

## Gotchas

- **Scoring without justification**: Always require evidence-based justification before the score
- **Single-pass pairwise comparison**: Always swap positions and check consistency
- **Overloaded criteria**: One criterion = one measurable aspect
- **Missing edge case guidance**: Include edge cases in rubrics with clear resolution rules
- **Ignoring confidence calibration**: High-confidence wrong judgments are worse than low-confidence ones
- **Rubric drift**: Schedule periodic rubric reviews and re-anchor against fresh human-annotated examples
- **Evaluation prompt sensitivity**: Version-control eval prompts; run regression tests before deploying changes
- **Uncontrolled length bias**: Add explicit length-neutrality instructions; validate with length-controlled test pairs
