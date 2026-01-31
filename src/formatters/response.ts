/**
 * Response formatting utilities
 */

import type {
  DebugState,
  DebugLocation,
  StackFrame,
  VariablesResponse,
  BreakpointsResponse,
  SessionInfo,
  ProjectInfo,
  SessionDetailResponse,
  SessionActionResponse,
} from '../types.js';

/**
 * Format debug state for display
 */
export function formatDebugState(state: DebugState, sessionId?: string): string {
  let content = '';

  if (sessionId) {
    content += `[Session: ${sessionId}]\n\n`;
  }

  content += `**Debug Status**: ${state.status}\n`;

  if (state.sessionName) {
    content += `**Session**: ${state.sessionName}\n`;
  }

  if (state.location) {
    content += formatLocation(state.location);
  }

  if (state.stackTrace && state.stackTrace.length > 0) {
    content += formatStackTrace(state.stackTrace);
  }

  return content;
}

/**
 * Format location for display
 */
export function formatLocation(location: DebugLocation): string {
  let content = `\n**Current Location**:\n`;
  content += `- File: ${location.file}\n`;
  content += `- Line: ${location.line}\n`;
  content += `- Method: ${location.method || 'unknown'}\n`;
  content += `- Class: ${location.className || 'unknown'}\n`;
  return content;
}

/**
 * Format stack trace for display
 */
export function formatStackTrace(frames: StackFrame[], limit = 10): string {
  let content = `\n**Stack Trace** (${frames.length} frames):\n`;
  frames.slice(0, limit).forEach((frame, i) => {
    content += `  ${i}. ${frame.className || ''}.${frame.method}() at ${frame.file}:${frame.line}\n`;
  });
  if (frames.length > limit) {
    content += `  ... and ${frames.length - limit} more\n`;
  }
  return content;
}

/**
 * Format variables for display
 */
export function formatVariables(vars: VariablesResponse, sessionId?: string): string {
  let content = '';

  if (sessionId) {
    content += `[Session: ${sessionId}]\n\n`;
  }

  content += '**Local Variables**:\n';

  if (vars.locals && vars.locals.length > 0) {
    vars.locals.forEach(v => {
      content += `- ${v.name}: ${v.type} = ${v.value}\n`;
    });
  } else {
    content += '(no local variables)\n';
  }

  if (vars.thisObject) {
    content += `\n**this** (${vars.thisObject.type}):\n`;
    vars.thisObject.fields?.forEach(f => {
      content += `  .${f.name}: ${f.type} = ${f.value}\n`;
    });
  }

  return content;
}

/**
 * Format breakpoints for display
 */
export function formatBreakpoints(response: BreakpointsResponse, projectId?: string): string {
  if (!response.breakpoints || response.breakpoints.length === 0) {
    return 'No breakpoints set.';
  }

  let content = '';
  if (projectId) {
    content += `[Project: ${projectId}]\n\n`;
  }

  content += `**Breakpoints** (${response.breakpoints.length}):\n`;
  response.breakpoints.forEach(bp => {
    const status = bp.enabled ? '●' : '○';
    content += `${status} ${bp.file}:${bp.line}`;
    if (bp.condition) {
      content += ` [if: ${bp.condition}]`;
    }
    content += '\n';
  });

  return content;
}

/**
 * Format sessions list for display
 */
export function formatSessionsList(sessions: SessionInfo[]): string {
  if (sessions.length === 0) {
    return 'No active debug sessions.';
  }

  let content = `**Debug Sessions** (${sessions.length}):\n\n`;
  sessions.forEach(s => {
    const statusIcon = s.status === 'SUSPENDED' ? '⏸️' : s.status === 'RUNNING' ? '▶️' : '⏹️';
    content += `${statusIcon} **${s.name}**\n`;
    content += `   ID: \`${s.id}\`\n`;
    content += `   Project: ${s.projectName}\n`;
    content += `   Status: ${s.status}\n`;
    if (s.location) {
      content += `   Location: ${s.location.file}:${s.location.line}\n`;
    }
    content += '\n';
  });

  return content;
}

/**
 * Format projects list for display
 */
export function formatProjectsList(projects: ProjectInfo[]): string {
  if (projects.length === 0) {
    return 'No IntelliJ projects open.';
  }

  let content = `**Open Projects** (${projects.length}):\n\n`;
  projects.forEach(p => {
    content += `📁 **${p.name}**\n`;
    content += `   ID: \`${p.id}\`\n`;
    content += `   Path: ${p.path}\n`;
    if (p.sessionCount !== undefined) {
      content += `   Sessions: ${p.sessionCount}\n`;
    }
    content += '\n';
  });

  return content;
}

/**
 * Format step result for display
 */
export function formatStepResult(
  result: SessionActionResponse,
  action: string
): string {
  let content = result.success
    ? `${action} completed.`
    : `${action} failed: ${result.message}`;

  if (result.session?.location) {
    content += `\n\nNow at: ${result.session.location.file}:${result.session.location.line}`;
    if (result.session.location.method) {
      content += ` in ${result.session.location.method}()`;
    }
  }

  return content;
}

/**
 * Format session detail for display
 */
export function formatSessionDetail(session: SessionDetailResponse): string {
  let content = `**Session: ${session.name}**\n`;
  content += `ID: \`${session.id}\`\n`;
  content += `Project: ${session.projectName}\n`;
  content += `Status: ${session.status}\n`;

  if (session.location) {
    content += formatLocation(session.location);
  }

  if (session.stackTrace && session.stackTrace.length > 0) {
    content += formatStackTrace(session.stackTrace);
  }

  return content;
}
