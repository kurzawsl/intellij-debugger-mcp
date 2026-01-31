/**
 * File tools - open, close, navigate files in IntelliJ
 */
import { z } from 'zod';
import { defineTool, textContent } from './types.js';
export const openFileTool = defineTool({
    name: 'debug_open_file',
    description: 'Open a file in IntelliJ editor, optionally at a specific line.',
    inputSchema: z.object({
        file: z.string().describe('File path or name'),
        line: z.number().optional().describe('Line number to jump to'),
    }),
    handler: async ({ file, line }, ctx) => {
        const result = await ctx.client.openFile(file, line);
        return textContent(result.success
            ? `Opened ${file}${line ? ` at line ${line}` : ''}`
            : result.message);
    },
});
export const closeFileTool = defineTool({
    name: 'debug_close_file',
    description: 'Close a file in IntelliJ editor.',
    inputSchema: z.object({
        file: z.string().describe('File path or name'),
    }),
    handler: async ({ file }, ctx) => {
        const result = await ctx.client.closeFile(file);
        return textContent(result.success ? `Closed ${file}` : result.message);
    },
});
export const getOpenFilesTool = defineTool({
    name: 'debug_get_open_files',
    description: 'List all open files in IntelliJ editor.',
    handler: async (_, ctx) => {
        const result = await ctx.client.getOpenFiles();
        if (!result.files || result.files.length === 0) {
            return textContent('No files open.');
        }
        let content = `**Open Files** (${result.files.length}):\n`;
        result.files.forEach(f => {
            content += `- ${f.name}${f.path ? ` (${f.path})` : ''}\n`;
        });
        return textContent(content);
    },
});
export const goToLineTool = defineTool({
    name: 'debug_go_to_line',
    description: 'Navigate to a specific line in the current file.',
    inputSchema: z.object({
        line: z.number().describe('Line number to go to'),
    }),
    handler: async ({ line }, ctx) => {
        const result = await ctx.client.goToLine(line);
        return textContent(result.success ? `Moved to line ${line}` : result.message);
    },
});
export const getProblemsTool = defineTool({
    name: 'debug_get_problems',
    description: 'Get code problems/inspections (errors, warnings) from IntelliJ.',
    handler: async (_, ctx) => {
        const result = await ctx.client.getProblems();
        if (!result.problems || result.problems.length === 0) {
            return textContent('✅ No problems found.');
        }
        let content = `**Problems** (${result.problems.length}):\n\n`;
        result.problems.forEach(p => {
            const icon = p.severity === 'ERROR' ? '❌' : p.severity === 'WARNING' ? '⚠️' : 'ℹ️';
            content += `${icon} **${p.file}:${p.line}** - ${p.message}\n`;
        });
        return textContent(content);
    },
});
export const fileTools = [
    openFileTool,
    closeFileTool,
    getOpenFilesTool,
    goToLineTool,
    getProblemsTool,
];
