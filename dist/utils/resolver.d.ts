/**
 * Session and project resolution utilities
 *
 * Implements the "explicit first, smart default" pattern:
 * - If ID provided -> use it
 * - If only one exists -> auto-select
 * - If zero or multiple -> throw actionable error
 */
import type { IntelliJDebugClient } from '../intellij-client.js';
/**
 * Resolve sessionId with smart defaults
 */
export declare function resolveSessionId(client: IntelliJDebugClient, providedSessionId?: string): Promise<string>;
/**
 * Resolve projectId with smart defaults
 */
export declare function resolveProjectId(client: IntelliJDebugClient, providedProjectId?: string): Promise<string>;
/**
 * Create resolver functions bound to a client
 */
export declare function createResolvers(client: IntelliJDebugClient): {
    resolveSessionId: (sessionId?: string) => Promise<string>;
    resolveProjectId: (projectId?: string) => Promise<string>;
};
