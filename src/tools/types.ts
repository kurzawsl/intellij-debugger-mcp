/**
 * Tool definition types for MCP server
 */

import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { IntelliJDebugClient } from '../intellij-client.js';

/**
 * Context passed to all tool handlers
 */
export interface ToolContext {
  client: IntelliJDebugClient;
  resolveSessionId: (sessionId?: string) => Promise<string>;
  resolveProjectId: (projectId?: string) => Promise<string>;
}

/**
 * Standard tool definition interface (for defining individual tools)
 */
export interface ToolDefinition<TInput = unknown> {
  name: string;
  description: string;
  inputSchema?: z.ZodType<TInput>;
  handler: (args: TInput, ctx: ToolContext) => Promise<CallToolResult>;
}

/**
 * Tool ready for registration in the registry.
 * Uses unknown for the handler input since we lose type information
 * when collecting heterogeneous tools into an array.
 * Type safety is enforced at defineTool() call site.
 */
export interface RegisterableTool {
  name: string;
  description: string;
  inputSchema?: z.ZodType<unknown>;
  handler: (args: unknown, ctx: ToolContext) => Promise<CallToolResult>;
}

/**
 * Create a typed tool definition.
 * Returns RegisterableTool for array compatibility while
 * maintaining type safety at the definition site.
 */
export function defineTool<TInput>(
  definition: ToolDefinition<TInput>
): RegisterableTool {
  // Cast is safe: handler accepts TInput which is more specific than unknown
  // The runtime behavior is identical, we're just widening the type for registration
  return definition as RegisterableTool;
}

/**
 * Helper to create text content response
 */
export function textContent(text: string): CallToolResult {
  return {
    content: [{ type: 'text', text }],
  };
}

/**
 * Helper to create error response
 */
export function errorContent(message: string): CallToolResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}
