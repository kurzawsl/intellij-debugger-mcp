# IntelliJ Debugger MCP Server - Requirements

## Overview

MCP server that provides Claude with tools to interact with IntelliJ IDEA's debugger via the Debug Bridge plugin.

## Dependencies

### Required
- **Debug Bridge Plugin**: Must be installed in IntelliJ and running
- **Node.js**: 20+
- **MCP SDK**: @modelcontextprotocol/sdk

### Runtime
- IntelliJ IDEA with Debug Bridge plugin
- Active debug session (for most tools)

## MCP Tools Specification

### Tool: `debug_get_state`

**Description**: Get current debugger state including location, stack trace, and status.

**Parameters**: None

**Returns**:
```typescript
{
  status: "suspended" | "running" | "not_debugging" | "plugin_not_running",
  sessionName?: string,
  location?: {
    file: string,
    filePath: string,
    line: number,
    method: string,
    class: string,
    package: string
  },
  stackTrace?: Array<{
    index: number,
    method: string,
    file: string,
    line: number,
    class: string
  }>,
  threadName?: string,
  message?: string  // For error states
}
```

**Example Usage**:
```
Claude: "Let me check where we are in the code"
[Calls debug_get_state]
"We're at line 86 in TelegramBot.java, in the handleText() method"
```

---

### Tool: `debug_get_variables`

**Description**: Get local variables and 'this' object at current breakpoint.

**Parameters**:
```typescript
{
  frame?: number,  // Stack frame index, default 0
  depth?: number   // Object expansion depth, default 1
}
```

**Returns**:
```typescript
{
  frameIndex: number,
  locals: Array<{
    name: string,
    type: string,
    value: string | number | boolean | null,
    isObject: boolean,
    isSensitive: boolean  // masked if true
  }>,
  thisObject?: {
    type: string,
    fields: Array<{
      name: string,
      type: string,
      value: string | number | boolean | null,
      modifier: string
    }>
  }
}
```

**Example Usage**:
```
Claude: "Let me see what variables we have here"
[Calls debug_get_variables]
"Current variables:
- chatId: Long = 6774686668
- text: String = 'Hello world'
- response: String = null (this is our problem!)"
```

---

### Tool: `debug_step_over`

**Description**: Execute step over (F8) - go to next line in current method.

**Parameters**: None

**Returns**: Same as `debug_get_state` (new location after step)

**Example Usage**:
```
Claude: "Let me step to the next line"
[Calls debug_step_over]
"Now at line 87, after the chat() call. Let me check what response contains..."
```

---

### Tool: `debug_step_into`

**Description**: Execute step into (F7) - enter method call on current line.

**Parameters**: None

**Returns**: Same as `debug_get_state`

**Example Usage**:
```
Claude: "Let me go inside the chat() method to see what happens"
[Calls debug_step_into]
"Now inside LangChain4jChatService.chat() at line 74"
```

---

### Tool: `debug_step_out`

**Description**: Execute step out (Shift+F8) - run until current method returns.

**Parameters**: None

**Returns**: Same as `debug_get_state`

---

### Tool: `debug_resume`

**Description**: Resume execution (F9) - continue until next breakpoint or end.

**Parameters**: None

**Returns**: Same as `debug_get_state` (status will be "running" or "suspended" at next breakpoint)

**Example Usage**:
```
Claude: "Continue to the next breakpoint"
[Calls debug_resume]
"Execution resumed. Hit breakpoint at line 103 in chatService.chat()"
```

---

### Tool: `debug_evaluate`

**Description**: Evaluate an expression in the current debug context.

**Parameters**:
```typescript
{
  expression: string  // Java expression to evaluate
}
```

**Returns**:
```typescript
{
  success: boolean,
  result?: string,
  type?: string,
  error?: string
}
```

**Example Usage**:
```
Claude: "Let me check what chatId.toString() returns"
[Calls debug_evaluate with expression: "chatId.toString()"]
"Result: '6774686668' (String)"
```

---

### Tool: `debug_list_breakpoints`

**Description**: List all breakpoints in the project.

**Parameters**: None

**Returns**:
```typescript
{
  breakpoints: Array<{
    id: string,
    file: string,
    filePath: string,
    line: number,
    enabled: boolean,
    condition?: string
  }>
}
```

---

### Tool: `debug_set_breakpoint`

**Description**: Add a breakpoint at specified location.

**Parameters**:
```typescript
{
  file: string,      // Filename (e.g., "TelegramBot.java") or full path
  line: number,      // Line number
  condition?: string // Optional: break only when condition is true
}
```

**Returns**:
```typescript
{
  success: boolean,
  breakpoint?: {
    id: string,
    file: string,
    line: number,
    enabled: boolean
  },
  error?: string
}
```

**Example Usage**:
```
Claude: "I'll set a breakpoint at line 86 in TelegramBot.java"
[Calls debug_set_breakpoint]
"Breakpoint set successfully"
```

---

### Tool: `debug_set_breakpoints_batch`

**Description**: Add multiple breakpoints at once (efficient for setting up debug flow).

**Parameters**:
```typescript
{
  breakpoints: Array<{
    file: string,
    line: number,
    condition?: string
  }>
}
```

**Returns**:
```typescript
{
  success: boolean,
  added: number,
  failed: number,
  breakpoints: Array<{file, line, success, error?}>
}
```

**Example Usage**:
```
Claude: "Let me set up breakpoints to trace the flow:
1. TelegramBot.java:71 - message received
2. TelegramBot.java:86 - before chat call
3. LangChain4jChatService.java:74 - chat entry"
[Calls debug_set_breakpoints_batch]
"3 breakpoints set successfully"
```

---

### Tool: `debug_remove_breakpoint`

**Description**: Remove a specific breakpoint.

**Parameters**:
```typescript
{
  file: string,
  line: number
}
```

**Returns**:
```typescript
{
  success: boolean,
  removed: boolean,
  error?: string
}
```

---

### Tool: `debug_clear_all_breakpoints`

**Description**: Remove all breakpoints.

**Parameters**: None

**Returns**:
```typescript
{
  success: boolean,
  removed: number
}
```

---

## Error Handling

### Plugin Not Running
When Debug Bridge plugin is not accessible:
```typescript
{
  status: "plugin_not_running",
  message: "Cannot connect to Debug Bridge plugin. Make sure IntelliJ is running with the plugin installed.",
  suggestion: "Start IntelliJ IDEA and verify Debug Bridge plugin is enabled"
}
```

### No Debug Session
When no debug session is active:
```typescript
{
  status: "not_debugging",
  message: "No active debug session",
  suggestion: "Start debugging by clicking Debug (Shift+F9) in IntelliJ"
}
```

### Not Suspended
When debugger is running (not at breakpoint):
```typescript
{
  status: "running",
  message: "Debugger is running, not suspended at breakpoint",
  suggestion: "Wait for a breakpoint to be hit or add breakpoints"
}
```

## Configuration

### Environment Variables
```bash
INTELLIJ_DEBUG_HOST=localhost   # Debug Bridge host
INTELLIJ_DEBUG_PORT=19999       # Debug Bridge port
DEBUG_TIMEOUT=5000              # Request timeout (ms)
```

### Claude Desktop Config
```json
{
  "mcpServers": {
    "intellij-debugger": {
      "command": "node",
      "args": ["/Users/lukaszkurzawski2/workspace/mcp-servers/intellij-debugger/dist/index.js"],
      "env": {
        "INTELLIJ_DEBUG_PORT": "19999"
      }
    }
  }
}
```

## Implementation Phases

### Phase 1 - Core (Day 1)
- [ ] Project setup (package.json, tsconfig)
- [ ] MCP server boilerplate
- [ ] IntelliJ REST client
- [ ] `debug_get_state` tool
- [ ] `debug_get_variables` tool
- [ ] Basic error handling

### Phase 2 - Control (Day 1-2)
- [ ] `debug_step_over` tool
- [ ] `debug_step_into` tool
- [ ] `debug_step_out` tool
- [ ] `debug_resume` tool

### Phase 3 - Breakpoints (Day 2)
- [ ] `debug_list_breakpoints` tool
- [ ] `debug_set_breakpoint` tool
- [ ] `debug_set_breakpoints_batch` tool
- [ ] `debug_remove_breakpoint` tool
- [ ] `debug_clear_all_breakpoints` tool

### Phase 4 - Advanced (Day 3)
- [ ] `debug_evaluate` tool
- [ ] Improved error messages
- [ ] Retry logic for transient failures
- [ ] Documentation

## Testing

### Unit Tests
- Tool parameter validation
- Response formatting
- Error handling

### Integration Tests (with mock server)
- HTTP client functionality
- Tool registration
- MCP protocol compliance

### End-to-End Tests (with real IntelliJ)
- Full debug session flow
- Breakpoint management
- Variable inspection accuracy

## Success Metrics

1. All tools register correctly with MCP
2. `debug_get_state` returns accurate location
3. `debug_set_breakpoint` creates breakpoints in IntelliJ
4. `debug_step_over` advances debugger correctly
5. Claude can guide a complete debugging session

## Future Enhancements

1. **Watch Expressions**: Manage persistent watch expressions
2. **Conditional Breakpoints**: Full support for conditions
3. **Thread Control**: Select/control specific threads
4. **Memory View**: Heap inspection tools
5. **WebSocket Events**: Real-time debug events push
6. **Multi-Session**: Handle multiple debug sessions
7. **VSCode Support**: Extend to VSCode via DAP
