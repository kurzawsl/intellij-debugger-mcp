# IntelliJ Debugger MCP Server

MCP server that enables Claude to control and inspect IntelliJ IDEA's debugger via the Debug Bridge plugin.

## Architecture

```
┌─────────────────┐     HTTP/REST      ┌─────────────────────┐
│  MCP Server     │◄──────────────────►│  Debug Bridge       │
│  (TypeScript)   │     localhost:19999│  Plugin (Kotlin)    │
└────────┬────────┘                    └──────────┬──────────┘
         │                                        │
         │ stdio/MCP Protocol                     │ IntelliJ APIs
         │                                        │
┌────────▼────────┐                    ┌──────────▼──────────┐
│  Claude         │                    │  Your Java App      │
│  (AI Assistant) │                    │  (in debug mode)    │
└─────────────────┘                    └─────────────────────┘
```

## Prerequisites

1. IntelliJ IDEA with Debug Bridge plugin installed
2. A Java project open in IntelliJ
3. Debug Bridge plugin running on `localhost:19999`

## Installation

```bash
cd /Users/lukaszkurzawski2/workspace/mcp-servers/intellij-debugger
npm install
npm run build
```

## Configuration

Add to `~/.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "intellij-debugger": {
      "command": "node",
      "args": ["/Users/lukaszkurzawski2/workspace/mcp-servers/intellij-debugger/dist/index.js"]
    }
  }
}
```

## Available Tools (20 total)

### Health & Setup
| Tool | Description |
|------|-------------|
| `debug_health_check` | Check if Debug Bridge is accessible |
| `debug_start_intellij` | Start IntelliJ IDEA with a project |
| `debug_kill_intellij` | Kill all IntelliJ processes |

### Debug State
| Tool | Description |
|------|-------------|
| `debug_get_state` | Get current debugger location and status |
| `debug_get_variables` | Get local variables at breakpoint |
| `debug_get_configurations` | List available run configurations |

### Debug Control
| Tool | Description |
|------|-------------|
| `debug_start` | Start debugging with optional config name |
| `debug_stop` | Stop the current debug session |
| `debug_step_over` | Step over (F8) |
| `debug_step_into` | Step into (F7) |
| `debug_step_out` | Step out (Shift+F8) |
| `debug_resume` | Resume execution (F9) |
| `debug_run_to_cursor` | Run to a specific line |
| `debug_select_frame` | Select a stack frame |

### Breakpoints
| Tool | Description |
|------|-------------|
| `debug_list_breakpoints` | List all breakpoints |
| `debug_set_breakpoint` | Add a breakpoint |
| `debug_set_breakpoints_batch` | Add multiple breakpoints |
| `debug_remove_breakpoint` | Remove a breakpoint |
| `debug_clear_all_breakpoints` | Remove all breakpoints |

### Evaluation
| Tool | Description |
|------|-------------|
| `debug_evaluate` | Evaluate an expression in current context |

## Usage Examples

### Check Connection
```
debug_health_check
```

### Start Debugging
```
debug_start_intellij projectPath="/Users/user/project"
debug_set_breakpoint file="MyService.java" line=42
debug_start config="MyApplication"
```

### Inspect & Step
```
debug_get_state
debug_get_variables
debug_evaluate expression="myVar.toString()"
debug_step_over
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `INTELLIJ_DEBUG_HOST` | localhost | Debug Bridge host |
| `INTELLIJ_DEBUG_PORT` | 19999 | Debug Bridge port |
| `DEBUG_TIMEOUT` | 5000 | Request timeout (ms) |

## Testing

Tested with:
- Simple Java project (~/IdeaProjects/untitled)
- Complex Spring Boot project (loftyworks-accounting)

All 20 tools verified working.
