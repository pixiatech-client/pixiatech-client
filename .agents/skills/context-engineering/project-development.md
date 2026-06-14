---
name: project-development
description: This skill should be used for project-level decisions about LLM-powered systems: whether an LLM is the right primitive for the task at hand, the shape of a multi-stage batch or agent pipeline, token and cost estimation, choosing between single-agent and multi-agent at the project level, structured output design for downstream parsing, and structuring agent-assisted iteration.
---

# Project Development

## Core Concepts

### Task-Model Fit
**Proceed when task has:** synthesis across sources, subjective judgment with rubrics, natural language output, error tolerance, batch processing, domain knowledge in training data.

**Stop when task has:** precise computation, real-time requirements, perfect accuracy requirements, proprietary data dependence, sequential dependencies, deterministic output requirements.

Always validate with a manual prototype before building automation: test one representative input, evaluate output quality.

### Pipeline Architecture
Separate deterministic and non-deterministic stages:
```
acquire -> prepare -> process -> parse -> render
```
Stages 1, 2, 4, 5 are deterministic. Stage 3 (LLM calls) is non-deterministic and expensive. Design each stage to be discrete, idempotent, cacheable, independent.

### File System as State Machine
```
data/{id}/
  raw.json         # acquire complete
  prompt.md        # prepare complete
  response.md      # process complete
  parsed.json      # parse complete
```
Check processing status by file existence. Re-run by deleting output file. Debug by reading intermediates.

### Structured Output Design
1. Use section markers parsers can match
2. Include format examples in the prompt
3. State "I will parse this programmatically"
4. Constrain values (enumerations, ranges, fixed formats)
5. Build parsers tolerant of minor formatting variations
6. Log parsing failures, don't crash

### Cost Estimation
`Total cost = (items x tokens_per_item x price_per_token) + API overhead`

Estimate input + output tokens per item, multiply by count, add 20-30% buffer for retries. Track actuals during development. Reduce via truncation, smaller models, cached partial results, parallel processing.

## Architectural Decisions

### Single vs Multi-Agent
Default to single-agent pipelines for batch processing with independent items. Escalate to multi-agent when: parallel exploration needed, task exceeds single context window, specialized sub-agents demonstrably improve quality. Choose multi-agent for context isolation, not role anthropomorphization.

### Architectural Reduction
Start with minimal architecture; add complexity only when production evidence proves it necessary. Reduce when data is well-documented and model has sufficient reasoning capability. Add complexity when data is messy, domain needs specialized knowledge, safety constraints require limiting agents.

### Iteration and Refactoring
Plan for multiple architectural iterations. Keep architecture simple and unopinionated so refactoring is cheap. Test across model generations. Design systems that benefit from model improvements rather than locking in current limitations.

## Project Planning Template
1. **Task Analysis**: define input/output, classify task type, set acceptable error rate, estimate value per completion
2. **Manual Validation**: test one example with target model, evaluate quality, identify failure modes, estimate tokens
3. **Architecture Selection**: pipeline vs multi-agent, identify tools and data sources, design storage/caching, plan parallelization
4. **Cost Estimation**: items x tokens x price + 20-30% buffer, estimate development time, identify infrastructure
5. **Development Plan**: stage-by-stage implementation with testing, set milestones tied to quality metrics, plan rollback

## Guidelines
1. Validate task-model fit with manual prototyping before building automation
2. Structure pipelines as discrete, idempotent, cacheable stages
3. Use file system for state management and debugging
4. Design prompts for structured, parseable outputs with format examples
5. Start minimal; add complexity only when proven necessary
6. Estimate costs early and track throughout development
7. Build robust parsers that handle LLM output variations
8. Expect and plan for multiple architectural iterations
9. Test whether scaffolding helps or constrains model performance
10. Use agent-assisted development for rapid iteration

## Gotchas
- Skipping manual validation: building before verifying model capability wastes development time
- Monolithic pipelines: combining all stages prevents independent debugging and iteration
- Over-constraining model: adding guardrails that reduce performance vs letting model handle it
- Ignoring costs until production: token costs compound, causing budget surprises and rework
- Perfect parsing requirements: expecting LLMs to perfectly follow format leads to brittle systems
- Premature optimization: adding caching/parallelization before pipeline works correctly
- Model version lock-in: building pipelines that only work with one model version creates fragility
- Evaluation-less deployment: shipping without measuring output quality means regressions go undetected
- Provenance drift: raw inputs and intermediate outputs across ad hoc folders become unauditable
