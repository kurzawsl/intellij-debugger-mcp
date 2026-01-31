/**
 * Discovery tools - list projects and sessions
 */

import { z } from 'zod';
import { defineTool, textContent } from './types.js';
import { formatProjectsList, formatSessionsList } from '../formatters/response.js';

export const listProjectsTool = defineTool({
  name: 'debug_list_projects',
  description: 'List all open IntelliJ projects. Returns projectId for targeting project-scoped operations like breakpoints.',
  handler: async (_, ctx) => {
    const response = await ctx.client.getProjects();
    return textContent(formatProjectsList(response.projects));
  },
});

export const listSessionsTool = defineTool({
  name: 'debug_list_sessions',
  description: 'List all active debug sessions across projects. Returns sessionId for targeting session-scoped operations.',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Filter sessions by project ID'),
  }),
  handler: async ({ projectId }, ctx) => {
    const response = await ctx.client.getSessions(projectId);
    return textContent(formatSessionsList(response.sessions));
  },
});

export const discoveryTools = [listProjectsTool, listSessionsTool];
