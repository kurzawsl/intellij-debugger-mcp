# AGENTS.md — intellij-debugger-mcp

MCP server (TypeScript, Node 20+) giving Claude 41 debugger tools via the intellij-debug-bridge plugin REST API on localhost:19999.

This file is the contract every agent (and every human) on this project works from.
It is read natively by Claude Code (via CLAUDE.md), Codex, Kimi and others.

## Read first

1. `docs/INDEX.md` — the table of contents. Read it BEFORE opening anything else, then
   go to the targeted file. Do not grep the whole repo to orient yourself.
2. `.fleet/humans.md` — who the humans are and what each of them decides on.
3. Your own charter: `.fleet/agents/<your-short-name>.md` (rendered into your CLAUDE.md).

## Build / test / run

- Toolchain: Node 20+ (Node 26 on the maintainer's box), TypeScript 5, `@modelcontextprotocol/sdk`.
- Install: `npm ci`
- Build: `npm run build` (tsc → `dist/`)
- Test: `npm test` (`node --test`; the suite is currently EMPTY — adding real tests is open work)
- Run: `node dist/index.js` (stdio MCP server; needs the intellij-debug-bridge plugin listening on `localhost:19999`)
- Protocol smoke test without the IDE: connect with an MCP client and `tools/list` — expect 41 tools.
- CI: `.github/workflows/ci.yml`.

## Project facts agents must not get wrong

- This is the CLIENT. The IntelliJ plugin (`kurzawsl/intellij-debug-bridge`) is the server; its REST contract is the source of truth.
- Config via env: `INTELLIJ_DEBUG_HOST`, `INTELLIJ_DEBUG_PORT`, `INTELLIJ_IDEA_COMMAND` (see README).
- `debug_start_intellij` / `debug_kill_intellij` must stay cross-platform (macOS `open -a`, Linux/Windows `idea` launcher); kill patterns use the `[x]` bracket trick so pkill never matches its own shell.
- Every tool call must return a graceful error when the plugin is not running (never crash the server).
- Public repo: no personal paths, no employer names, no real chat IDs in examples.

## Conventions

- Small, reviewable commits; one concern per PR.
- Never commit secrets. MCP servers are referenced by NAME in `.fleet/agents/*.json`; the
  definitions live in the operator's own catalog, outside this repo.
- Evidence over claims: a task is done when its artifacts exist and its checks ran.
- Escalate to the human named in `.fleet/humans.md` for anything that is theirs to decide.

## Team

Humans and their roles are listed in `.fleet/humans.md`. Agents are defined as charters in
`.fleet/agents/` (see `.fleet/agents/README.md`) and materialised with
`fleet project onboard`. `fleet team list` shows both side by side.
