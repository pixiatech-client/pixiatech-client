---
name: multi-agent-patterns
description: Use when designing multi-agent systems needing context isolation, supervisor/swarm coordination, explicit handoffs, parallel execution, or a decision on whether multiple agents are justified.
---

# Multi-Agent Architecture Patterns

Sub-agents exist primarily to isolate context, not to anthropomorphize role division. Context isolation is the primary benefit — each agent operates without accumulated noise from other subtasks.

## When to Activate

- Single-agent context limits constrain task complexity
- Tasks decompose naturally into parallel subtasks
- Different subtasks need different tools or system prompts
- Building systems handling multiple domains simultaneously
- Scaling beyond single-context limits
- Designing production systems with specialized components

Do not activate for: task-model fit or pipeline shape before topology is known (`project-development`), hosted sandbox/warm-pool infrastructure (`hosted-agents`), orchestrator KV-cache compaction (`latent-briefing`), tool design (`tool-design`).

## Core Concepts

Choose among three patterns based on coordination needs:

- **Supervisor/orchestrator** — Central coordinator delegates to specialists, synthesizes results. Use for tasks with clear decomposition and human oversight.
- **Peer-to-peer/swarm** — Any agent transfers control to any other through explicit handoff. Use for flexible exploration, emergent requirements.
- **Hierarchical** — Layered abstraction (strategy → planning → execution). Use for large-scale projects with management layers.

Design around explicit coordination protocols, consensus mechanisms that resist sycophancy, and failure handling that prevents error cascades.

## Token Economics

| Architecture | Token Multiplier | Use Case |
|--------------|------------------|----------|
| Single agent chat | Baseline | Simple queries |
| Single agent with tools | Higher | Tool-using tasks |
| Multi-agent system | Much higher | Complex coordination |

Budget for ~15x baseline token cost including coordination overhead and retries. Prioritize model quality alongside architecture — better models often outperform more agents.

## Architectural Patterns

### Supervisor/Orchestrator
Central agent maintains global state, decomposes objectives, routes to workers. Trade-off: strict control and easy human intervention, but supervisor context becomes bottleneck, failures cascade, telephone game degrades sub-agent responses.
- **Fix telephone game**: implement `forward_message` tool so sub-agents pass responses directly to users.
- Cap workers per supervisor at 3-5; add a second tier instead of overloading one.

### Peer-to-Peer/Swarm
Agents communicate directly via explicit handoffs. No single point of failure, effective breadth-first scaling. Trade-off: coordination complexity increases with agent count, divergence risk rises without central state keeper.

### Hierarchical
Strategy (goal) → Planning (decomposition) → Execution (atomic tasks). Clear separation of concerns, different context structures per level. Trade-off: coordination overhead between layers, potential strategy-execution misalignment.

## Context Isolation Mechanisms

- **Full context delegation** — Share planner's entire context. Use when sub-agent needs complete understanding. Partially defeats isolation purpose.
- **Instruction passing** — Sub-agent receives only what it needs via function call. Use for simple, well-defined subtasks. Maintains isolation.
- **File system memory** — Agents read/write to persistent storage. Use for complex tasks with shared state. Avoids context bloat from state passing.

Default to instruction passing; escalate to file system memory when shared state needed.

## Consensus and Coordination

- **Weighted voting** — Weight by confidence or expertise; avoid simple majority that treats weak models equal to strong.
- **Debate protocols** — Adversarial critique over multiple rounds; guard against sycophantic convergence.
- **Trigger-based intervention** — Monitor for stall and sycophancy markers.

## Failure Modes and Mitigations

| Failure | Mitigation |
|---------|-----------|
| Supervisor bottleneck | Constrain worker output schemas, use checkpointing |
| Coordination overhead | Minimize communication, batch results, use async patterns |
| Divergence | Define objective boundaries per agent, implement convergence checks, set TTL limits |
| Error propagation | Validate outputs before passing, retry with circuit breakers, use verification agent |
| Agent sprawl | Start with minimum viable (3-5). Each additional agent adds quadratic communication channels |
| Missing shared state | Establish persistent shared storage before building workflows |

## Guidelines

1. Design for context isolation as the primary benefit
2. Choose pattern by coordination needs, not organizational metaphor
3. Implement explicit handoff protocols with state passing
4. Use weighted voting or debate for consensus
5. Monitor for supervisor bottlenecks; implement checkpointing
6. Validate outputs before passing between agents
7. Set TTL limits to prevent infinite loops
8. Test failure scenarios explicitly

## Gotchas

1. Supervisor context pressure grows non-linearly — cap at 3-5 workers, add second tier.
2. Multi-agent costs ~15x baseline — budget accordingly including coordination, retries, consensus.
3. Agents converge on agreeable not correct answers — assign adversarial roles, require stated disagreements.
4. Each additional agent adds quadratic communication channels — start minimal, add only for clear isolation benefit.
5. Information degrades across message-passing hops — use filesystem coordination for faithful state access.
6. One agent's hallucination becomes another's fact — add validation checkpoints between agents.
7. Over-decomposition creates more coordination than task value — decompose only when subtasks need separate contexts.
8. Agents without shared storage duplicate work and lose state — establish shared persistent storage first.
