/**
 * State tools - get debugger state, variables, frames
 */

import { z } from 'zod';
import { defineTool, textContent, errorContent } from './types.js';
import {
  formatDebugState,
  formatVariables,
  formatStackTrace,
} from '../formatters/response.js';

export const getStateTool = defineTool({
  name: 'debug_get_state',
  description: 'Get current debugger state including location, stack trace, and status.',
  inputSchema: z.object({
    sessionId: z.string().optional().describe('Session ID (auto-selected if only one active)'),
  }),
  handler: async ({ sessionId }, ctx) => {
    const resolvedSessionId = await ctx.resolveSessionId(sessionId);

    // Use V2 API with session
    const session = await ctx.client.getSessionDetails(resolvedSessionId);

    let content = `[Session: ${resolvedSessionId}]\n\n`;
    content += `**Debug Status**: ${session.status}\n`;
    content += `**Session**: ${session.name}\n`;
    content += `**Project**: ${session.projectName}\n`;

    if (session.location) {
      content += `\n**Current Location**:\n`;
      content += `- File: ${session.location.file}\n`;
      content += `- Line: ${session.location.line}\n`;
      content += `- Method: ${session.location.method || 'unknown'}\n`;
      content += `- Class: ${session.location.className || 'unknown'}\n`;
    }

    if (session.stackTrace && session.stackTrace.length > 0) {
      content += formatStackTrace(session.stackTrace);
    }

    return textContent(content);
  },
});

export const getVariablesTool = defineTool({
  name: 'debug_get_variables',
  description: 'Get local variables and this object at current breakpoint.',
  inputSchema: z.object({
    sessionId: z.string().optional().describe('Session ID (auto-selected if only one active)'),
  }),
  handler: async ({ sessionId }, ctx) => {
    const resolvedSessionId = await ctx.resolveSessionId(sessionId);
    const vars = await ctx.client.getVariablesForSession(resolvedSessionId);
    return textContent(formatVariables(vars, resolvedSessionId));
  },
});

export const getFramesTool = defineTool({
  name: 'debug_get_frames',
  description: 'Get all stack frames in the current debug context.',
  inputSchema: z.object({
    sessionId: z.string().optional().describe('Session ID (auto-selected if only one active)'),
  }),
  handler: async ({ sessionId }, ctx) => {
    const resolvedSessionId = await ctx.resolveSessionId(sessionId);

    // For now, use session details which includes stack trace
    const session = await ctx.client.getSessionDetails(resolvedSessionId);

    if (!session.stackTrace || session.stackTrace.length === 0) {
      return textContent('No stack frames available.');
    }

    let content = `[Session: ${resolvedSessionId}]\n\n`;
    content += `**Stack Frames** (${session.stackTrace.length}):\n`;
    session.stackTrace.forEach((f, i) => {
      content += `${i}. ${f.className || ''}.${f.method}() at ${f.file}:${f.line}\n`;
    });

    return textContent(content);
  },
});

export const stateTools = [getStateTool, getVariablesTool, getFramesTool];
