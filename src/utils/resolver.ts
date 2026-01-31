/**
 * Session and project resolution utilities
 *
 * Implements the "explicit first, smart default" pattern:
 * - If ID provided -> use it
 * - If only one exists -> auto-select
 * - If zero or multiple -> throw actionable error
 */

import type { IntelliJDebugClient } from '../intellij-client.js';
import type { SessionInfo, ProjectInfo } from '../types.js';
import {
  AmbiguousSessionError,
  AmbiguousProjectError,
  NoSessionError,
  NoProjectError,
} from '../errors.js';

/**
 * Entity with an ID that can be resolved
 */
interface EntityWithId {
  id: string;
}

/**
 * Generic entity resolver configuration
 */
interface ResolverConfig<T extends EntityWithId> {
  providedId?: string;
  fetchEntities: () => Promise<T[]>;
  filterActive?: (entity: T) => boolean;
  noEntityError: () => Error;
  ambiguousError: (entities: T[]) => Error;
}

/**
 * Generic entity resolution with smart defaults.
 * DRY implementation for resolving sessions, projects, or any entity type.
 */
async function resolveEntity<T extends EntityWithId>(
  config: ResolverConfig<T>
): Promise<string> {
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
export async function resolveSessionId(
  client: IntelliJDebugClient,
  providedSessionId?: string
): Promise<string> {
  return resolveEntity<SessionInfo>({
    providedId: providedSessionId,
    fetchEntities: async () => (await client.getSessions()).sessions,
    filterActive: (s) => s.status !== 'TERMINATED' && s.status !== 'NO_SESSION',
    noEntityError: () => new NoSessionError('No active debug sessions. Start debugging first.'),
    ambiguousError: (sessions) => new AmbiguousSessionError(
      'Multiple debug sessions are active. Please specify which session to target.',
      sessions
    ),
  });
}

/**
 * Resolve projectId with smart defaults
 */
export async function resolveProjectId(
  client: IntelliJDebugClient,
  providedProjectId?: string
): Promise<string> {
  return resolveEntity<ProjectInfo>({
    providedId: providedProjectId,
    fetchEntities: async () => (await client.getProjects()).projects,
    noEntityError: () => new NoProjectError('No IntelliJ projects open.'),
    ambiguousError: (projects) => new AmbiguousProjectError(
      'Multiple IntelliJ projects are open. Please specify which project to target.',
      projects
    ),
  });
}

/**
 * Create resolver functions bound to a client
 */
export function createResolvers(client: IntelliJDebugClient) {
  return {
    resolveSessionId: (sessionId?: string) => resolveSessionId(client, sessionId),
    resolveProjectId: (projectId?: string) => resolveProjectId(client, projectId),
  };
}
