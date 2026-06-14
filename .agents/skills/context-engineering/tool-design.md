---
name: tool-design
description: This skill should be used for the tool-interface layer of an agent system: writing tool descriptions agents can route on, designing tool schemas and response formats, naming conventions, actionable error recovery messages, MCP server design, tool-set consolidation, and deciding when to add or remove an individual tool.
---

# Tool Design for Agents

## Core Concepts

Design every tool as a contract between a deterministic system and a non-deterministic agent. The consolidation principle: if a human cannot definitively say which tool to use, an agent cannot either. Reduce the tool set until each tool has one unambiguous purpose.

Treat every tool description as prompt engineering that directly steers agent behavior. Write descriptions answering: what does the tool do, when to use it, what does it return.

## Design Patterns

### Tool Description Structure
Every description must answer four questions:
1. **What** does the tool do? (avoid "helps with" or "can be used for")
2. **When** should it be used? (direct triggers and indirect signals)
3. **What inputs** does it accept? (each parameter with types, constraints, defaults, format examples)
4. **What does it return?** (output format, success/error payloads)

Set defaults for common use cases to reduce agent burden.

### Consolidation Principle
Build single comprehensive tools instead of multiple narrow overlapping tools. Consolidation eliminates redundant descriptions and selection ambiguity. Keep tools separate when they have fundamentally different behaviors, serve different contexts, or must be callable independently.

### Architectural Reduction
Remove most specialized tools in favor of primitive, general-purpose capabilities. Prefer direct file system access via single command execution tool over custom exploration tools. Choose reduction when data is well-documented and model has sufficient reasoning. Avoid reduction when data is messy, domain requires specialized knowledge, or safety constraints apply.

### Response Format Optimization
Offer concise vs detailed response format options. Concise: essential fields (confirmations). Detailed: complete objects (when full context drives decisions). Document which to use when.

### Error Message Design
Every error must state what went wrong and how to correct it. Include: retry guidance for retryable errors, corrected format examples for input errors, specific missing fields for incomplete requests. "Failed" provides zero recovery signal.

### Tool Definition Schema
Use verb-noun pattern for names (`get_customer`, `create_order`). Use consistent parameter names across tools (always `customer_id`). Use consistent return field names.

### Tool Collection Design
Limit to smallest set with non-overlapping purposes. Use namespacing for logical groupings. Implement umbrella tools that route to specialized sub-tools.

### MCP Tool Naming
Use fully qualified names: `ServerName:tool_name`. Without server prefix, agents fail to locate tools across multiple MCP servers.

## Tool Audit Checklist
1. **Name**: verb-noun, namespaced if multi-domain catalog
2. **Description**: states what, when, and what returns
3. **Schema**: every parameter has type, constraints, defaults, examples
4. **Return shape**: success and error payloads documented
5. **Recovery**: each error tells agent what to change before retrying
6. **Overlap**: no other tool has same activation scenario
7. **Consolidation**: adjacent narrow tools merged unless independent calls required
8. **Token impact**: large responses support concise or file-reference mode

## Guidelines
1. Write descriptions answering what, when, what returns
2. Use consolidation to reduce ambiguity
3. Implement response format options for token efficiency
4. Design error messages for agent recovery
5. Use consistent naming conventions across catalog
6. Limit tool count; use namespacing for organization
7. Test tool designs with actual agent interactions
8. Iterate based on observed failure modes
9. Question whether each tool enables or constrains the model
10. Prefer primitive, general-purpose tools over specialized wrappers
11. Invest in documentation quality over tooling sophistication
12. Build minimal architectures that benefit from model improvements

## Gotchas
- Vague descriptions: leave too many questions unanswered; state exact database, query format, return shape
- Cryptic parameter names: force agents to guess meaning
- Missing error recovery: generic messages provide no recovery signal
- Inconsistent naming: `id` vs `identifier` vs `customer_id` creates confusion
- MCP namespace collisions: always use fully qualified `ServerName:tool_name`
- Tool description rot: descriptions become inaccurate as APIs evolve; version and review
- Over-consolidation: single tool with too many parameters causes selection errors
- Parameter explosion: too many optional parameters overwhelm agent decisions
- Missing error context: failing without specifying invalid input or expected format
