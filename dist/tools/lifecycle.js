/**
 * Lifecycle tools - start/stop debugging, health check, IntelliJ management
 */
import { z } from 'zod';
import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import { defineTool, textContent, errorContent } from './types.js';
const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);
export const healthCheckTool = defineTool({
    name: 'debug_health_check',
    description: 'Check if IntelliJ Debug Bridge plugin is running and accessible. Use this first to verify the connection.',
    handler: async (_, ctx) => {
        try {
            const state = await ctx.client.getState();
            return textContent(`✅ **Debug Bridge Connected**\n\n` +
                `- Status: ${state.status}\n` +
                `- Session: ${state.sessionName || 'none'}\n` +
                `- Location: ${state.location ? `${state.location.file}:${state.location.line}` : 'N/A'}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return errorContent(`❌ **Debug Bridge Not Available**\n\n` +
                `Error: ${message}\n\n` +
                `Make sure:\n` +
                `1. IntelliJ IDEA is running\n` +
                `2. Debug Bridge plugin is installed\n` +
                `3. A project is open`);
        }
    },
});
export const startIntelliJTool = defineTool({
    name: 'debug_start_intellij',
    description: 'Start IntelliJ IDEA with a specific project. Use this to open IntelliJ with a project before debugging.',
    inputSchema: z.object({
        projectPath: z.string().describe('Full path to the project directory (e.g., "/Users/user/workspace/my-project")'),
        waitForStartup: z.boolean().optional().default(true).describe('Wait for IntelliJ to start (default: true)'),
    }),
    handler: async ({ projectPath, waitForStartup }, ctx) => {
        try {
            // Use execFile with array args to prevent command injection
            // 'open' command: open -a <application> <path>
            await execFileAsync('open', ['-a', 'IntelliJ IDEA', projectPath]);
            let content = `🚀 **Launching IntelliJ IDEA**\n\nProject: ${projectPath}\n`;
            if (waitForStartup) {
                content += `\nWaiting for Debug Bridge to become available...\n`;
                let connected = false;
                let lastError = null;
                for (let i = 0; i < 30; i++) {
                    await new Promise(r => setTimeout(r, 2000));
                    try {
                        await ctx.client.getState();
                        connected = true;
                        content += `\n✅ Debug Bridge connected after ${(i + 1) * 2} seconds`;
                        break;
                    }
                    catch (err) {
                        // Log the error for debugging, continue polling
                        lastError = err instanceof Error ? err.message : String(err);
                    }
                }
                if (!connected) {
                    content += `\n⚠️ Debug Bridge not yet available after 60s.`;
                    if (lastError) {
                        content += `\n   Last error: ${lastError}`;
                    }
                }
            }
            return textContent(content);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return errorContent(`❌ Failed to start IntelliJ: ${message}`);
        }
    },
});
export const killIntelliJTool = defineTool({
    name: 'debug_kill_intellij',
    description: 'Kill all IntelliJ IDEA processes. Use this to restart IntelliJ or clean up.',
    handler: async () => {
        try {
            await execAsync('pkill -f "IntelliJ IDEA" || true');
            return textContent('✅ IntelliJ IDEA processes terminated.');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return textContent(`⚠️ Kill attempted: ${message}`);
        }
    },
});
export const startDebugTool = defineTool({
    name: 'debug_start',
    description: 'Start debugging with optional run configuration name.',
    inputSchema: z.object({
        config: z.string().optional().describe('Run configuration name (optional)'),
        projectId: z.string().optional().describe('Project ID (auto-selected if only one open)'),
    }),
    handler: async ({ config, projectId }, ctx) => {
        // Use V2 API if projectId provided or can be resolved
        if (projectId) {
            const resolvedProjectId = await ctx.resolveProjectId(projectId);
            const result = await ctx.client.startDebugInProject(resolvedProjectId, config);
            let content = result.success
                ? `Debug session started.`
                : `Failed to start: ${result.message}`;
            if (result.sessionId) {
                content += `\n\nSession ID: ${result.sessionId}`;
            }
            return textContent(content);
        }
        // V1 fallback
        const result = await ctx.client.startDebug(config);
        let content = result.success
            ? `Debug session started.`
            : `Failed to start: ${result.message}`;
        if (result.state) {
            content += `\n\nStatus: ${result.state.status}`;
            if (result.state.location) {
                content += `\nLocation: ${result.state.location.file}:${result.state.location.line}`;
            }
        }
        return textContent(content);
    },
});
export const stopDebugTool = defineTool({
    name: 'debug_stop',
    description: 'Stop the current debug session.',
    inputSchema: z.object({
        sessionId: z.string().optional().describe('Session ID (auto-selected if only one active)'),
    }),
    handler: async ({ sessionId }, ctx) => {
        if (sessionId) {
            const result = await ctx.client.stopSession(sessionId);
            return textContent(result.success ? 'Debug session stopped.' : result.message);
        }
        // V1 fallback
        const result = await ctx.client.stopDebug();
        return textContent(result.success ? 'Debug session stopped.' : result.message);
    },
});
export const startInProjectTool = defineTool({
    name: 'debug_start_in_project',
    description: 'Start debugging in a specific project with optional configuration.',
    inputSchema: z.object({
        projectId: z.string().optional().describe('Project ID (auto-selected if only one open)'),
        config: z.string().optional().describe('Run configuration name'),
    }),
    handler: async ({ projectId, config }, ctx) => {
        const resolvedProjectId = await ctx.resolveProjectId(projectId);
        const result = await ctx.client.startDebugInProject(resolvedProjectId, config);
        let content = result.success
            ? `Debug session started in project.`
            : `Failed to start: ${result.message}`;
        if (result.sessionId) {
            content += `\n\nSession ID: \`${result.sessionId}\``;
        }
        return textContent(content);
    },
});
export const stopSessionTool = defineTool({
    name: 'debug_stop_session',
    description: 'Stop a specific debug session by ID.',
    inputSchema: z.object({
        sessionId: z.string().describe('Session ID to stop'),
    }),
    handler: async ({ sessionId }, ctx) => {
        const result = await ctx.client.stopSession(sessionId);
        return textContent(result.success
            ? `Session ${sessionId} stopped.`
            : `Failed to stop session: ${result.message}`);
    },
});
export const lifecycleTools = [
    healthCheckTool,
    startIntelliJTool,
    killIntelliJTool,
    startDebugTool,
    stopDebugTool,
    startInProjectTool,
    stopSessionTool,
];
