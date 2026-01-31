/**
 * Custom error classes for IntelliJ Debugger MCP Server
 */
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { SessionInfo, ProjectInfo } from './types.js';
/**
 * Base class for all debugger errors.
 * Provides consistent toToolResult() interface for error handling.
 */
export declare abstract class DebuggerError extends Error {
    constructor(message: string, name: string);
    /**
     * Format error as MCP tool result.
     * Override in subclasses for custom formatting.
     */
    toToolResult(): CallToolResult;
}
/**
 * Thrown when multiple sessions exist but no sessionId was provided
 */
export declare class AmbiguousSessionError extends DebuggerError {
    readonly availableSessions: SessionInfo[];
    constructor(message: string, sessions: SessionInfo[]);
    toToolResult(): CallToolResult;
}
/**
 * Thrown when multiple projects exist but no projectId was provided
 */
export declare class AmbiguousProjectError extends DebuggerError {
    readonly availableProjects: ProjectInfo[];
    constructor(message: string, projects: ProjectInfo[]);
    toToolResult(): CallToolResult;
}
/**
 * Thrown when no debug sessions exist
 */
export declare class NoSessionError extends DebuggerError {
    constructor(message?: string);
}
/**
 * Thrown when no projects are open
 */
export declare class NoProjectError extends DebuggerError {
    constructor(message?: string);
}
/**
 * Thrown when a session is not found
 */
export declare class SessionNotFoundError extends DebuggerError {
    readonly sessionId: string;
    constructor(sessionId: string);
}
/**
 * Thrown when a project is not found
 */
export declare class ProjectNotFoundError extends DebuggerError {
    readonly projectId: string;
    constructor(projectId: string);
}
/**
 * Check if error is a DebuggerError with toToolResult method
 */
export declare function isDebuggerError(error: unknown): error is DebuggerError;
