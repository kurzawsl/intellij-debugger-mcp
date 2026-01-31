/**
 * Breakpoint tools - list, set, remove, clear breakpoints
 */
import { z } from 'zod';
import { defineTool, textContent } from './types.js';
import { formatBreakpoints } from '../formatters/response.js';
export const listBreakpointsTool = defineTool({
    name: 'debug_list_breakpoints',
    description: 'List all breakpoints in the project.',
    inputSchema: z.object({
        projectId: z.string().optional().describe('Project ID (auto-selected if only one open)'),
    }),
    handler: async ({ projectId }, ctx) => {
        const resolvedProjectId = await ctx.resolveProjectId(projectId);
        const response = await ctx.client.getProjectBreakpoints(resolvedProjectId);
        return textContent(formatBreakpoints(response, resolvedProjectId));
    },
});
export const setBreakpointTool = defineTool({
    name: 'debug_set_breakpoint',
    description: 'Add a breakpoint at specified file and line.',
    inputSchema: z.object({
        file: z.string().describe('File name (e.g., "Main.java") or full path'),
        line: z.number().describe('Line number'),
        condition: z.string().optional().describe('Optional condition expression'),
        projectId: z.string().optional().describe('Project ID (auto-selected if only one open)'),
    }),
    handler: async ({ file, line, condition, projectId }, ctx) => {
        const resolvedProjectId = await ctx.resolveProjectId(projectId);
        const result = await ctx.client.addBreakpointToProject(resolvedProjectId, file, line, condition);
        const content = result.success
            ? `Breakpoint added at ${file}:${line}${condition ? ` with condition: ${condition}` : ''}`
            : `Failed: ${result.message}`;
        return textContent(content);
    },
});
export const setBreakpointsBatchTool = defineTool({
    name: 'debug_set_breakpoints_batch',
    description: 'Add multiple breakpoints at once (efficient for setting up debug flow).',
    inputSchema: z.object({
        breakpoints: z.array(z.object({
            file: z.string(),
            line: z.number(),
        })).describe('Array of breakpoint locations'),
        projectId: z.string().optional().describe('Project ID (auto-selected if only one open)'),
    }),
    handler: async ({ breakpoints, projectId }, ctx) => {
        const resolvedProjectId = await ctx.resolveProjectId(projectId);
        let added = 0;
        let failed = 0;
        const results = [];
        for (const bp of breakpoints) {
            const result = await ctx.client.addBreakpointToProject(resolvedProjectId, bp.file, bp.line);
            if (result.success) {
                added++;
                results.push(`✓ ${bp.file}:${bp.line}`);
            }
            else {
                failed++;
                results.push(`✗ ${bp.file}:${bp.line} - ${result.message}`);
            }
        }
        let content = `**Breakpoints set**: ${added} added, ${failed} failed\n\n`;
        content += results.join('\n');
        return textContent(content);
    },
});
export const removeBreakpointTool = defineTool({
    name: 'debug_remove_breakpoint',
    description: 'Remove a breakpoint at specified location.',
    inputSchema: z.object({
        file: z.string().describe('File name or path'),
        line: z.number().describe('Line number'),
        projectId: z.string().optional().describe('Project ID (auto-selected if only one open)'),
    }),
    handler: async ({ file, line, projectId }, ctx) => {
        const resolvedProjectId = await ctx.resolveProjectId(projectId);
        const result = await ctx.client.removeBreakpointFromProject(resolvedProjectId, file, line);
        return textContent(result.success ? `Breakpoint removed from ${file}:${line}` : result.message);
    },
});
export const clearAllBreakpointsTool = defineTool({
    name: 'debug_clear_all_breakpoints',
    description: 'Remove all breakpoints.',
    inputSchema: z.object({
        projectId: z.string().optional().describe('Project ID (auto-selected if only one open)'),
    }),
    handler: async ({ projectId }, ctx) => {
        // Note: V2 API may need a different approach for clearing all
        // For now, use V1 API which clears all breakpoints
        const result = await ctx.client.clearAllBreakpoints();
        return textContent(result.success ? result.message : 'Failed to clear breakpoints');
    },
});
export const toggleBreakpointTool = defineTool({
    name: 'debug_toggle_breakpoint',
    description: 'Toggle a breakpoint on/off (enable/disable) at specified location.',
    inputSchema: z.object({
        file: z.string().describe('File name or path'),
        line: z.number().describe('Line number'),
    }),
    handler: async ({ file, line }, ctx) => {
        const result = await ctx.client.toggleBreakpoint(file, line);
        return textContent(result.success ? `Breakpoint toggled at ${file}:${line}` : result.message);
    },
});
export const breakpointTools = [
    listBreakpointsTool,
    setBreakpointTool,
    setBreakpointsBatchTool,
    removeBreakpointTool,
    clearAllBreakpointsTool,
    toggleBreakpointTool,
];
