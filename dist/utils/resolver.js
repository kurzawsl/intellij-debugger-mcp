/**
 * Session and project resolution utilities
 *
 * Implements the "explicit first, smart default" pattern:
 * - If ID provided -> use it
 * - If only one exists -> auto-select
 * - If zero or multiple -> throw actionable error
 */
import { AmbiguousSessionError, AmbiguousProjectError, NoSessionError, NoProjectError, } from '../errors.js';
/**
 * Generic entity resolution with smart defaults.
 * DRY implementation for resolving sessions, projects, or any entity type.
 */
async function resolveEntity(config) {
    // If explicitly provided, use it
    if (config.providedId) {
        return config.providedId;
    }
    // Fetch entities
    const entities = await config.fetchEntities();
    // Apply filter if provided
    const filtered = config.filterActive
        ? entities.filter(config.filterActive)
        : entities;
    if (filtered.length === 0) {
        throw config.noEntityError();
    }
    if (filtered.length === 1) {
        return filtered[0].id;
    }
    throw config.ambiguousError(filtered);
}
/**
 * Resolve sessionId with smart defaults
 */
export async function resolveSessionId(client, providedSessionId) {
    return resolveEntity({
        providedId: providedSessionId,
        fetchEntities: async () => (await client.getSessions()).sessions,
        filterActive: (s) => s.status !== 'TERMINATED' && s.status !== 'NO_SESSION',
        noEntityError: () => new NoSessionError('No active debug sessions. Start debugging first.'),
        ambiguousError: (sessions) => new AmbiguousSessionError('Multiple debug sessions are active. Please specify which session to target.', sessions),
    });
}
/**
 * Resolve projectId with smart defaults
 */
export async function resolveProjectId(client, providedProjectId) {
    return resolveEntity({
        providedId: providedProjectId,
        fetchEntities: async () => (await client.getProjects()).projects,
        noEntityError: () => new NoProjectError('No IntelliJ projects open.'),
        ambiguousError: (projects) => new AmbiguousProjectError('Multiple IntelliJ projects are open. Please specify which project to target.', projects),
    });
}
/**
 * Create resolver functions bound to a client
 */
export function createResolvers(client) {
    return {
        resolveSessionId: (sessionId) => resolveSessionId(client, sessionId),
        resolveProjectId: (projectId) => resolveProjectId(client, projectId),
    };
}
