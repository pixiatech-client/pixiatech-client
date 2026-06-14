---
name: filesystem-context
description: Use for file-backed context: durable scratchpads, tool-output offloading, just-in-time discovery, cross-agent handoff files, filesystem memory, cleanup policies.
---

# Filesystem-Based Context Engineering

Use the filesystem as the overflow layer for agent context. Prefer dynamic discovery over static inclusion.

## When to Activate

- Tool outputs bloating context window
- Agents need state persistence across long trajectories
- Sub-agents share information without message passing
- Tasks exceed context window capacity
- Agents that learn and update own instructions
- Scratch pads for intermediate results
- Terminal/log output needs agent access

Do not activate for: semantic cross-session memory (`memory-systems`), conversation compaction (`context-compression`), token-only efficiency tactics (`context-optimization`), multi-agent topology (`multi-agent-patterns`).

## Core Concepts

Diagnose context failures against four modes:

1. **Missing context** — needed info absent. Fix: persist tool outputs and intermediate results to files.
2. **Under-retrieved context** — retrieved content insufficient. Fix: structure files for targeted retrieval (grep-friendly, clear headers).
3. **Over-retrieved context** — excess content wastes tokens. Fix: offload bulk to files, return compact references.
4. **Buried context** — niche info scattered across files. Fix: combine glob+grep with semantic search.

## Patterns

### Pattern 1: Filesystem as Scratch Pad
Redirect outputs >2000 tokens to scratch files. Return compact summary + file reference. Use grep for searching, read_file with line ranges for targeted retrieval.

### Pattern 2: Plan Persistence
Store plans as structured files (YAML/JSON). Re-read at turn start or after context refresh to maintain coherence.

### Pattern 3: Sub-Agent Communication via Filesystem
Route findings through per-agent workspace directories. Coordinator reads files directly, preserving fidelity without telephone game degradation.

### Pattern 4: Dynamic Skill Loading
Include only skill names + one-line descriptions in static context. Load full skill file on demand. Converts O(n) static cost to O(1) per task.

### Pattern 5: Terminal and Log Persistence
Auto-persist terminal output to files. Query with targeted grep instead of loading entire histories.

### Pattern 6: Learning Through Self-Modification
Write preferences/patterns to instruction files for cross-session loading. Guard with validation.

### Search Techniques
- `ls`/`list_dir`: Directory structure discovery
- `glob`: Pattern-based file finding (e.g., `**/*.py`)
- `grep`: Content search
- `read_file` with ranges: Section-level reads

Use filesystem search for structural/exact-match queries; semantic search for conceptual queries.

## File Organization

```
project/
  scratch/tool_outputs/   # Large tool results
  scratch/plans/          # Active plans and checklists
  memory/                 # Persistent learned info
  skills/                 # Loadable skill definitions
  agents/                 # Sub-agent workspaces
```

Consistent naming with timestamps in scratch files. Keep raw evidence with the run that consumed it.

## Token Accounting

Measure before/after applying filesystem patterns:
- Static vs dynamic context ratio
- Tool output sizes before/after offloading
- Dynamic context usage frequency

## Guidelines

1. Write large outputs to files; return summaries + references
2. Store plans/state in structured files for re-reading
3. Use sub-agent file workspaces instead of message chains
4. Load skills dynamically rather than stuffing system prompt
5. Persist terminal/log output as searchable files
6. Combine grep/glob with semantic search
7. Organize files for agent discoverability
8. Measure token savings to validate patterns
9. Implement cleanup for scratch files
10. Guard self-modification with validation
11. Keep raw evidence with the run that used it

## Gotchas

1. Scratch directories grow unbounded — set retention policies at session boundaries.
2. Multi-agent concurrent writes corrupt state — enforce per-agent directory isolation.
3. Stale file references after moves — verify existence before reading cached paths.
4. Broad globs waste tokens — scope to specific directories/extensions.
5. Unsized file reads dump excess tokens — check size, use line-range reads.
6. Missing existence checks cause cascade errors — always guard reads.
7. Unstructured scratch pads become unparseable — enforce schema from first write.
8. Hardcoded absolute paths break across environments — use relative paths.
