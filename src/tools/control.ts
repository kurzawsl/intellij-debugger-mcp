/**
 * Control tools - step over, step into, step out, resume, pause
 */

import { z } from 'zod';
import { defineTool, textContent } from './types.js';
import { formatStepResult } from '../formatters/response.js';

const sessionIdSchema = z.object({
  sessionId: z.string().optional().describe('Session ID (auto-selected if only one active)'),
});

export const stepOverTool = defineTool({
  name: 'debug_step_over',
  description: 'Execute step over (F8) - go to next line without entering function calls.',
  inputSchema: sessionIdSchema,
  handler: async ({ sessionId }, ctx) => {
    const resolvedSessionId = await ctx.resolveSessionId(sessionId);
    const result = await ctx.client.stepOverSession(resolvedSessionId);
    return textContent(formatStepResult(result, 'Step over'));
  },
});

export const stepIntoTool = defineTool({
  name: 'debug_step_into',
  description: 'Execute step into (F7) - enter the method call on current line.',
  inputSchema: sessionIdSchema,
  handler: async ({ sessionId }, ctx) => {
    const resolvedSessionId = await ctx.resolveSessionId(sessionId);
    const result = await ctx.client.stepIntoSession(resolvedSessionId);
    return textContent(formatStepResult(result, 'Step into'));
  },
});

export const stepOutTool = defineTool({
  name: 'debug_step_out',
  description: 'Execute step out (Shift+F8) - run until current method returns.',
  inputSchema: sessionIdSchema,
  handler: async ({ sessionId }, ctx) => {
    const resolvedSessionId = await ctx.resolveSessionId(sessionId);
    const result = await ctx.client.stepOutSession(resolvedSessionId);
    return textContent(formatStepResult(result, 'Step out'));
  },
});

export const resumeTool = defineTool({
  name: 'debug_resume',
  description: 'Resume execution (F9) - continue until next breakpoint or program ends.',
  inputSchema: sessionIdSchema,
  handler: async ({ sessionId }, ctx) => {
    const resolvedSessionId = await ctx.resolveSessionId(sessionId);
    const result = await ctx.client.resumeSession(resolvedSessionId);

    let content = result.success
      ? 'Resumed execution.'
      : `Resume failed: ${result.message}`;

    if (result.session) {
      content += `\n\nStatus: ${result.session.status}`;
      if (result.session.status === 'SUSPENDED' && result.session.location) {
        content += `\nHit breakpoint at: ${result.session.location.file}:${result.session.location.line}`;
      }
    }

    return textContent(content);
  },
});

export const pauseTool = defineTool({
  name: 'debug_pause',
  description: 'Pause the running program (like clicking pause in debugger).',
  inputSchema: sessionIdSchema,
  handler: async ({ sessionId }, ctx) => {
    const resolvedSessionId = await ctx.resolveSessionId(sessionId);
    const result = await ctx.client.pauseSession(resolvedSessionId);
    return textContent(result.success ? 'Paused.' : result.message);
  },
});

export const controlTools = [
  stepOverTool,
  stepIntoTool,
  stepOutTool,
  resumeTool,
  pauseTool,
];
