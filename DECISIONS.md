# intellij-debugger-mcp — Decisions Log

This file captures *why*, not *what*. Read before opening a PR.
Append new entries at the TOP. Keep entries ≤15 lines.

## 2026-04-23 — docs: README polish — badges, install snippet, example output
**Context**: README lacked install instructions, examples, or badges; repo looked abandoned from the outside. (commit c620706)
**Decision**: Polished README with badges, install snippet, example output.
**Why this over alternatives**: Public repos are judged by their cover; professional docs are a cheap signal.
**Consequences**: Future README edits should match the tone + structure. Don't degrade it.
---

## 2026-04-23 — chore: add process.uncaughtException + unhandledRejection handlers
**Context**: None of the MCP entry points surfaced uncaughtException/unhandledRejection. Rejected promises silently killed the process. (commit 712a654)
**Decision**: Registered both handlers at the top of the entry point. They log JSON to stderr and process.exit(1).
**Why this over alternatives**: Silent death leaves Claude Code guessing; explicit stderr + non-zero exit is loud and debuggable.
**Consequences**: If you throw from inside an MCP handler AND the SDK doesn't catch it, the whole server dies. That's intentional — better loud than zombied.
---

## 2026-04-23 — chore: prep for public release
**Context**: Repo was private; going public required LICENSE, clean package.json, no committed secrets. (commit 1352d67)
**Decision**: Added MIT LICENSE, polished package.json (description, author, repository, keywords), tightened .gitignore.
**Why this over alternatives**: Public-repo hygiene is a gate — any secret in history is permanent exposure.
**Consequences**: Future commits must not add secrets. .env is gitignored; credentials must come from env vars.
---

## 2026-04-23 — feat: initial IntelliJ debugger MCP server
**Context**: See commit 9490189. (commit 9490189)
**Decision**: feat: initial IntelliJ debugger MCP server
**Why this over alternatives**: Addressed at the time; see commit body for detail.
**Consequences**: Verify in DECISIONS before modifying this area.
---

