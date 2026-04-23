# intellij-debugger-mcp

MCP server that lets Claude control IntelliJ IDEA's debugger — set breakpoints, inspect variables, and step through code via the [intellij-debug-bridge](https://github.com/kurzawsl/intellij-debug-bridge) plugin.

## Prerequisites

This server requires the companion **intellij-debug-bridge** IntelliJ plugin to be installed and running. The plugin exposes a local REST API on `localhost:19999` that this MCP server talks to.

- Install the plugin: [kurzawsl/intellij-debug-bridge](https://github.com/kurzawsl/intellij-debug-bridge)
- IntelliJ IDEA (Community or Ultimate)
- An active Java project open in IntelliJ
- Node.js 20+

## Architecture

```
┌─────────────────┐     HTTP/REST      ┌─────────────────────┐
│  MCP Server     │◄──────────────────►│  intellij-debug-    │
│  (TypeScript)   │   localhost:19999  │  bridge plugin      │
└────────┬────────┘                    └──────────┬──────────┘
         │                                        │
         │ stdio / MCP protocol                   │ IntelliJ APIs
         │                                        │
┌────────▼────────┐                    ┌──────────▼──────────┐
│  Claude         │                    │  Your Java app      │
│  (AI assistant) │                    │  (in debug mode)    │
└─────────────────┘                    └─────────────────────┘
```

## Installation

```bash
git clone https://github.com/kurzawsl/intellij-debugger-mcp.git
cd intellij-debugger-mcp
npm install
npm run build
```

## Usage

Register the server in your Claude Code MCP config (`~/.claude.json`):

```json
{
  "mcpServers": {
    "intellij-debugger": {
      "command": "node",
      "args": ["/path/to/intellij-debugger-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

Optional environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `INTELLIJ_DEBUG_HOST` | `localhost` | Debug Bridge host |
| `INTELLIJ_DEBUG_PORT` | `19999` | Debug Bridge port |
| `DEBUG_TIMEOUT` | `5000` | Request timeout (ms) |

## Tools

### Health & Setup

| Tool | Description |
|------|-------------|
| `debug_health_check` | Check if Debug Bridge plugin is reachable |
| `debug_start_intellij` | Start IntelliJ IDEA with a project |
| `debug_kill_intellij` | Kill all IntelliJ processes |

### Debug State

| Tool | Description |
|------|-------------|
| `debug_get_state` | Get current debugger location and status |
| `debug_get_variables` | Get local variables at the current breakpoint |
| `debug_get_configurations` | List available run configurations |

### Debug Control

| Tool | Description |
|------|-------------|
| `debug_start` | Start debugging (optionally specify a run config) |
| `debug_stop` | Stop the current debug session |
| `debug_step_over` | Step over — next line (F8) |
| `debug_step_into` | Step into — enter method call (F7) |
| `debug_step_out` | Step out — exit current method (Shift+F8) |
| `debug_resume` | Resume execution to next breakpoint (F9) |
| `debug_run_to_cursor` | Run to a specific line |
| `debug_select_frame` | Select a stack frame |

### Breakpoints

| Tool | Description |
|------|-------------|
| `debug_list_breakpoints` | List all breakpoints |
| `debug_set_breakpoint` | Add a breakpoint (supports optional condition) |
| `debug_set_breakpoints_batch` | Add multiple breakpoints at once |
| `debug_remove_breakpoint` | Remove a specific breakpoint |
| `debug_clear_all_breakpoints` | Remove all breakpoints |

### Evaluation

| Tool | Description |
|------|-------------|
| `debug_evaluate` | Evaluate a Java expression in the current context |

## Development

```bash
# Build TypeScript
npm run build

# Watch mode (rebuild on change)
npm run dev

# Run tests
npm test
```

## License

MIT — see [LICENSE](./LICENSE).
