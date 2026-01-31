/**
 * Evaluate tools - evaluate expressions, expand variables, select frames
 */
import { z } from 'zod';
import { defineTool, textContent, errorContent } from './types.js';
export const evaluateTool = defineTool({
    name: 'debug_evaluate',
    description: 'Evaluate an expression in the current debug context. Useful for inspecting values, calling methods, or testing conditions.',
    inputSchema: z.object({
        expression: z.string().describe('Expression to evaluate (e.g., "user.getName()", "i * 2", "list.size()")'),
        sessionId: z.string().optional().describe('Session ID (auto-selected if only one active)'),
    }),
    handler: async ({ expression, sessionId }, ctx) => {
        const resolvedSessionId = await ctx.resolveSessionId(sessionId);
        const result = await ctx.client.evaluateInSession(resolvedSessionId, expression);
        if (result.error) {
            return errorContent(`Evaluation error: ${result.error}`);
        }
        return textContent(`**${expression}** = ${result.result}\n(type: ${result.type})`);
    },
});
export const expandVariableTool = defineTool({
    name: 'debug_expand_variable',
    description: 'Expand a variable to see its children/fields. Use with path from debug_get_variables.',
    inputSchema: z.object({
        path: z.string().describe('Variable path (e.g., "this", "myObject", "this.field")'),
    }),
    handler: async ({ path }, ctx) => {
        const result = await ctx.client.expandVariable(path);
        if (!result.children || result.children.length === 0) {
            return textContent(`Variable "${path}" has no expandable children.`);
        }
        let content = `**${path}** children:\n`;
        result.children.forEach(c => {
            content += `- ${c.name}: ${c.type} = ${c.value}\n`;
        });
        return textContent(content);
    },
});
export const selectFrameTool = defineTool({
    name: 'debug_select_frame',
    description: 'Select a specific stack frame to inspect variables at that level.',
    inputSchema: z.object({
        index: z.number().describe('Stack frame index (0 = current, 1 = caller, etc.)'),
    }),
    handler: async ({ index }, ctx) => {
        const result = await ctx.client.selectFrame(index);
        return textContent(result.success ? `Selected frame ${index}` : result.message);
    },
});
export const runToCursorTool = defineTool({
    name: 'debug_run_to_cursor',
    description: 'Run until reaching a specific line in a file.',
    inputSchema: z.object({
        file: z.string().describe('File name or path'),
        line: z.number().describe('Line number to run to'),
    }),
    handler: async ({ file, line }, ctx) => {
        const result = await ctx.client.runToCursor(file, line);
        let content = result.success
            ? `Running to ${file}:${line}...`
            : `Failed: ${result.message}`;
        if (result.state?.location) {
            content += `\n\nNow at: ${result.state.location.file}:${result.state.location.line}`;
        }
        return textContent(content);
    },
});
export const evaluateTools = [
    evaluateTool,
    expandVariableTool,
    selectFrameTool,
    runToCursorTool,
];
