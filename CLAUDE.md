# IntelliJ Debugger MCP Server

## MISSION

This MCP server connects Claude to IntelliJ's debugger via the Debug Bridge Plugin, enabling AI-assisted debugging sessions.

**This is the CLIENT side. The IntelliJ plugin (intellij-debug-bridge) is the SERVER.**

## Architecture

```
┌─────────────┐          ┌─────────────────────┐
│   Claude    │          │  IntelliJ IDEA      │
│   Code      │          │  + Debug Bridge     │
└──────┬──────┘          │    Plugin           │
       │                 └──────────┬──────────┘
       │                            │
       ▼                            ▼
┌──────────────────┐     ┌──────────────────────┐
│  MCP Server      │────►│  REST API            │
│  intellij-debug  │◄────│  localhost:19999     │
└──────────────────┘     └──────────────────────┘
```

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **MCP SDK**: @modelcontextprotocol/sdk
- **HTTP Client**: fetch (built-in) or axios

## MCP Tools to Implement

### Debugger State

#### `debug_get_state`
Get current debugger state (location, stack trace).

```typescript
// Returns
{
  status: "suspended" | "running" | "not_debugging",
  location: {
    file: string,
    line: number,
    method: string,
    class: string
  },
  stackTrace: Array<{method, file, line}>
}
```

**Use case**: "Where is the debugger now?"

#### `debug_get_variables`
Get variables at current breakpoint.

```typescript
// Parameters
{ frame?: number, depth?: number }

// Returns
{
  locals: Array<{name, type, value}>,
  this: { type, fields: Array<{name, type, value}> }
}
```

**Use case**: "What are the variable values here?"

### Debugger Control

#### `debug_step_over`
Execute step over (F8).

**Use case**: "Step to next line"

#### `debug_step_into`
Execute step into (F7).

**Use case**: "Go inside this method"

#### `debug_step_out`
Execute step out (Shift+F8).

**Use case**: "Exit this method"

#### `debug_resume`
Resume execution (F9).

**Use case**: "Continue to next breakpoint"

### Breakpoint Management

#### `debug_list_breakpoints`
List all breakpoints.

```typescript
// Returns
{
  breakpoints: Array<{file, line, enabled}>
}
```

#### `debug_set_breakpoint`
Add a breakpoint.

```typescript
// Parameters
{ file: string, line: number, condition?: string }
```

**Use case**: "Set breakpoint at TelegramBot.java line 86"

#### `debug_set_breakpoints_batch`
Add multiple breakpoints at once.

```typescript
// Parameters
{
  breakpoints: Array<{file: string, line: number}>
}
```

**Use case**: "Set breakpoints for debugging this flow"

#### `debug_remove_breakpoint`
Remove a breakpoint.

```typescript
// Parameters
{ file: string, line: number }
```

#### `debug_clear_all_breakpoints`
Remove all breakpoints.

### Expression Evaluation

#### `debug_evaluate`
Evaluate expression in current context.

```typescript
// Parameters
{ expression: string }

// Returns
{ result: string, type: string }
```

**Use case**: "What is user.getName()?"

## Configuration

Environment variables:
```bash
INTELLIJ_DEBUG_HOST=localhost  # Default
INTELLIJ_DEBUG_PORT=19999      # Default
```

## Project Structure

```
intellij-debugger/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── intellij-client.ts    # REST client for Debug Bridge
│   ├── tools/
│   │   ├── state.ts          # debug_get_state, debug_get_variables
│   │   ├── control.ts        # step_over, step_into, resume
│   │   ├── breakpoints.ts    # list, set, remove breakpoints
│   │   └── evaluate.ts       # debug_evaluate
│   └── types.ts              # TypeScript interfaces
├── CLAUDE.md
└── README.md
```

## Implementation Notes

### Error Handling

The IntelliJ plugin might not be running or debugger not active. Handle these cases:

```typescript
async function getDebugState() {
  try {
    const response = await fetch(`${PLUGIN_URL}/debug/state`);
    if (response.status === 404) {
      return { status: "not_debugging", message: "No active debug session" };
    }
    return await response.json();
  } catch (error) {
    return { status: "error", message: "Debug Bridge plugin not running" };
  }
}
```

### Polling vs Events

The plugin exposes REST (request/response). For now, Claude will poll when needed:

1. User says "step over"
2. Claude calls debug_step_over
3. Claude immediately calls debug_get_state to see new position
4. Claude reports to user

Future: WebSocket support for real-time events.

### Variable Presentation

Format variables nicely for Claude to understand:

```typescript
function formatVariables(vars: Variable[]): string {
  return vars.map(v => `${v.name}: ${v.type} = ${v.value}`).join('\n');
}

// Example output:
// chatId: Long = 6774686668
// text: String = "Hello world"
// response: String = null
```

## MCP Server Setup

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "intellij-debugger",
  version: "1.0.0"
});

// Register tools
server.tool("debug_get_state", "Get current debugger state", {}, async () => {
  // Implementation
});

server.tool("debug_set_breakpoint", "Set a breakpoint", {
  file: { type: "string", description: "Java file name" },
  line: { type: "number", description: "Line number" }
}, async ({ file, line }) => {
  // Implementation
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Testing

### Without Plugin (Mock Mode)

For development without the IntelliJ plugin:

```typescript
const MOCK_MODE = process.env.MOCK_DEBUG === 'true';

if (MOCK_MODE) {
  return {
    status: "suspended",
    location: { file: "Test.java", line: 10, method: "test" },
    // ...mock data
  };
}
```

### With Plugin

1. Start IntelliJ with Debug Bridge plugin
2. Open a Java project
3. Start debugging (set breakpoint, run in debug)
4. Test MCP tools via Claude Code

## Claude Code Configuration

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "intellij-debugger": {
      "command": "node",
      "args": ["/path/to/intellij-debugger/dist/index.js"],
      "env": {
        "INTELLIJ_DEBUG_PORT": "19999"
      }
    }
  }
}
```

## Example Claude Interactions

### Guided Debugging
```
User: "Help me debug why handleText returns null"

Claude: "I'll set breakpoints at key locations in the flow."
[Calls debug_set_breakpoints_batch for relevant lines]

Claude: "Breakpoints set. Start debugging and send a Telegram message."

[User starts debug, sends message, hits breakpoint]

Claude: [Calls debug_get_state]
"We hit line 86 in TelegramBot.java, in handleText(). Let me check the variables."

Claude: [Calls debug_get_variables]
"I see:
- chatId = 6774686668 ✓
- text = 'Hello' ✓
- response is not set yet

Let me step into chatService.chat()..."

Claude: [Calls debug_step_into]
...
```

### Teaching Debugging
```
User: "Teach me how this flow works"

Claude: "I'll set breakpoints at entry points and guide you through.
Let me set up:
1. TelegramBot.onUpdateReceived - where messages arrive
2. TelegramBot.handleText - text processing
3. LangChain4jChatService.chat - AI processing

Start debugging and send 'Hello' to Telegram."

[User runs through, Claude explains each stop]
```

## Success Criteria

1. MCP server starts and registers tools
2. debug_get_state returns correct data from plugin
3. debug_set_breakpoint successfully adds breakpoints
4. debug_step_over advances debugger
5. Integration with Claude Code works smoothly

## The Big Picture

This MCP + Plugin combo enables:
- **AI-guided debugging** - Claude sets breakpoints, you learn
- **Interactive teaching** - "Let me show you the flow"
- **Pair debugging** - Claude sees what you see
- **Faster bug hunting** - AI analyzes variables at each stop

**This will revolutionize how developers learn and debug code!**
