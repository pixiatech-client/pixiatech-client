---
name: memory-systems
description: Use for persistent semantic memory in agent systems: cross-session retention, entity tracking, temporal validity, graph/vector retrieval, memory consolidation, benchmark selection.
---

# Memory System Design

Default to the simplest layer that meets retrieval needs. Add structure only when retrieval quality degrades.

## When to Activate

- Building agents that persist knowledge across sessions
- Choosing between memory frameworks
- Maintaining entity consistency across conversations
- Reasoning over accumulated knowledge
- Designing production memory architectures
- Evaluating memory systems against benchmarks
- Dynamic entity/relationship extraction and self-improving memory

Do not activate for: file-backed scratchpads (`filesystem-context`), conversation compaction (`context-compression`), token-budget tactics (`context-optimization`), formal BDI mental states (`bdi-mental-states`).

## Core Concepts

Memory is a spectrum from volatile context to persistent storage. Benchmark evidence suggests tool complexity matters less than reliable retrieval. Add temporal or graph structure only when simpler layers fail retrieval or need multi-hop reasoning.

## Production Framework Landscape

| Framework | Architecture | Best For | Trade-off |
|-----------|-------------|----------|-----------|
| **Mem0** | Vector store + graph memory, pluggable backends | Multi-tenant, broad integrations | Less specialized for multi-agent |
| **Zep/Graphiti** | Temporal KG, bi-temporal model | Enterprise + temporal reasoning | Advanced features cloud-locked |
| **Letta** | Self-editing memory, tiered storage (in-context/core/archival) | Agent introspection, stateful services | Complexity for simple uses |
| **Cognee** | Multi-layer semantic graph via customizable ECL pipeline | Evolving memory, multi-hop reasoning | Heavier ingest-time processing |
| **LangMem** | Memory tools for LangGraph | Teams on LangGraph | Tightly coupled to LangGraph |
| **File-system** | Plain files + naming conventions | Prototyping, simple agents | No semantic search/relationships |

Choose by retrieval shape: Zep/Graphiti for temporal bi-modeling, Mem0 for fast production, Letta for deep introspection, Cognee for dense multi-layer graphs.

## Memory Layers (Decision Points)

| Layer | Persistence | Implementation | When to Use |
|-------|------------|----------------|-------------|
| **Working** | Context window only | Scratchpad in prompt | Always |
| **Short-term** | Session-scoped | File-system, in-memory cache | Intermediate results, conversation state |
| **Long-term** | Cross-session | Key-value store → graph DB | User prefs, domain knowledge, entity registries |
| **Entity** | Cross-session | Entity registry + properties | Maintaining identity across conversations |
| **Temporal KG** | Cross-session + history | Graph with validity intervals | Facts that change, time-travel queries |

## Retrieval Strategies

| Strategy | Use When | Limitation |
|----------|----------|------------|
| **Semantic** (embedding similarity) | Direct factual queries | Degrades on multi-hop reasoning |
| **Entity-based** (graph traversal) | "Tell me everything about X" | Requires graph structure |
| **Temporal** (validity filter) | Facts change over time | Requires validity metadata |
| **Hybrid** (semantic + keyword + graph) | Best overall accuracy | Most infrastructure |

## Memory Consolidation

Run consolidation periodically on memory count thresholds, degraded retrieval, or scheduled intervals. Invalidate but do not discard — preserving history matters for temporal reconstruction.

## Guidelines

1. Start with file-system memory; add complexity only when retrieval demands it
2. Track temporal validity for any fact that can change
3. Use hybrid retrieval for best accuracy
4. Consolidate periodically — invalidate but don't discard
5. Design for retrieval failure — always have a fallback
6. Consider privacy implications (retention policies, deletion rights)
7. Benchmark against LoCoMo or LongMemEval before/after changes
8. Monitor memory growth and retrieval latency in production

## Gotchas

1. Loading all memories into prompt degrades attention — use just-in-time retrieval with relevance filtering.
2. Facts without temporal validity tracking poison context — track valid_from/valid_until.
3. Over-engineering early wastes effort — filesystem memory can outperform specialized tooling on some benchmarks.
4. Unbounded memory growth degrades retrieval — set count thresholds or scheduled consolidation.
5. Embedding model mismatch between write/read produces garbage — pin one model per store.
6. Rigid graph schemas break when domain evolves — prefer generic relation types and flexible property bags.
7. Stale memories contradicting current state silently corrupt behavior — implement expiry/confidence decay.
8. Topically related but contextually wrong memories ("Python" snake vs language) — filter on session/domain metadata.
