#!/usr/bin/env node

/**
 * IntelliJ Debugger MCP Server v2.0
 *
 * Provides Claude with tools to interact with IntelliJ IDEA's debugger
 * via the Debug Bridge plugin REST API.
 *
 * Supports multi-project and multi-session debugging with V2 API.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { IntelliJDebugClient } from './intellij-client.js';
import { allTools, type ToolContext } from './tools/index.js';
import { createResolvers } from './utils/resolver.js';
import { isDebuggerError } from './errors.js';

// Initialize server
const server = new McpServer({
  name: 'intellij-debugger',
  version: '2.0.0',
});

// Initialize client and context
const client = new IntelliJDebugClient();
const resolvers = createResolvers(client);

const toolContext: ToolContext = {
  client,
  resolveSessionId: resolvers.resolveSessionId,
  resolveProjectId: resolvers.resolveProjectId,
};

// Register all tools using the new registerTool API
for (const tool of allTools) {
  const config: {
    description: string;
    inputSchema?: typeof tool.inputSchema;
  } = {
    description: tool.description,
  };

  if (tool.inputSchema) {
    config.inputSchema = tool.inputSchema;
  }

  server.registerTool(tool.name, config, async (args) => {
    try {
      return await tool.handler(args, toolContext);
    } catch (error) {
      // Handle debugger errors with consistent interface
      if (isDebuggerError(error)) {
        return error.toToolResult();
      }

      // Generic error fallback
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true,
      };
    }
  });
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('IntelliJ Debugger MCP Server v2.0 started');
  console.error(`Registered ${allTools.length} tools`);
}

main().catch(console.error);
