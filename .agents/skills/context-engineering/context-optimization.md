---
name: context-optimization
description: This skill should be used for improving context efficiency: context budgeting, observation masking, prefix or KV-cache strategy, partitioning, token-cost reduction, retrieval scoping, and extending effective context capacity without lowering answer quality.
---

# Context Optimization Techniques

Extend effective capacity through strategic compression, masking, caching, and partitioning. Apply techniques in priority order below.

## Core Concepts

Apply four strategies in this priority order:

1. **KV-cache optimization** — Reorder and stabilize prompt structure so the inference engine reuses cached Key/Value tensors. Apply first when stable prefixes exist. Lowest quality risk, immediate savings.
2. **Observation masking** — Replace verbose tool outputs with compact references once processed. Often yields the largest capacity gains — tool outputs can dominate agent trajectories.
3. **Compaction** — Summarize accumulated context when utilization exceeds 70%, then reinitialize with the summary. Apply after masking has removed low-value bulk.
4. **Context partitioning** — Split work across sub-agents with isolated contexts when estimated context exceeds 60% of the window limit. Reserve for tasks where savings exceed coordination overhead.

### Budget Management

Allocate explicit token budgets before the session begins. Monitor continuously and trigger optimization when any category exceeds its allocation or total utilization crosses 70%.

| Category | Approach |
|---|---|
| System prompt | Fixed, never compress |
| Tool definitions | Fixed, consolidate overlapping tools |
| Retrieved documents | Allocate; summarize before loading |
| Message history | Allocate; apply compaction at threshold |
| Tool outputs | Allocate; mask resolved observations |
| Reserved buffer | 5-10% of total |

**Triggers**: utilization >80% → compaction. Attention degradation indicators (repetition, missed instructions) → masking + compaction. Quality score drops → audit composition before optimizing.

## Optimization Decision Framework

| Context Composition | First Action | Second Action |
|---|---|---|
| Tool outputs dominate (>50%) | Observation masking | Compaction of remaining turns |
| Retrieved documents dominate | Summarization | Partitioning if docs are independent |
| Message history dominates | Compaction with selective preservation | Partitioning for new subtasks |
| Multiple components contribute | KV-cache optimization first, then layer masking + compaction |
| Near-limit with active debugging | Mask resolved tool outputs only — preserve error details |

## Performance Targets

| Technique | Target |
|---|---|
| Compaction | 50-70% token reduction, <5% quality degradation, <10% latency overhead |
| Masking | 60-80% reduction in masked observations, <2% quality impact, near-zero latency |
| Cache optimization | 70%+ hit rate, 50%+ cost reduction, 40%+ latency reduction |
| Partitioning | Net savings after coordinator overhead; break-even typically at 3+ subtasks |

## Guidelines

1. Measure before optimizing — know your current state
2. Apply masking before compaction — remove low-value bulk first, then summarize
3. Design for cache stability with consistent prompts
4. Partition before context becomes problematic
5. Monitor optimization effectiveness over time
6. Balance token savings against quality preservation
7. Test optimization at production scale
8. Implement graceful degradation for edge cases

## Gotchas

1. Whitespace breaks KV-cache — pin system prompts as immutable strings; do not interpolate dynamic content.
2. Timestamps in system prompts destroy cache hit rates — move dynamic metadata into a user message after the stable prefix.
3. Compaction under pressure loses critical state — trigger at 70-80%, not 90%+; use a separate clean model call if compaction must happen late.
4. Masking error outputs breaks debugging loops — suspend masking for error-related observations during active debugging (last 3 turns).
5. Partitioning overhead can exceed savings — estimate total tokens before committing; break-even typically requires 3+ subtasks.
6. Cache miss cost spikes after deployment changes — roll out prompt changes gradually, monitor cache hit rate during deployment.
7. Compaction creates false confidence in stale summaries — re-validate the summary against the current task goal after compaction.
