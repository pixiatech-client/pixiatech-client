---
name: systematic-debugging
description: Four-phase debugging methodology with root cause analysis. Use when investigating bugs, fixing test failures, or troubleshooting unexpected behavior. Emphasizes NO FIXES WITHOUT ROOT CAUSE FIRST.
---

# Systematic Debugging

## Core Principle

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.** Never apply symptom-focused patches that mask underlying problems.

## The Four-Phase Framework

### Phase 1: Root Cause Investigation
- Read error messages thoroughly
- Reproduce the issue consistently
- Examine recent changes
- Gather diagnostic evidence (logs, stack traces, state dumps)
- Trace data flow — follow the call chain to find where bad values originate
- Never fix where errors appear; always trace to the original trigger

### Phase 2: Pattern Analysis
- Locate working examples of similar code
- Compare implementations completely
- Identify differences between working and broken
- Understand dependencies

### Phase 3: Hypothesis and Testing
- Formulate ONE clear hypothesis
- Design minimal test (change ONE variable at a time)
- Predict the outcome
- Run the test and verify results
- Iterate or proceed

### Phase 4: Implementation
- Create failing test case that captures the bug
- Implement single fix addressing root cause
- Verify test passes; run full test suite
- If THREE or more fixes fail consecutively, STOP — signals architectural problems

## Red Flags

Stop immediately if you catch yourself thinking:
- "Quick fix for now, investigate later"
- "One more fix attempt" (after multiple failures)
- "This should work" (without understanding why)
- "Let me just try..." (without hypothesis)
- "It works on my machine" (without investigating difference)

## Debugging Checklist

Before claiming a bug is fixed:
- [ ] Root cause identified and documented
- [ ] Hypothesis formed and tested
- [ ] Fix addresses root cause, not symptoms
- [ ] Failing test created that reproduces bug
- [ ] Test now passes with fix
- [ ] Full test suite passes
- [ ] No "quick fix" rationalization used
- [ ] Fix is minimal and focused
