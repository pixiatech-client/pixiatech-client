---
name: evaluation
description: This skill should be used when building agent evaluation systems: deterministic checks, regression suites, multi-dimensional rubrics, quality gates, production monitoring, baseline comparison, and outcome measurement for agent pipelines.
---

# Evaluation Methods for Agent Systems

Evaluate agents differently from traditional software — agents are non-deterministic and often lack single correct answers.

## Core Concepts

Focus on outcomes rather than execution paths. Use multi-dimensional rubrics instead of single scores. Run deterministic validation before LLM judgment whenever the artifact has machine-checkable structure.

### Performance Drivers (claim-evaluation-browsecomp-variance)

| Factor | Variance Explained | Implication |
|--------|-------------------|-------------|
| Token usage | Primary driver | Set production-realistic token budgets |
| Number of tool calls | Secondary driver | More tool use helps only when calls retrieve useful evidence |
| Model choice | Secondary, multiplicative | Better models use tokens/tools more efficiently |

### Evaluation Challenges

- **Non-determinism**: Define outcome criteria, not step sequences
- **Context-dependent failures**: Test simple through very complex cases
- **Composite quality**: Score factual accuracy, completeness, coherence, tool efficiency, process quality separately

### Rubric Design

Core dimensions (adapt weights per use case):
- Factual accuracy (weight heavily for knowledge tasks)
- Completeness (weight heavily for research tasks)
- Citation accuracy (weight for trust-sensitive contexts)
- Source quality (weight for authoritative outputs)
- Tool efficiency (weight for cost-sensitive systems)

Map to 0.0–1.0 scores, apply weights, set thresholds: 0.7 general, 0.9 high-stakes.

### Methodologies

- **LLM-as-Judge**: Use different model family than the agent being evaluated. Include: task description, agent output, ground truth, evaluation scale, request for structured judgment with reasoning.
- **Human Evaluation**: Route edge cases, unusual queries, and random sample to human reviewers.
- **End-State Evaluation**: For stateful agents, assert final state matches expectations rather than process.

### Test Set Design

Start with 20-30 cases early, scale to 50+ for reliable signal. Stratify by complexity:

| Level | Description |
|-------|-------------|
| Simple | Single tool call, factual lookup |
| Medium | Multiple tool calls, comparison logic |
| Complex | Many tool calls, significant ambiguity |
| Very complex | Extended interaction, deep reasoning, synthesis |

Report scores per stratum alongside overall scores.

### Context Engineering Evaluation

- Run agents with different context strategies on same test set
- Test degradation at different context sizes; identify performance cliffs

### Continuous Evaluation

- Integrate evaluation into dev workflow; run on every agent change
- Sample production interactions; alert at warning (0.85) and critical (0.70) pass rate

## Guidelines

1. Use multi-dimensional rubrics, not single metrics
2. Evaluate outcomes, not specific execution paths
3. Cover complexity levels from simple to complex
4. Test with realistic context sizes and histories
5. Run evaluations continuously, not just before release
6. Supplement LLM evaluation with human review
7. Track metrics over time for trend detection
8. Set clear pass/fail thresholds based on use case
9. Separate deterministic validation failures from quality judgments

## Gotchas

- **Overfitting evals to specific code paths**: Write eval criteria against outcomes, not surface patterns; rotate test inputs
- **LLM-judge self-enhancement bias**: Use different model family as judge than the evaluated model
- **Test set contamination**: Version eval sets separately from prompt/training data
- **Metric gaming**: Cross-validate automated metrics against human judgments regularly
- **Single-dimension scoring**: Always report per-dimension scores with minimum thresholds per dimension
- **Eval set too small**: At least 50 cases; report confidence intervals
- **Not stratifying by difficulty**: Weight overall score to prevent easy-case dominance
- **Treating eval as one-time**: Run evals on every change and on regular production cadence
