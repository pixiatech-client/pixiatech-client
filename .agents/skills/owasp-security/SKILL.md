---
name: owasp-security
description: OWASP Top 10:2025, ASVS 5.0, LLM Top 10 (2025), and Agentic AI security (2026) for code review and implementation.
---

# OWASP Security Best Practices

## OWASP Top 10:2025

| # | Vulnerability | Key Prevention |
|---|---------------|----------------|
| A01 | Broken Access Control | Deny by default, enforce server-side, verify ownership |
| A02 | Security Misconfiguration | Harden configs, disable defaults, minimize features |
| A03 | Supply Chain Failures | Lock versions, verify integrity, audit dependencies |
| A04 | Cryptographic Failures | TLS 1.2+, AES-256-GCM, Argon2/bcrypt for passwords |
| A05 | Injection | Parameterized queries, input validation, safe APIs |
| A06 | Insecure Design | Threat model, rate limit, design security controls |
| A07 | Auth Failures | MFA, check breached passwords, secure sessions |
| A08 | Integrity Failures | Sign packages, SRI for CDN, safe serialization |
| A09 | Logging Failures | Log security events, structured format, alerting |
| A10 | Exception Handling | Fail-closed, hide internals, log with context |

## Security Code Review Checklist

**Input:** validate all input server-side, parameterized queries, allowlist > denylist, length limits.

**Auth:** Argon2/bcrypt (not MD5/SHA1), session tokens 128+ bits, invalidate on logout, MFA for sensitive ops.

**Access Control:** check framework-level auth middleware first, authorize every request, deny by default, review privilege escalation paths.

**Data:** encrypt at rest, TLS in transit, no secrets in URLs/logs/code, use env/vault.

**Errors:** no stack traces to users, fail-closed, log all exceptions with context, consistent error responses (no enumeration).

## Agentic AI Security (OWASP 2026)

| Risk | Mitigation |
|------|------------|
| Goal Hijack (prompt injection) | Input sanitization, goal boundaries, behavioral monitoring |
| Tool Misuse | Least privilege, fine-grained permissions, validate I/O |
| Identity Abuse | Short-lived scoped tokens, identity verification |
| Supply Chain | Verify signatures, sandbox, allowlist plugins |
| Code Execution | Sandbox execution, static analysis, human approval |
| Memory Poisoning | Validate stored content, segment by trust level |
| Insecure Inter-Agent Comms | Authenticate, encrypt, verify integrity |
| Cascading Failures | Circuit breakers, graceful degradation, isolation |
| Human-Agent Trust Exploitation | Label AI content, user education, verification steps |
| Rogue Agents | Behavior monitoring, kill switches, anomaly detection |

**Agent checklist:** sanitize all inputs, min permissions per tool, short-lived scoped creds, sandbox third-party plugins, isolate code execution, authenticated agent comms, circuit breakers, human approval for destructive actions, anomaly monitoring, kill switch.

## OWASP Top 10 for LLM Applications (2025)

| # | Risk | Key Mitigation |
|---|------|----------------|
| LLM01 | Prompt Injection | Separate trusted instructions from untrusted data, filter outputs |
| LLM02 | Sensitive Info Disclosure | Sanitize RAG data, strip PII, restrict retrieval per user |
| LLM03 | Supply Chain | Verify model provenance, lock versions |
| LLM04 | Data Poisoning | Validate training sources, anomaly-detect ingestion |
| LLM05 | Improper Output Handling | Treat LLM output as untrusted — validate before SQL/shell/HTML/eval |
| LLM06 | Excessive Agency | Minimize tools, require human approval for destructive actions |
| LLM07 | System Prompt Leakage | Never put secrets/keys in system prompt — assume extractable |
| LLM08 | Vector Store Weaknesses | Tenant-isolate, access-control on retrieval, hash chunks |
| LLM09 | Misinformation | Cite sources, require grounding, disclose AI provenance |
| LLM10 | Unbounded Consumption | Rate-limit, cap tokens/tool calls, set timeouts |

**LLM checklist:** never concatenate user input into system prompt, treat LLM output as untrusted before tools/DOM/shell/SQL, min tool surface, human approval for side effects, no secrets in system prompt, trusted RAG sources, per-user budgets, hard timeouts, redact PII before sending to model, pin versions.

## ASVS 5.0 Key Requirements

**L1 (All apps):** passwords 12+ chars, check breached lists, rate-limit auth, session tokens 128+ bits, HTTPS everywhere.

**L2 (Sensitive data):** L1 + MFA, cryptographic key management, comprehensive logging, input validation on all params.

**L3 (Critical):** L1+L2 + HSM for keys, threat modeling docs, advanced monitoring/alerting, penetration testing.

## Language-Specific Quirks

When reviewing in any language, think like a security researcher: memory model, type system, serialization, concurrency (TOCTOU), FFI boundaries, std library CVEs, package ecosystem (typosquatting), build system injection, runtime vs debug differences, error handling (fail-open?).

| Language | Main Risks | Watch For |
|----------|------------|-----------|
| JS/TS | Prototype pollution, XSS, eval | `eval()`, `innerHTML`, `__proto__` |
| Python | Pickle RCE, format string, shell | `pickle`, `eval/exec`, `shell=True` |
| Java | Deserialization RCE, XXE, JNDI | `ObjectInputStream`, `Runtime.exec()`, XML without XXE protection |
| C# | Deserialization, SQLi, path traversal | `BinaryFormatter`, raw SQL strings |
| PHP | Type juggling, file inclusion | `==` vs `===`, `include/unserialize` |
| Go | Race conditions, template injection | `template.HTML()`, `unsafe`, goroutine races |
| Ruby | Mass assignment, YAML deserialization | `YAML.load`, `eval`, mass assignment |
| Rust | Unsafe blocks, FFI, integer overflow | `unsafe`, FFI, overflow in release (`checked_add`) |
| C/C++ | Buffer overflow, use-after-free | `strcpy`, `sprintf`, pointer arithmetic |
| Swift | Force unwrapping crashes | Force unwrap (`!`), `try!`, format strings |
| Kotlin | Null safety bypass, Java interop | Java interop nulls (`!`), reflection |
| Shell | Command injection, word splitting | Unquoted vars, `eval`, backticks |
| SQL | Injection, privilege escalation | Dynamic SQL, prepared statements in ALL cases |
