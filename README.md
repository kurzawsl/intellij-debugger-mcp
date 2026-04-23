# intellij-debugger-mcp

[![CI](https://github.com/kurzawsl/intellij-debugger-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/kurzawsl/intellij-debugger-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server that lets Claude control IntelliJ IDEA's debugger — set breakpoints, inspect variables, and step through code via the companion **intellij-debug-bridge** IntelliJ plugin.

## Prerequisites

This server requires the companion **intellij-debug-bridge** IntelliJ plugin to be installed and running. The plugin exposes a local REST API on `localhost:19999` that this MCP server talks to.

> **Note:** The intellij-debug-bridge plugin is not yet publicly released. It is a companion IntelliJ plugin available at [https://github.com/kurzawsl/intellij-debug-bridge](https://github.com/kurzawsl/intellij-debug-bridge) (not yet publicly released — companion plugin required for this server to function).

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
| `debug_list_projects` | List IntelliJ projects available on disk |

### Debug State

| Tool | Description |
|------|-------------|
| `debug_get_state` | Get current debugger location and status |
| `debug_get_variables` | Get local variables at the current breakpoint |
| `debug_get_frames` | Get the full call stack frames |
| `debug_expand_variable` | Expand a complex variable to see its fields |
| `debug_get_configurations` | List available run configurations |
| `debug_get_modules` | List modules in the current project |
| `debug_get_problems` | Get current compilation errors or warnings |
| `debug_list_sessions` | List active debug sessions |

### Debug Control

| Tool | Description |
|------|-------------|
| `debug_start` | Start debugging (optionally specify a run config) |
| `debug_start_in_project` | Start debugging in a specific project |
| `debug_stop` | Stop the current debug session |
| `debug_stop_session` | Stop a specific named debug session |
| `debug_pause` | Pause execution |
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
| `debug_toggle_breakpoint` | Toggle a breakpoint on or off |
| `debug_remove_breakpoint` | Remove a specific breakpoint |
| `debug_clear_all_breakpoints` | Remove all breakpoints |

### Evaluation

| Tool | Description |
|------|-------------|
| `debug_evaluate` | Evaluate a Java expression in the current context |

### File Navigation

| Tool | Description |
|------|-------------|
| `debug_open_file` | Open a file in the IntelliJ editor |
| `debug_close_file` | Close an open editor tab |
| `debug_go_to_line` | Navigate to a specific line in a file |
| `debug_get_open_files` | List currently open editor tabs |

### Console

| Tool | Description |
|------|-------------|
| `debug_get_console` | Get debug console output |
| `debug_clear_console` | Clear the debug console |

### Run Configurations

| Tool | Description |
|------|-------------|
| `debug_create_application_config` | Create a Java Application run configuration |
| `debug_create_spring_boot_config` | Create a Spring Boot run configuration |
| `debug_create_junit_class_config` | Create a JUnit class-level test configuration |
| `debug_create_junit_method_config` | Create a JUnit method-level test configuration |
| `debug_delete_configuration` | Delete a run configuration |

### Example: set a breakpoint and inspect variables

Request:
```json
{
  "tool": "debug_set_breakpoint",
  "arguments": {
    "file": "src/main/java/com/example/UserService.java",
    "line": 42
  }
}
```

Response:
```json
{
  "success": true,
  "breakpoint": {
    "id": "bp_007",
    "file": "src/main/java/com/example/UserService.java",
    "line": 42,
    "enabled": true
  }
}
```

After hitting the breakpoint, inspect variables:
```json
{
  "tool": "debug_get_variables",
  "arguments": {}
}
```

Response:
```json
{
  "variables": [
    { "name": "this", "type": "UserService", "value": "UserService@4a7d4b" },
    { "name": "userId", "type": "Long", "value": "1023" },
    { "name": "request", "type": "CreateUserRequest", "value": "CreateUserRequest{email='alice@example.com', role='admin'}" }
  ]
}
```

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
