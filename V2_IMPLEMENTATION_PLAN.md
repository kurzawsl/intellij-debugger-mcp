# V2 Multi-Project Support Implementation Plan

## Architecture Decision Summary

Based on Gemini's architectural analysis, we'll follow these principles:

1. **Explicit is Better than Implicit** - Always prefer explicit `sessionId`/`projectId` targeting
2. **Evolve, Don't Fork** - Add optional parameters to existing tools, don't create `_v2` variants
3. **Make Errors Actionable** - Include `availableSessions[]` in errors to guide recovery

## Code Quality Issues to Address

### 1. God Class Problem (`index.ts`)

Current `index.ts` is 1174 lines with ~35 tool definitions inline. This violates:
- Single Responsibility Principle
- Maintainability (hard to navigate)
- Testability (can't unit test individual tools)

**Solution:** Split into domain-based modules:

```
src/
├── index.ts              # Entry point only (~30 lines)
├── server.ts             # McpServer setup & tool registration (~50 lines)
├── intellij-client.ts    # REST client (existing, will extend)
├── types.ts              # Types (existing, will extend)
├── errors.ts             # Custom error classes (NEW)
├── utils/
│   └── resolver.ts       # Session/project resolution logic (NEW)
├── tools/
│   ├── index.ts          # Export all tools
│   ├── discovery.ts      # list_projects, list_sessions
│   ├── state.ts          # get_state, get_variables, get_frames
│   ├── control.ts        # step_over, step_into, step_out, resume, pause
│   ├── breakpoints.ts    # list, set, remove, clear breakpoints
│   ├── evaluate.ts       # evaluate, expand_variable
│   ├── console.ts        # get_console, clear_console
│   ├── files.ts          # open_file, close_file, go_to_line
│   ├── configurations.ts # get/create/delete configurations
│   └── lifecycle.ts      # start, stop, health_check, kill_intellij
└── formatters/
    └── response.ts       # Response formatting utilities
```

### 2. Deprecated `server.tool()` API

Current code uses deprecated `server.tool()`:
```typescript
// DEPRECATED
server.tool('debug_step_over', 'Execute step over', {}, async () => {...});
```

**Solution:** Use `server.registerTool()`:
```typescript
// NEW API
server.registerTool('debug_step_over', {
  description: 'Execute step over (F8)',
  inputSchema: {
    sessionId: z.string().optional().describe('Session ID (auto-selected if only one)'),
  },
}, async (args, extra) => {...});
```

## Implementation Phases

### Phase 0: Refactoring (Pre-V2 Foundation)

**Goal:** Break the god class before adding V2 features.

#### 0.1 Create Tool Interface Pattern

Create a standardized interface for tool definitions:

```typescript
// src/tools/types.ts
import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { IntelliJDebugClient } from '../intellij-client.js';

export interface ToolContext {
  client: IntelliJDebugClient;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema?: z.ZodObject<any>;
  handler: (args: any, ctx: ToolContext) => Promise<CallToolResult>;
}
```

#### 0.2 Extract Tool Modules

**File: `src/tools/control.ts`**
```typescript
import { z } from 'zod';
import type { ToolDefinition, ToolContext } from './types.js';

export const stepOverTool: ToolDefinition = {
  name: 'debug_step_over',
  description: 'Execute step over (F8) - go to next line without entering functions.',
  inputSchema: z.object({
    sessionId: z.string().optional().describe('Session ID (auto-selected if only one)'),
  }),
  async handler({ sessionId }, ctx) {
    const resolvedSessionId = await ctx.resolveSessionId(sessionId);
    const result = await ctx.client.stepOverSession(resolvedSessionId);

    return {
      content: [{
        type: 'text',
        text: formatStepResult(result),
      }],
    };
  },
};

export const stepIntoTool: ToolDefinition = { /* ... */ };
export const stepOutTool: ToolDefinition = { /* ... */ };
export const resumeTool: ToolDefinition = { /* ... */ };
export const pauseTool: ToolDefinition = { /* ... */ };

export const controlTools = [
  stepOverTool,
  stepIntoTool,
  stepOutTool,
  resumeTool,
  pauseTool,
];
```

**File: `src/tools/discovery.ts`**
```typescript
export const listProjectsTool: ToolDefinition = {
  name: 'debug_list_projects',
  description: 'List all open IntelliJ projects with IDs for targeting.',
  async handler(_, ctx) {
    const response = await ctx.client.getProjects();
    return formatProjectsList(response);
  },
};

export const listSessionsTool: ToolDefinition = {
  name: 'debug_list_sessions',
  description: 'List all active debug sessions with IDs for targeting.',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Filter by project ID'),
  }),
  async handler({ projectId }, ctx) {
    const response = await ctx.client.getSessions(projectId);
    return formatSessionsList(response);
  },
};

export const discoveryTools = [listProjectsTool, listSessionsTool];
```

#### 0.3 Create Tool Registry

**File: `src/tools/index.ts`**
```typescript
import { controlTools } from './control.js';
import { discoveryTools } from './discovery.js';
import { stateTools } from './state.js';
import { breakpointTools } from './breakpoints.js';
import { evaluateTools } from './evaluate.js';
import { consoleTools } from './console.js';
import { fileTools } from './files.js';
import { configurationTools } from './configurations.js';
import { lifecycleTools } from './lifecycle.js';
import type { ToolDefinition } from './types.js';

export const allTools: ToolDefinition[] = [
  ...discoveryTools,      // list_projects, list_sessions
  ...stateTools,          // get_state, get_variables, get_frames
  ...controlTools,        // step_over, step_into, step_out, resume, pause
  ...breakpointTools,     // list, set, set_batch, remove, clear, toggle
  ...evaluateTools,       // evaluate, expand_variable
  ...consoleTools,        // get_console, clear_console
  ...fileTools,           // open_file, close_file, get_open_files, go_to_line
  ...configurationTools,  // get, create_junit, create_app, create_spring, delete
  ...lifecycleTools,      // start, stop, health_check, start_intellij, kill_intellij
];
```

#### 0.4 Slim Down Entry Point

**File: `src/index.ts`** (NEW - only ~40 lines)
```typescript
#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { IntelliJDebugClient } from './intellij-client.js';
import { allTools } from './tools/index.js';
import { createToolContext } from './tools/types.js';

const server = new McpServer({
  name: 'intellij-debugger',
  version: '2.0.0',
});

const client = new IntelliJDebugClient();
const ctx = createToolContext(client);

// Register all tools using new API
for (const tool of allTools) {
  server.registerTool(tool.name, {
    description: tool.description,
    inputSchema: tool.inputSchema,
  }, async (args, extra) => {
    return tool.handler(args, ctx);
  });
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('IntelliJ Debugger MCP Server v2.0 started');
}

main().catch(console.error);
```

#### 0.5 Refactoring Checklist

- [ ] Create `src/tools/types.ts` with interfaces
- [ ] Create `src/errors.ts` with custom errors
- [ ] Create `src/utils/resolver.ts` for session/project resolution
- [ ] Create `src/formatters/response.ts` for output formatting
- [ ] Extract `src/tools/lifecycle.ts` (health_check, start_intellij, kill_intellij)
- [ ] Extract `src/tools/state.ts` (get_state, get_variables, get_frames)
- [ ] Extract `src/tools/control.ts` (step_over, step_into, step_out, resume, pause)
- [ ] Extract `src/tools/breakpoints.ts` (all breakpoint tools)
- [ ] Extract `src/tools/evaluate.ts` (evaluate, expand_variable, select_frame)
- [ ] Extract `src/tools/console.ts` (get_console, clear_console)
- [ ] Extract `src/tools/files.ts` (open_file, close_file, get_open_files, go_to_line)
- [ ] Extract `src/tools/configurations.ts` (all configuration tools)
- [ ] Create `src/tools/index.ts` to export all tools
- [ ] Rewrite `src/index.ts` as slim entry point
- [ ] Update all tools to use `registerTool` instead of `tool`
- [ ] Verify build passes
- [ ] Test all tools still work

### Phase 1: Types & Client Updates (Foundation)

**Estimated scope:** `types.ts`, `intellij-client.ts`

#### 1.1 Update `types.ts`

Add new V2 types:

```typescript
// === V2 Types ===

export type DebugStatus = 'RUNNING' | 'SUSPENDED' | 'TERMINATED' | 'NO_SESSION';

export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  isDefault?: boolean;
  sessionCount?: number;
}

export interface ProjectsResponse {
  projects: ProjectInfo[];
}

export interface SessionInfo {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  status: DebugStatus;
  location?: DebugLocation;
}

export interface SessionsResponse {
  sessions: SessionInfo[];
}

export interface SessionDetailResponse extends SessionInfo {
  stackTrace?: StackFrame[];
}

export interface SessionActionResponse {
  success: boolean;
  message: string;
  sessionId: string;
  session?: SessionDetailResponse;
}

export interface StartDebugResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  projectId: string;
}

export interface ProjectConfigurationsResponse {
  configurations: Array<{
    name: string;
    type: string;
  }>;
}

export interface V2Error {
  error: string;
  message: string;
  availableSessions?: SessionInfo[];
  availableProjects?: ProjectInfo[];
}

// Context for V2 responses
export interface ResponseContext {
  sessionId?: string;
  projectId?: string;
}
```

#### 1.2 Update `intellij-client.ts`

Add V2 API methods:

```typescript
// === Discovery ===
async getProjects(): Promise<ProjectsResponse>
async getSessions(projectId?: string): Promise<SessionsResponse>

// === Session-Scoped ===
async getSessionDetails(sessionId: string): Promise<SessionDetailResponse>
async getVariablesForSession(sessionId: string): Promise<VariablesResponse>
async stepOverSession(sessionId: string): Promise<SessionActionResponse>
async stepIntoSession(sessionId: string): Promise<SessionActionResponse>
async stepOutSession(sessionId: string): Promise<SessionActionResponse>
async resumeSession(sessionId: string): Promise<SessionActionResponse>
async pauseSession(sessionId: string): Promise<SessionActionResponse>
async stopSession(sessionId: string): Promise<SessionActionResponse>
async evaluateInSession(sessionId: string, expression: string): Promise<EvaluateResponse>

// === Project-Scoped ===
async getProjectDetails(projectId: string): Promise<ProjectInfo>
async getProjectSessions(projectId: string): Promise<SessionsResponse>
async getProjectConfigurations(projectId: string): Promise<ProjectConfigurationsResponse>
async getProjectBreakpoints(projectId: string): Promise<BreakpointsResponse>
async addBreakpointToProject(projectId: string, file: string, line: number, condition?: string): Promise<ApiResponse>
async removeBreakpointFromProject(projectId: string, file: string, line: number): Promise<ApiResponse>
async startDebugInProject(projectId: string, config?: string): Promise<StartDebugResponse>
```

### Phase 2: Discovery Tools (NEW)

Add two new essential discovery tools:

#### 2.1 `debug_list_projects`

```typescript
server.tool(
  'debug_list_projects',
  'List all open IntelliJ projects. Returns projectId for targeting project-scoped operations.',
  {},
  async () => {
    const response = await client.getProjects();
    // Format as table with id, name, path, sessionCount
  }
);
```

#### 2.2 `debug_list_sessions`

```typescript
server.tool(
  'debug_list_sessions',
  'List all active debug sessions. Returns sessionId for targeting session-scoped operations.',
  {
    projectId: z.string().optional().describe('Filter by project ID'),
  },
  async ({ projectId }) => {
    const response = await client.getSessions(projectId);
    // Format as table with id, name, projectName, status, location
  }
);
```

### Phase 3: Evolve Control Tools (Add sessionId Parameter)

Modify existing tools to accept optional `sessionId`:

| Tool | New Parameter |
|------|---------------|
| `debug_get_state` | `sessionId?: string` |
| `debug_get_variables` | `sessionId?: string` |
| `debug_step_over` | `sessionId?: string` |
| `debug_step_into` | `sessionId?: string` |
| `debug_step_out` | `sessionId?: string` |
| `debug_resume` | `sessionId?: string` |
| `debug_pause` | `sessionId?: string` |
| `debug_evaluate` | `sessionId?: string` |
| `debug_get_frames` | `sessionId?: string` |
| `debug_expand_variable` | `sessionId?: string` |
| `debug_select_frame` | `sessionId?: string` |

**Smart Default Logic:**

```typescript
async function resolveSessionId(providedSessionId?: string): Promise<string> {
  if (providedSessionId) {
    return providedSessionId;
  }

  const sessions = await client.getSessions();
  const activeSessions = sessions.sessions.filter(s => s.status !== 'TERMINATED');

  if (activeSessions.length === 0) {
    throw new AmbiguousSessionError('No active debug sessions', []);
  }

  if (activeSessions.length === 1) {
    return activeSessions[0].id;  // Auto-select single session
  }

  throw new AmbiguousSessionError(
    'Multiple debug sessions active. Specify sessionId.',
    activeSessions
  );
}
```

### Phase 4: Evolve Breakpoint Tools (Add projectId Parameter)

| Tool | New Parameter |
|------|---------------|
| `debug_list_breakpoints` | `projectId?: string` |
| `debug_set_breakpoint` | `projectId?: string` |
| `debug_set_breakpoints_batch` | `projectId?: string` |
| `debug_remove_breakpoint` | `projectId?: string` |
| `debug_clear_all_breakpoints` | `projectId?: string` |

**Smart Default Logic (similar pattern):**

```typescript
async function resolveProjectId(providedProjectId?: string): Promise<string> {
  if (providedProjectId) {
    return providedProjectId;
  }

  const projects = await client.getProjects();

  if (projects.projects.length === 0) {
    throw new Error('No IntelliJ projects open');
  }

  if (projects.projects.length === 1) {
    return projects.projects[0].id;
  }

  throw new AmbiguousProjectError(
    'Multiple projects open. Specify projectId.',
    projects.projects
  );
}
```

### Phase 5: New Project-Scoped Tools

Add new tools for project-level operations:

#### 5.1 `debug_start_in_project`

```typescript
server.tool(
  'debug_start_in_project',
  'Start debugging a specific run configuration in a project.',
  {
    projectId: z.string().optional().describe('Project ID (auto-selected if only one)'),
    config: z.string().optional().describe('Run configuration name'),
  },
  async ({ projectId, config }) => {
    const resolvedProjectId = await resolveProjectId(projectId);
    const result = await client.startDebugInProject(resolvedProjectId, config);
    // Return new sessionId
  }
);
```

#### 5.2 `debug_stop_session`

```typescript
server.tool(
  'debug_stop_session',
  'Stop a specific debug session.',
  {
    sessionId: z.string().describe('Session ID to stop'),
  },
  async ({ sessionId }) => {
    const result = await client.stopSession(sessionId);
    // Confirm termination
  }
);
```

#### 5.3 `debug_get_project_configurations`

```typescript
server.tool(
  'debug_get_project_configurations',
  'List run configurations for a project.',
  {
    projectId: z.string().optional().describe('Project ID'),
  },
  async ({ projectId }) => {
    const resolvedProjectId = await resolveProjectId(projectId);
    const result = await client.getProjectConfigurations(resolvedProjectId);
    // List configurations
  }
);
```

### Phase 6: Response Format Enhancement

Add context to all V2 tool responses:

```typescript
function formatV2Response(
  content: string,
  context: ResponseContext
): { content: Array<{ type: string; text: string }> } {
  let header = '';
  if (context.sessionId) {
    header += `[Session: ${context.sessionId}] `;
  }
  if (context.projectId) {
    header += `[Project: ${context.projectId}] `;
  }

  return {
    content: [{
      type: 'text',
      text: header ? `${header}\n\n${content}` : content,
    }],
  };
}
```

### Phase 7: Error Handling Enhancement

Create custom error class:

```typescript
class AmbiguousSessionError extends Error {
  availableSessions: SessionInfo[];

  constructor(message: string, sessions: SessionInfo[]) {
    super(message);
    this.name = 'AmbiguousSessionError';
    this.availableSessions = sessions;
  }
}

class AmbiguousProjectError extends Error {
  availableProjects: ProjectInfo[];

  constructor(message: string, projects: ProjectInfo[]) {
    super(message);
    this.name = 'AmbiguousProjectError';
    this.availableProjects = projects;
  }
}

// In tool handlers:
try {
  // ...
} catch (error) {
  if (error instanceof AmbiguousSessionError) {
    const sessionList = error.availableSessions
      .map(s => `  - ${s.id}: ${s.name} (${s.status})`)
      .join('\n');
    return {
      content: [{
        type: 'text',
        text: `**Multiple sessions active.** Please specify sessionId:\n\n${sessionList}`
      }],
      isError: true,
    };
  }
  // ... handle other errors
}
```

---

## File Changes Summary

### New File Structure

| File | Purpose | Lines |
|------|---------|-------|
| `src/index.ts` | Slim entry point | ~40 |
| `src/types.ts` | All types (V1 + V2) | ~150 |
| `src/errors.ts` | Custom error classes | ~40 |
| `src/intellij-client.ts` | REST client (V1 + V2 methods) | ~350 |
| `src/utils/resolver.ts` | Session/project resolution | ~60 |
| `src/formatters/response.ts` | Output formatting | ~80 |
| `src/tools/types.ts` | Tool interface definitions | ~30 |
| `src/tools/index.ts` | Tool registry | ~30 |
| `src/tools/discovery.ts` | list_projects, list_sessions | ~60 |
| `src/tools/state.ts` | get_state, get_variables, get_frames | ~100 |
| `src/tools/control.ts` | step_over, step_into, step_out, resume, pause | ~120 |
| `src/tools/breakpoints.ts` | All breakpoint tools | ~150 |
| `src/tools/evaluate.ts` | evaluate, expand_variable, select_frame | ~80 |
| `src/tools/console.ts` | get_console, clear_console | ~70 |
| `src/tools/files.ts` | open_file, close_file, get_open_files | ~80 |
| `src/tools/configurations.ts` | Configuration management tools | ~150 |
| `src/tools/lifecycle.ts` | start, stop, health_check, start_intellij | ~100 |

**Total:** ~1670 lines across 17 files (vs current 1440 lines in 3 files)

### Key Benefits
- Each file is <200 lines (easy to understand)
- Tools are grouped by domain (easy to find)
- Tool handlers are unit-testable
- New tools can be added without touching unrelated code
- `registerTool` API used throughout

---

## Testing Plan

### Unit Tests

#### 1. Client Tests (`intellij-client.test.ts`)

```typescript
describe('IntelliJDebugClient V2', () => {
  describe('Discovery', () => {
    it('should fetch all projects', async () => {
      // Mock GET /v2/projects
      // Verify response parsing
    });

    it('should fetch all sessions', async () => {
      // Mock GET /v2/sessions
    });

    it('should filter sessions by projectId', async () => {
      // Mock GET /v2/projects/{projectId}/sessions
    });
  });

  describe('Session Operations', () => {
    it('should step over in specific session', async () => {
      // Mock POST /v2/sessions/{sessionId}/step-over
    });

    it('should get variables for specific session', async () => {
      // Mock GET /v2/sessions/{sessionId}/variables
    });

    // ... more tests
  });

  describe('Project Operations', () => {
    it('should start debug in project', async () => {
      // Mock POST /v2/projects/{projectId}/debug/start
    });

    it('should add breakpoint to project', async () => {
      // Mock POST /v2/projects/{projectId}/breakpoints
    });
  });
});
```

#### 2. Resolution Logic Tests

```typescript
describe('Session Resolution', () => {
  it('should return provided sessionId', async () => {
    const result = await resolveSessionId('session-123');
    expect(result).toBe('session-123');
  });

  it('should auto-select single session', async () => {
    mockClient.getSessions.mockResolvedValue({
      sessions: [{ id: 'session-only', status: 'SUSPENDED' }]
    });
    const result = await resolveSessionId(undefined);
    expect(result).toBe('session-only');
  });

  it('should throw AmbiguousSessionError for multiple sessions', async () => {
    mockClient.getSessions.mockResolvedValue({
      sessions: [
        { id: 'session-1', status: 'SUSPENDED' },
        { id: 'session-2', status: 'RUNNING' }
      ]
    });
    await expect(resolveSessionId(undefined))
      .rejects.toThrow(AmbiguousSessionError);
  });

  it('should throw for no sessions', async () => {
    mockClient.getSessions.mockResolvedValue({ sessions: [] });
    await expect(resolveSessionId(undefined))
      .rejects.toThrow('No active debug sessions');
  });
});
```

### Integration Tests

#### 1. Against Live IntelliJ (Manual)

Use the provided Postman collection:

```bash
# Test sequence:
1. curl http://localhost:19999/v2/projects
2. curl http://localhost:19999/v2/sessions
3. curl http://localhost:19999/v2/sessions/{sessionId}
4. curl -X POST http://localhost:19999/v2/sessions/{sessionId}/step-over
5. curl -X POST "http://localhost:19999/v2/projects/{projectId}/debug/start?config=MyApp"
```

#### 2. MCP Tool Tests

Test via Claude Code:

```
# Single session scenario
1. Start one debug session
2. Call debug_step_over() without sessionId
3. Verify it works (auto-selects)

# Multi-session scenario
1. Start two debug sessions
2. Call debug_step_over() without sessionId
3. Verify error with session list
4. Call debug_step_over(sessionId='session-1')
5. Verify it works

# Discovery scenario
1. Open two projects
2. Call debug_list_projects()
3. Verify both listed with IDs
4. Call debug_list_sessions()
5. Verify sessions show project context
```

### Test Matrix

| Scenario | V1 Behavior | V2 Expected |
|----------|-------------|-------------|
| 1 project, 1 session, no IDs | Works | Works (auto-select) |
| 1 project, 2 sessions, no IDs | Undefined | Error + session list |
| 2 projects, 1 session each, no IDs | Undefined | Error + session list |
| Any, explicit sessionId | N/A | Works |
| Any, explicit projectId | N/A | Works |
| Invalid sessionId | N/A | Error: SESSION_NOT_FOUND |
| Invalid projectId | N/A | Error: PROJECT_NOT_FOUND |

---

## Migration Checklist

### Pre-Implementation
- [ ] Backup current implementation
- [ ] Create feature branch `feature/v2-multi-project`
- [ ] Verify IntelliJ plugin V2 endpoints work via curl

### Phase 0: Refactoring (Break the God Class)
- [ ] Create `src/tools/types.ts` with ToolDefinition interface
- [ ] Create `src/errors.ts` with AmbiguousSessionError, AmbiguousProjectError
- [ ] Create `src/utils/resolver.ts` with resolveSessionId, resolveProjectId
- [ ] Create `src/formatters/response.ts` with formatV2Response
- [ ] Extract `src/tools/lifecycle.ts` (3 tools)
- [ ] Extract `src/tools/state.ts` (3 tools)
- [ ] Extract `src/tools/control.ts` (5 tools)
- [ ] Extract `src/tools/breakpoints.ts` (6 tools)
- [ ] Extract `src/tools/evaluate.ts` (3 tools)
- [ ] Extract `src/tools/console.ts` (2 tools)
- [ ] Extract `src/tools/files.ts` (4 tools)
- [ ] Extract `src/tools/configurations.ts` (7 tools)
- [ ] Create `src/tools/index.ts` registry
- [ ] Rewrite `src/index.ts` as slim entry point
- [ ] **CHECKPOINT:** `npm run build` passes
- [ ] **CHECKPOINT:** All tools work with Claude Code

### Phase 1: Types
- [ ] Add V2 types to `types.ts` (ProjectInfo, SessionInfo, etc.)
- [ ] Add custom error types to `errors.ts`

### Phase 2: Client
- [ ] Add `getProjects()` method
- [ ] Add `getSessions(projectId?)` method
- [ ] Add `getSessionDetails(sessionId)` method
- [ ] Add `stepOverSession(sessionId)` method
- [ ] Add `stepIntoSession(sessionId)` method
- [ ] Add `stepOutSession(sessionId)` method
- [ ] Add `resumeSession(sessionId)` method
- [ ] Add `pauseSession(sessionId)` method
- [ ] Add `stopSession(sessionId)` method
- [ ] Add `evaluateInSession(sessionId, expr)` method
- [ ] Add `getVariablesForSession(sessionId)` method
- [ ] Add `getProjectConfigurations(projectId)` method
- [ ] Add `startDebugInProject(projectId, config?)` method
- [ ] Add `getProjectBreakpoints(projectId)` method
- [ ] Add `addBreakpointToProject(projectId, ...)` method
- [ ] **CHECKPOINT:** All client methods work via manual curl tests

### Phase 3: Tools - Discovery (NEW)
- [ ] Add `debug_list_projects` tool
- [ ] Add `debug_list_sessions` tool

### Phase 4: Tools - Add sessionId Parameter
- [ ] Update `debug_get_state` with optional sessionId
- [ ] Update `debug_get_variables` with optional sessionId
- [ ] Update `debug_step_over` with optional sessionId
- [ ] Update `debug_step_into` with optional sessionId
- [ ] Update `debug_step_out` with optional sessionId
- [ ] Update `debug_resume` with optional sessionId
- [ ] Update `debug_pause` with optional sessionId
- [ ] Update `debug_evaluate` with optional sessionId
- [ ] Update `debug_get_frames` with optional sessionId
- [ ] Update `debug_expand_variable` with optional sessionId
- [ ] Update `debug_select_frame` with optional sessionId

### Phase 5: Tools - Add projectId Parameter
- [ ] Update `debug_list_breakpoints` with optional projectId
- [ ] Update `debug_set_breakpoint` with optional projectId
- [ ] Update `debug_set_breakpoints_batch` with optional projectId
- [ ] Update `debug_remove_breakpoint` with optional projectId
- [ ] Update `debug_clear_all_breakpoints` with optional projectId

### Phase 6: New Tools
- [ ] Add `debug_stop_session` tool
- [ ] Add `debug_start_in_project` tool
- [ ] Add `debug_get_project_configurations` tool

### Phase 7: Testing
- [ ] Write unit tests for resolver.ts
- [ ] Write unit tests for client V2 methods
- [ ] Manual integration test with Postman collection
- [ ] Test single-session scenario (backward compatible)
- [ ] Test multi-session error scenario
- [ ] Test explicit sessionId targeting
- [ ] Test multi-project scenario
- [ ] Full test with Claude Code

### Post-Implementation
- [ ] Update README.md
- [ ] Update CLAUDE.md with V2 tool docs
- [ ] Bump version to 2.0.0
- [ ] Tag release v2.0.0

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Plugin V2 API not ready | Test endpoints first; keep V1 fallback |
| Breaking existing workflows | Auto-select single session maintains V1 UX |
| Tool proliferation | Use optional params instead of new tools |
| Complex error states | Rich error messages with recovery hints |

---

## Success Criteria

1. **Backward Compatible**: Single-session users notice no change
2. **Multi-Project Ready**: Can debug 2+ projects simultaneously
3. **Clear Errors**: Ambiguous situations provide actionable guidance
4. **Discoverable**: `debug_list_*` tools make state visible
5. **Explicit Control**: sessionId/projectId targeting works perfectly
