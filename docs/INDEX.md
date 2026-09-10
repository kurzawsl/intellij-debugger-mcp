# docs/INDEX.md — intellij-debugger-mcp documentation index

Read this first. One line per document: what it is and when to open it.

| Document | What it covers | Open it when |
|---|---|---|
| `AGENTS.md` | the agent/human contract: build, test, conventions | always, once |
| `.fleet/humans.md` | who decides what | before escalating |
| `.fleet/agents/README.md` | the agent charter format | adding or changing an agent |
| `README.md` | install, Claude Code registration, env vars, tool list, architecture | orienting; before adding a tool |
| `REQUIREMENTS.md` | requirements the tools implement | scope questions |
| `DECISIONS.md` | decision log (why things are the way they are) | before reversing a design choice |
| `V2_IMPLEMENTATION_PLAN.md` | how the V2 multi-project API was adopted | anything touching project/session IDs |
| `docs/BUILD-BRIEF.md` | the original build brief — historical | background only |
| `src/intellij-client.ts` | the REST client for the plugin (all HTTP goes through here) | any new endpoint |
| `src/tools/` | one file per tool family (state, control, breakpoints, evaluate, lifecycle, …) | adding/changing a tool |
| `.claude/agents/intellij-debugger-maintainer.md` | maintainer agent notes from the April release | background |
| `.github/workflows/ci.yml` | CI | CI red, or adding a check |
