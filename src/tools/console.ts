/**
 * Console tools - get and clear console output
 */

import { z } from 'zod';
import { defineTool, textContent } from './types.js';

export const getConsoleTool = defineTool({
  name: 'debug_get_console',
  description: 'Get console output from the debug session. Shows stdout, stderr, and system messages.',
  inputSchema: z.object({
    lastN: z.number().optional().describe('Get last N lines (default: all)'),
    filter: z.string().optional().describe('Filter lines containing this text'),
    type: z.enum(['STDOUT', 'STDERR', 'SYSTEM']).optional().describe('Filter by output type'),
  }),
  handler: async ({ lastN, filter, type }, ctx) => {
    const result = await ctx.client.getConsole({ lastN, filter, type });

    if (!result.lines || result.lines.length === 0) {
      return textContent('Console is empty or no matching lines.');
    }

    let content = `**Console Output** (${result.lines.length} lines, total: ${result.totalLines})\n\n`;
    content += '```\n';
    result.lines.forEach((line) => {
      const prefix = line.type === 'STDERR' ? '[ERR] ' : line.type === 'SYSTEM' ? '[SYS] ' : '';
      content += `${prefix}${line.text}\n`;
    });
    content += '```';

    return textContent(content);
  },
});

export const clearConsoleTool = defineTool({
  name: 'debug_clear_console',
  description: 'Clear the console output buffer.',
  handler: async (_, ctx) => {
    const result = await ctx.client.clearConsole();
    return textContent(result.success ? 'Console cleared.' : result.message);
  },
});

export const consoleTools = [getConsoleTool, clearConsoleTool];
