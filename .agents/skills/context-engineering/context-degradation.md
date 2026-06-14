---
name: context-degradation
description: This skill should be used for diagnosing and mitigating context degradation: lost-in-middle failures, context poisoning, context clash, context confusion, attention-pattern issues, and agent performance degradation caused by accumulated or conflicting context.
---

# Context Degradation Patterns

Degradation is not binary — it is a continuum through five distinct patterns. Each has specific detection signals and mitigation strategies.

## Core Concepts

**U-shaped attention curve**: Beginning and end positions receive reliable attention; middle positions suffer 10-40% reduced recall accuracy. The first token acts as an "attention sink" absorbing disproportionate budget.

**Context poisoning circuit breaker**: Once a hallucination, tool error, or incorrect fact enters context, it compounds through repeated self-reference. Detection requires tracking claim provenance; recovery requires truncating to before the poisoning point.

**Filter aggressively before loading**: Even a single irrelevant document measurably degrades performance — models cannot "skip" irrelevant content. Move non-essential information behind tool calls.

**Isolate task contexts**: Multiple objectives in one window cause models to blend requirements from different tasks. Explicit task segmentation with separate context windows eliminates cross-contamination.

**Resolve clash through priority rules**: When correct-but-contradictory sources coexist, mark contradictions explicitly, establish source precedence, and filter outdated versions before they enter context.

## Mitigation Framework

| Pattern | Strategy |
|---|---|
| Context utilization >70% | **Write** — save context outside the window (scratchpads, files, external storage) |
| Distraction or confusion symptoms | **Select** — pull only relevant context via retrieval, filtering, prioritization |
| Context growing but all relevant | **Compress** — summarize, abstract, mask observations |
| Confusion/clash or independent tasks | **Isolate** — split context across sub-agents or sessions |

### Architectural Patterns

- Just-in-time context loading: retrieve only when the current reasoning step needs it
- Observation masking: replace verbose outputs with compact references after processing
- Sub-agent architectures: each agent holds only task-relevant context
- Trigger compaction before the model-specific degradation onset threshold, not after symptoms appear

## Guidelines

1. Monitor context length and performance correlation during development
2. Place critical information at beginning or end of context
3. Implement compaction triggers before degradation becomes severe
4. Validate retrieved documents for accuracy before adding to context
5. Use versioning to prevent outdated information from causing clash
6. Segment tasks to prevent context confusion across different objectives
7. Design for graceful degradation rather than assuming perfect conditions
8. Test with progressively larger contexts to find degradation thresholds

## Gotchas

1. Normal variance looks like degradation — establish a baseline over multiple runs, look for sustained decline tied to context growth.
2. Model-specific thresholds go stale — re-benchmark quarterly and after any major model update.
3. Needle-in-haystack scores create false confidence — use task-specific benchmarks that mirror actual workloads.
4. Contradictory retrieved documents poison silently — implement contradiction detection before documents enter context.
5. Prompt quality problems masquerade as degradation — verify the same prompt works correctly at low context lengths first.
6. Degradation is non-linear with a cliff edge — set compaction triggers at 70% of known onset, not at the onset itself.
7. Over-organizing context can backfire — test whether heavy structural formatting actually helps for the specific task.
