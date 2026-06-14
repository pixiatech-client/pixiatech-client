---
name: harness-engineering
description: This skill should be used when designing autonomous agent harnesses: research loops, evaluation scaffolds, locked and editable surfaces, durable logs, novelty gates, pruning, rollback, PR preparation, and human approval boundaries.
---

# Harness Engineering

## Core Concepts

### Harness Boundary
Separate agent from environment. Four surface classes:

| Surface | Examples | Rule |
| --- | --- | --- |
| Locked | Eval metric, rubric, validation script, merge policy | Agent may read and propose changes, but cannot score itself with modified rules |
| Editable | Skill draft, experiment file, prompt, config under test | Agent may mutate during the loop |
| Append-only | Results log, research thread, rejected ideas | Agent may append, not rewrite |
| Human-controlled | Merge, production deploy, credentials, destructive operations | Requires explicit human approval |

### Tight Feedback Loops
Karpathy's `autoresearch`: one editable file, one locked evaluation file, fixed wall-clock budget, one scalar metric, git rollback, durable results log. For open-ended research: locked rubrics, deterministic structure checks, source traceability, human review thresholds.

### Durable State
Store plans, source queues, results, failures, handoffs in files. Append-only logs for: what was tried, what improved/failed, why kept/discarded, upstream sources checked, next actions.

### Search Discipline
1. Refresh upstream sources on schedule
2. Require novelty checks before large budgets
3. Preserve rejected attempts to avoid rediscovery
4. Run leave-one-out pruning when stack has multiple additions
5. Reward simplification when quality equal
6. Use separate verification before promotion

### Mechanism Registry
For research-to-skill: track accepted mechanisms with `mechanism_id`, `owning_skill`, `status`, activation scenario, behavior change, evidence, failure modes. Compare novelty against registry before corpus overlap.

### Governance
Agents may draft changes, run checks, write PR summaries. Must not merge, deploy, or push without human approval unless explicitly granted.

## Loop Patterns

### Autoresearch-Style Loop
`read locked context -> choose hypothesis -> edit allowed surface -> commit/checkpoint -> run evaluator -> log result -> keep if better -> discard/rollback if worse -> repeat`

Properties: evaluator outside editable surface, fixed feedback cadence, audit trail for failures, cheap rollback, crash/timeout policy.

### Research-To-Skill Loop
`discover -> retrieve -> gate -> score -> extract mechanism -> map to existing/new skill -> draft proposal -> validate structure -> prepare PR -> human review`

Locked evaluator: source rubrics + skill-change rubrics + structure checks + reviewer approval. Editable artifact: proposed skill delta.

### Metric Gaming Resistance
Guard against: editing eval code then self-approving, verbose content that pleases judge but harms activation, citing unretrieved sources, optimizing aggregate while failing critical dimension, omitting failed results from log.

Mitigation: lock rubrics per run, report per-dimension scores, require source retrieval evidence, preserve rejected attempts, route governance changes to human review.

## Guidelines
1. Lock evaluators before starting the loop
2. Keep editable surfaces narrow for reliable diffs
3. Write durable logs before context compaction
4. Report per-dimension scores instead of only aggregate
5. Require source retrieval before citation
6. Add novelty gates for broad search and pruning gates for complex stacks
7. Prefer simplification when quality equal
8. Separate PR preparation from merge authority
9. Revalidate harness changes with old and new evaluators
10. Treat stopped autonomous loops as harness failures

## Gotchas
- Mutable evaluator: agent may optimize benchmark instead of task
- Chat-only memory: long runs fail after compaction
- No discard record: agents repeat failed ideas
- Complexity accretion: agents stack changes, never remove
- Premature novelty claims: compare against repo skills and rejected logs
- Monitor misreporting: require source citations for claims
- Human approval ambiguity: "prepare PR" ≠ "merge PR"
- Volatile source drift: use dated evidence, schedule revalidation
