---
name: context-compression
description: This skill should be used when long-running agent sessions need context compression, structured summarization, compaction, token-per-task optimization, or durable handoff summaries that preserve decisions, files, risks, and next actions.
---

# Context Compression Strategies

Optimize for tokens-per-task, not tokens-per-request. Track re-fetching frequency as the primary quality signal.

## Core Concepts

1. **Anchored Iterative Summarization**: Long-running sessions where file tracking matters. Maintain structured summaries with explicit sections (session intent, file modifications, decisions, next steps). On each compression trigger, summarize only the newly-truncated span and merge with existing summary — never regenerate from scratch.

2. **Opaque Compression**: Short sessions where maximum token savings are required and re-fetching costs are low. Achieves 99%+ compression ratios but sacrifices interpretability. Never use when debugging or artifact tracking is critical.

3. **Regenerative Full Summary**: Use when summary readability is critical and sessions have clear phase boundaries. Generates detailed structured summaries on each compression trigger. Risk: cumulative detail loss across repeated cycles.

### Artifact Trail Problem

Preserve these categories explicitly in every compression cycle:
- Which files were created (full paths)
- Which files were modified and what changed (include function names)
- Which files were read but not changed
- Specific identifiers: function names, variable names, error messages, error codes

Implement a separate artifact index or explicit file-state tracking rather than relying on the summarizer.

### Summary Structure

```markdown
## Session Intent
## Files Modified
## Decisions Made
## Current State
## Next Steps
```

Adapt sections to domain (debugging: "Root Cause", "Error Messages"; migration: "Source Schema", "Target Schema").

### Compression Triggers

| Strategy | Trigger Point | Trade-off |
|----------|---------------|-----------|
| Fixed threshold | 70-80% context utilization | Simple but may compress too early |
| Sliding window | Keep last N turns + summary | Predictable context size |
| Importance-based | Compress low-relevance sections first | Complex but preserves signal |
| Task-boundary | Compress at logical task completions | Clean summaries, unpredictable timing |

Default to sliding window for coding agents.

### Probe-Based Evaluation

| Probe Type | What It Tests |
|------------|---------------|
| Recall | Factual retention |
| Artifact | File tracking |
| Continuation | Task planning |
| Decision | Reasoning chain |

### Six Evaluation Dimensions

1. Accuracy — file paths, function names, error codes correct?
2. Context Awareness — reflects current conversation state?
3. Artifact Trail — knows which files were read/modified?
4. Completeness — addresses all parts of the question?
5. Continuity — work continues without re-fetching?
6. Instruction Following — respects stated constraints?

### Compression Ratios (benchmark)

| Method | Compression Ratio | Quality Score |
|--------|-------------------|---------------|
| Anchored Iterative | 98.6% | 3.70 |
| Regenerative | 98.7% | 3.44 |
| Opaque | 99.3% | 3.35 |

### Three-Phase Workflow (Large Codebases)

1. **Research Phase**: Explore architecture, docs, interfaces. Compress into structured analysis of components/dependencies/boundaries.
2. **Planning Phase**: Convert research doc into implementation specification with function signatures, type definitions, data flow.
3. **Implementation Phase**: Execute against spec. Rarely needs further compression.

## Guidelines

1. Optimize for tokens-per-task, not tokens-per-request
2. Use structured summaries with explicit sections for file tracking
3. Trigger compression at 70-80% context utilization
4. Implement incremental merging rather than full regeneration
5. Test compression quality with probe-based evaluation
6. Track artifact trail separately if file tracking is critical
7. Accept slightly lower compression ratios for better quality retention
8. Monitor re-fetching frequency as a compression quality signal

## Gotchas

- Never compress tool definitions or schemas — treat as immutable anchors
- Compressed summaries hallucinate facts — always validate against source before discarding originals
- Compression breaks artifact references — preserve identifiers verbatim in dedicated sections
- Early turns contain irreplaceable constraints — protect them or extract into persistent preamble
- Aggressive ratios compound across cycles (95%^3 = 0.0125% remaining)
- Code and prose need different compression — preserve code blocks verbatim
- Probe-based evaluation gives false confidence — rotate probe sets to cover all six dimensions
