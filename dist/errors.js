/**
 * Custom error classes for IntelliJ Debugger MCP Server
 */
/**
 * Base class for all debugger errors.
 * Provides consistent toToolResult() interface for error handling.
 */
export class DebuggerError extends Error {
    constructor(message, name) {
        super(message);
        this.name = name;
    }
    /**
     * Format error as MCP tool result.
     * Override in subclasses for custom formatting.
     */
    toToolResult() {
        return {
            content: [{ type: 'text', text: this.message }],
            isError: true,
        };
    }
}
/**
 * Thrown when multiple sessions exist but no sessionId was provided
 */
export class AmbiguousSessionError extends DebuggerError {
    availableSessions;
    constructor(message, sessions) {
        super(message, 'AmbiguousSessionError');
        this.availableSessions = sessions;
    }
    toToolResult() {
        const sessionList = this.availableSessions
            .map(s => `  - ${s.id}: ${s.name} [${s.status}] (${s.projectName})`)
            .join('\n');
        const text = `${this.message}\n\nAvailable sessions:\n${sessionList}\n\nUse sessionId parameter to target a specific session.`;
        return { content: [{ type: 'text', text }], isError: true };
    }
}
/**
 * Thrown when multiple projects exist but no projectId was provided
 */
export class AmbiguousProjectError extends DebuggerError {
    availableProjects;
    constructor(message, projects) {
        super(message, 'AmbiguousProjectError');
        this.availableProjects = projects;
    }
    toToolResult() {
        const projectList = this.availableProjects
            .map(p => `  - ${p.id}: ${p.name} (${p.sessionCount || 0} sessions)`)
            .join('\n');
        const text = `${this.message}\n\nAvailable projects:\n${projectList}\n\nUse projectId parameter to target a specific project.`;
        return { content: [{ type: 'text', text }], isError: true };
    }
}
/**
 * Thrown when no debug sessions exist
 */
export class NoSessionError extends DebuggerError {
    constructor(message = 'No active debug sessions') {
        super(message, 'NoSessionError');
    }
}
/**
 * Thrown when no projects are open
 */
export class NoProjectError extends DebuggerError {
    constructor(message = 'No IntelliJ projects open') {
        super(message, 'NoProjectError');
    }
}
/**
 * Thrown when a session is not found
 */
export class SessionNotFoundError extends DebuggerError {
    sessionId;
    constructor(sessionId) {
        super(`Session not found: ${sessionId}`, 'SessionNotFoundError');
        this.sessionId = sessionId;
    }
}
/**
 * Thrown when a project is not found
 */
export class ProjectNotFoundError extends DebuggerError {
    projectId;
    constructor(projectId) {
        super(`Project not found: ${projectId}`, 'ProjectNotFoundError');
        this.projectId = projectId;
    }
}
/**
 * Check if error is a DebuggerError with toToolResult method
 */
export function isDebuggerError(error) {
    return error instanceof DebuggerError;
}
