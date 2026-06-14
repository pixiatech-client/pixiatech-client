---
name: context-fundamentals
description: This skill should be used to explain or reason about the foundational concepts of context engineering: what context is, the anatomy of a context window, how attention mechanics work, the U-shaped attention curve, why context quality matters more than quantity, and the mental models needed to interpret every other context-engineering decision.
---

# Context Engineering Fundamentals

Context is the complete state available to a language model at inference time: system instructions, tool definitions, retrieved documents, message history, and tool outputs. Context engineering is the discipline of curating the smallest high-signal token set that maximizes the likelihood of desired outcomes.

## Core Concepts

Treat context as a finite attention budget, not a storage bin. Every token added competes for the model's attention and depletes a budget that cannot be refilled mid-inference. The engineering problem is maximizing utility per token against three constraints: the hard token limit, the softer effective-capacity ceiling, and the U-shaped attention curve that penalizes information placed in the middle of context.

### Four Principles

1. **Informativity over exhaustiveness** — include only what matters for the current decision; design systems that can retrieve additional information on demand.
2. **Position-aware placement** — place critical constraints at the beginning and end of context because middle-position information is less reliably recovered.
3. **Progressive disclosure** — load skill names and summaries at startup; load full content only when a skill activates for a specific task.
4. **Iterative curation** — context engineering is an ongoing discipline applied every time content is passed to the model.

## Guidelines

1. Treat context as a finite resource with diminishing returns
2. Place critical information at attention-favored positions (beginning and end)
3. Use progressive disclosure to defer loading until needed
4. Organize system prompts with clear section boundaries
5. Monitor context usage during development
6. Implement compaction triggers at 70-80% utilization
7. Design for context degradation rather than hoping to avoid it
8. Prefer smaller high-signal context over larger low-signal context

## Gotchas

1. Nominal window is not effective capacity — budget below the window until degradation tests prove otherwise.
2. Character-based token estimates silently drift — use the provider's actual tokenizer for budget-critical calculations.
3. Tool schemas inflate 2-3x after JSON serialization — audit serialized token counts, not source-code line counts.
4. Message history balloons silently in agentic loops — set a hard token ceiling and trigger compaction proactively.
5. Critical instructions in the middle get lost — anchor safety constraints and guardrails at the top or bottom.
6. Progressive disclosure that loads too eagerly defeats its purpose — set strict activation thresholds.
7. Mixing instruction altitudes causes inconsistent behavior — group instructions by altitude level, keep each section internally consistent.
