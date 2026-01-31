/**
 * REST client for IntelliJ Debug Bridge plugin
 * Supports both V1 and V2 APIs
 */

import type {
  DebugState,
  VariablesResponse,
  BreakpointsResponse,
  ApiResponse,
  EvaluateResponse,
  ConfigurationsResponse,
  CreateConfigurationRequest,
  ConsoleResponse,
  OpenFilesResponse,
  ProblemsResponse,
  ModulesResponse,
  ExpandVariableResponse,
  FramesResponse,
  // V2 types
  ProjectsResponse,
  SessionsResponse,
  SessionDetailResponse,
  SessionActionResponse,
  StartDebugResponse,
  ProjectConfigurationsResponse,
} from './types.js';

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 19999;
const DEFAULT_TIMEOUT = 5000;

export class IntelliJDebugClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    const host = process.env.INTELLIJ_DEBUG_HOST || DEFAULT_HOST;
    const port = process.env.INTELLIJ_DEBUG_PORT || DEFAULT_PORT;
    this.baseUrl = `http://${host}:${port}`;
    this.timeout = parseInt(process.env.DEBUG_TIMEOUT || String(DEFAULT_TIMEOUT));
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as T;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - Debug Bridge plugin may not be running');
        }
        const cause = (error as NodeJS.ErrnoException).cause as NodeJS.ErrnoException | undefined;
        if (cause?.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to Debug Bridge plugin. Make sure IntelliJ is running with the plugin installed.');
        }
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ============================================================
  // V2 DISCOVERY ENDPOINTS
  // ============================================================

  /**
   * List all open IntelliJ projects
   */
  async getProjects(): Promise<ProjectsResponse> {
    return this.fetch<ProjectsResponse>('/v2/projects');
  }

  /**
   * List all active debug sessions
   * @param projectId - Optional filter by project
   */
  async getSessions(projectId?: string): Promise<SessionsResponse> {
    if (projectId) {
      return this.fetch<SessionsResponse>(`/v2/projects/${projectId}/sessions`);
    }
    return this.fetch<SessionsResponse>('/v2/sessions');
  }

  // ============================================================
  // V2 SESSION-SCOPED ENDPOINTS
  // ============================================================

  /**
   * Get detailed session information including stack trace
   */
  async getSessionDetails(sessionId: string): Promise<SessionDetailResponse> {
    return this.fetch<SessionDetailResponse>(`/v2/sessions/${sessionId}`);
  }

  /**
   * Get variables for a specific session
   */
  async getVariablesForSession(sessionId: string): Promise<VariablesResponse> {
    return this.fetch<VariablesResponse>(`/v2/sessions/${sessionId}/variables`);
  }

  /**
   * Step over in a specific session
   */
  async stepOverSession(sessionId: string): Promise<SessionActionResponse> {
    return this.fetch<SessionActionResponse>(`/v2/sessions/${sessionId}/step-over`, {
      method: 'POST',
    });
  }

  /**
   * Step into in a specific session
   */
  async stepIntoSession(sessionId: string): Promise<SessionActionResponse> {
    return this.fetch<SessionActionResponse>(`/v2/sessions/${sessionId}/step-into`, {
      method: 'POST',
    });
  }

  /**
   * Step out in a specific session
   */
  async stepOutSession(sessionId: string): Promise<SessionActionResponse> {
    return this.fetch<SessionActionResponse>(`/v2/sessions/${sessionId}/step-out`, {
      method: 'POST',
    });
  }

  /**
   * Resume a specific session
   */
  async resumeSession(sessionId: string): Promise<SessionActionResponse> {
    return this.fetch<SessionActionResponse>(`/v2/sessions/${sessionId}/resume`, {
      method: 'POST',
    });
  }

  /**
   * Pause a specific session
   */
  async pauseSession(sessionId: string): Promise<SessionActionResponse> {
    return this.fetch<SessionActionResponse>(`/v2/sessions/${sessionId}/pause`, {
      method: 'POST',
    });
  }

  /**
   * Stop a specific session
   */
  async stopSession(sessionId: string): Promise<SessionActionResponse> {
    return this.fetch<SessionActionResponse>(`/v2/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Evaluate expression in a specific session
   */
  async evaluateInSession(sessionId: string, expression: string): Promise<EvaluateResponse> {
    return this.fetch<EvaluateResponse>(`/v2/sessions/${sessionId}/evaluate`, {
      method: 'POST',
      body: JSON.stringify({ expression }),
    });
  }

  // ============================================================
  // V2 PROJECT-SCOPED ENDPOINTS
  // ============================================================

  /**
   * Get project details
   */
  async getProjectDetails(projectId: string): Promise<ProjectsResponse> {
    return this.fetch<ProjectsResponse>(`/v2/projects/${projectId}`);
  }

  /**
   * Get run configurations for a project
   */
  async getProjectConfigurations(projectId: string): Promise<ProjectConfigurationsResponse> {
    return this.fetch<ProjectConfigurationsResponse>(`/v2/projects/${projectId}/configurations`);
  }

  /**
   * Get breakpoints for a project
   */
  async getProjectBreakpoints(projectId: string): Promise<BreakpointsResponse> {
    return this.fetch<BreakpointsResponse>(`/v2/projects/${projectId}/breakpoints`);
  }

  /**
   * Create a run configuration in a specific project (V2 API)
   */
  async createConfigurationInProject(projectId: string, config: CreateConfigurationRequest): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/v2/projects/${projectId}/configurations`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  /**
   * Add breakpoint to a project
   */
  async addBreakpointToProject(
    projectId: string,
    file: string,
    line: number,
    condition?: string
  ): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/v2/projects/${projectId}/breakpoints`, {
      method: 'POST',
      body: JSON.stringify({ file, line, condition }),
    });
  }

  /**
   * Remove breakpoint from a project
   */
  async removeBreakpointFromProject(
    projectId: string,
    file: string,
    line: number
  ): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/v2/projects/${projectId}/breakpoints`, {
      method: 'DELETE',
      body: JSON.stringify({ file, line }),
    });
  }

  /**
   * Start debugging in a specific project
   */
  async startDebugInProject(projectId: string, configName?: string): Promise<StartDebugResponse> {
    const url = configName
      ? `/v2/projects/${projectId}/debug/start?config=${encodeURIComponent(configName)}`
      : `/v2/projects/${projectId}/debug/start`;
    return this.fetch<StartDebugResponse>(url, { method: 'POST' });
  }

  // ============================================================
  // V1 ENDPOINTS (kept for backward compatibility)
  // ============================================================

  async getState(): Promise<DebugState> {
    return this.fetch<DebugState>('/debug/state');
  }

  async getVariables(): Promise<VariablesResponse> {
    return this.fetch<VariablesResponse>('/debug/variables');
  }

  async getConfigurations(): Promise<ConfigurationsResponse> {
    return this.fetch<ConfigurationsResponse>('/debug/configurations');
  }

  async createConfiguration(config: CreateConfigurationRequest): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/configurations', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async deleteConfiguration(name: string): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/debug/configurations?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }

  async startDebug(configName?: string): Promise<ApiResponse> {
    const url = configName
      ? `/debug/start?config=${encodeURIComponent(configName)}`
      : '/debug/start';
    return this.fetch<ApiResponse>(url, { method: 'POST' });
  }

  async stopDebug(): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/stop', { method: 'POST' });
  }

  async stepOver(): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/step-over', { method: 'POST' });
  }

  async stepInto(): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/step-into', { method: 'POST' });
  }

  async stepOut(): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/step-out', { method: 'POST' });
  }

  async resume(): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/resume', { method: 'POST' });
  }

  async pause(): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/pause', { method: 'POST' });
  }

  async runToCursor(file: string, line: number): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(
      `/debug/run-to-cursor?file=${encodeURIComponent(file)}&line=${line}`,
      { method: 'POST' }
    );
  }

  async getBreakpoints(): Promise<BreakpointsResponse> {
    return this.fetch<BreakpointsResponse>('/debug/breakpoints');
  }

  async addBreakpoint(file: string, line: number, condition?: string): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/breakpoints', {
      method: 'POST',
      body: JSON.stringify({ file, line, condition }),
    });
  }

  async removeBreakpoint(file: string, line: number): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/breakpoints', {
      method: 'DELETE',
      body: JSON.stringify({ file, line }),
    });
  }

  async toggleBreakpoint(file: string, line: number): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/breakpoints/toggle', {
      method: 'POST',
      body: JSON.stringify({ file, line }),
    });
  }

  async clearAllBreakpoints(): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/breakpoints/all', { method: 'DELETE' });
  }

  async evaluate(expression: string): Promise<EvaluateResponse> {
    return this.fetch<EvaluateResponse>('/debug/evaluate', {
      method: 'POST',
      body: JSON.stringify({ expression }),
    });
  }

  async getFrames(): Promise<FramesResponse> {
    return this.fetch<FramesResponse>('/debug/frames');
  }

  async selectFrame(index: number): Promise<ApiResponse> {
    return this.fetch<ApiResponse>(`/debug/frames/select?index=${index}`, { method: 'POST' });
  }

  async getConsole(options: {
    lastN?: number;
    fromLine?: number;
    toLine?: number;
    filter?: string;
    type?: string;
  } = {}): Promise<ConsoleResponse> {
    const params = new URLSearchParams();
    if (options.lastN) params.set('lastN', String(options.lastN));
    if (options.fromLine) params.set('fromLine', String(options.fromLine));
    if (options.toLine) params.set('toLine', String(options.toLine));
    if (options.filter) params.set('filter', options.filter);
    if (options.type) params.set('type', options.type);
    const query = params.toString();
    return this.fetch<ConsoleResponse>(`/debug/console${query ? `?${query}` : ''}`);
  }

  async clearConsole(): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/console', { method: 'DELETE' });
  }

  async getProblems(): Promise<ProblemsResponse> {
    return this.fetch<ProblemsResponse>('/debug/problems');
  }

  async openFile(file: string, line?: number): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/open-file', {
      method: 'POST',
      body: JSON.stringify({ file, line }),
    });
  }

  async closeFile(file: string): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/close-file', {
      method: 'POST',
      body: JSON.stringify({ file }),
    });
  }

  async getOpenFiles(): Promise<OpenFilesResponse> {
    return this.fetch<OpenFilesResponse>('/debug/open-files');
  }

  async goToLine(line: number): Promise<ApiResponse> {
    return this.fetch<ApiResponse>('/debug/go-to-line', {
      method: 'POST',
      body: JSON.stringify({ line }),
    });
  }

  async expandVariable(path: string): Promise<ExpandVariableResponse> {
    return this.fetch<ExpandVariableResponse>('/debug/variables/expand', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }

  async getModules(): Promise<ModulesResponse> {
    return this.fetch<ModulesResponse>('/debug/modules');
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.fetch<unknown>('/health');
      return true;
    } catch {
      return false;
    }
  }
}
