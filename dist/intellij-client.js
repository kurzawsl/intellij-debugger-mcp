/**
 * REST client for IntelliJ Debug Bridge plugin
 * Supports both V1 and V2 APIs
 */
const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 19999;
const DEFAULT_TIMEOUT = 5000;
export class IntelliJDebugClient {
    baseUrl;
    timeout;
    constructor() {
        const host = process.env.INTELLIJ_DEBUG_HOST || DEFAULT_HOST;
        const port = process.env.INTELLIJ_DEBUG_PORT || DEFAULT_PORT;
        this.baseUrl = `http://${host}:${port}`;
        this.timeout = parseInt(process.env.DEBUG_TIMEOUT || String(DEFAULT_TIMEOUT));
    }
    async fetch(path, options = {}) {
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
            return await response.json();
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout - Debug Bridge plugin may not be running');
                }
                const cause = error.cause;
                if (cause?.code === 'ECONNREFUSED') {
                    throw new Error('Cannot connect to Debug Bridge plugin. Make sure IntelliJ is running with the plugin installed.');
                }
            }
            throw error;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    // ============================================================
    // V2 DISCOVERY ENDPOINTS
    // ============================================================
    /**
     * List all open IntelliJ projects
     */
    async getProjects() {
        return this.fetch('/v2/projects');
    }
    /**
     * List all active debug sessions
     * @param projectId - Optional filter by project
     */
    async getSessions(projectId) {
        if (projectId) {
            return this.fetch(`/v2/projects/${projectId}/sessions`);
        }
        return this.fetch('/v2/sessions');
    }
    // ============================================================
    // V2 SESSION-SCOPED ENDPOINTS
    // ============================================================
    /**
     * Get detailed session information including stack trace
     */
    async getSessionDetails(sessionId) {
        return this.fetch(`/v2/sessions/${sessionId}`);
    }
    /**
     * Get variables for a specific session
     */
    async getVariablesForSession(sessionId) {
        return this.fetch(`/v2/sessions/${sessionId}/variables`);
    }
    /**
     * Step over in a specific session
     */
    async stepOverSession(sessionId) {
        return this.fetch(`/v2/sessions/${sessionId}/step-over`, {
            method: 'POST',
        });
    }
    /**
     * Step into in a specific session
     */
    async stepIntoSession(sessionId) {
        return this.fetch(`/v2/sessions/${sessionId}/step-into`, {
            method: 'POST',
        });
    }
    /**
     * Step out in a specific session
     */
    async stepOutSession(sessionId) {
        return this.fetch(`/v2/sessions/${sessionId}/step-out`, {
            method: 'POST',
        });
    }
    /**
     * Resume a specific session
     */
    async resumeSession(sessionId) {
        return this.fetch(`/v2/sessions/${sessionId}/resume`, {
            method: 'POST',
        });
    }
    /**
     * Pause a specific session
     */
    async pauseSession(sessionId) {
        return this.fetch(`/v2/sessions/${sessionId}/pause`, {
            method: 'POST',
        });
    }
    /**
     * Stop a specific session
     */
    async stopSession(sessionId) {
        return this.fetch(`/v2/sessions/${sessionId}`, {
            method: 'DELETE',
        });
    }
    /**
     * Evaluate expression in a specific session
     */
    async evaluateInSession(sessionId, expression) {
        return this.fetch(`/v2/sessions/${sessionId}/evaluate`, {
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
    async getProjectDetails(projectId) {
        return this.fetch(`/v2/projects/${projectId}`);
    }
    /**
     * Get run configurations for a project
     */
    async getProjectConfigurations(projectId) {
        return this.fetch(`/v2/projects/${projectId}/configurations`);
    }
    /**
     * Get breakpoints for a project
     */
    async getProjectBreakpoints(projectId) {
        return this.fetch(`/v2/projects/${projectId}/breakpoints`);
    }
    /**
     * Create a run configuration in a specific project (V2 API)
     */
    async createConfigurationInProject(projectId, config) {
        return this.fetch(`/v2/projects/${projectId}/configurations`, {
            method: 'POST',
            body: JSON.stringify(config),
        });
    }
    /**
     * Add breakpoint to a project
     */
    async addBreakpointToProject(projectId, file, line, condition) {
        return this.fetch(`/v2/projects/${projectId}/breakpoints`, {
            method: 'POST',
            body: JSON.stringify({ file, line, condition }),
        });
    }
    /**
     * Remove breakpoint from a project
     */
    async removeBreakpointFromProject(projectId, file, line) {
        return this.fetch(`/v2/projects/${projectId}/breakpoints`, {
            method: 'DELETE',
            body: JSON.stringify({ file, line }),
        });
    }
    /**
     * Start debugging in a specific project
     */
    async startDebugInProject(projectId, configName) {
        const url = configName
            ? `/v2/projects/${projectId}/debug/start?config=${encodeURIComponent(configName)}`
            : `/v2/projects/${projectId}/debug/start`;
        return this.fetch(url, { method: 'POST' });
    }
    // ============================================================
    // V1 ENDPOINTS (kept for backward compatibility)
    // ============================================================
    async getState() {
        return this.fetch('/debug/state');
    }
    async getVariables() {
        return this.fetch('/debug/variables');
    }
    async getConfigurations() {
        return this.fetch('/debug/configurations');
    }
    async createConfiguration(config) {
        return this.fetch('/debug/configurations', {
            method: 'POST',
            body: JSON.stringify(config),
        });
    }
    async deleteConfiguration(name) {
        return this.fetch(`/debug/configurations?name=${encodeURIComponent(name)}`, {
            method: 'DELETE',
        });
    }
    async startDebug(configName) {
        const url = configName
            ? `/debug/start?config=${encodeURIComponent(configName)}`
            : '/debug/start';
        return this.fetch(url, { method: 'POST' });
    }
    async stopDebug() {
        return this.fetch('/debug/stop', { method: 'POST' });
    }
    async stepOver() {
        return this.fetch('/debug/step-over', { method: 'POST' });
    }
    async stepInto() {
        return this.fetch('/debug/step-into', { method: 'POST' });
    }
    async stepOut() {
        return this.fetch('/debug/step-out', { method: 'POST' });
    }
    async resume() {
        return this.fetch('/debug/resume', { method: 'POST' });
    }
    async pause() {
        return this.fetch('/debug/pause', { method: 'POST' });
    }
    async runToCursor(file, line) {
        return this.fetch(`/debug/run-to-cursor?file=${encodeURIComponent(file)}&line=${line}`, { method: 'POST' });
    }
    async getBreakpoints() {
        return this.fetch('/debug/breakpoints');
    }
    async addBreakpoint(file, line, condition) {
        return this.fetch('/debug/breakpoints', {
            method: 'POST',
            body: JSON.stringify({ file, line, condition }),
        });
    }
    async removeBreakpoint(file, line) {
        return this.fetch('/debug/breakpoints', {
            method: 'DELETE',
            body: JSON.stringify({ file, line }),
        });
    }
    async toggleBreakpoint(file, line) {
        return this.fetch('/debug/breakpoints/toggle', {
            method: 'POST',
            body: JSON.stringify({ file, line }),
        });
    }
    async clearAllBreakpoints() {
        return this.fetch('/debug/breakpoints/all', { method: 'DELETE' });
    }
    async evaluate(expression) {
        return this.fetch('/debug/evaluate', {
            method: 'POST',
            body: JSON.stringify({ expression }),
        });
    }
    async getFrames() {
        return this.fetch('/debug/frames');
    }
    async selectFrame(index) {
        return this.fetch(`/debug/frames/select?index=${index}`, { method: 'POST' });
    }
    async getConsole(options = {}) {
        const params = new URLSearchParams();
        if (options.lastN)
            params.set('lastN', String(options.lastN));
        if (options.fromLine)
            params.set('fromLine', String(options.fromLine));
        if (options.toLine)
            params.set('toLine', String(options.toLine));
        if (options.filter)
            params.set('filter', options.filter);
        if (options.type)
            params.set('type', options.type);
        const query = params.toString();
        return this.fetch(`/debug/console${query ? `?${query}` : ''}`);
    }
    async clearConsole() {
        return this.fetch('/debug/console', { method: 'DELETE' });
    }
    async getProblems() {
        return this.fetch('/debug/problems');
    }
    async openFile(file, line) {
        return this.fetch('/debug/open-file', {
            method: 'POST',
            body: JSON.stringify({ file, line }),
        });
    }
    async closeFile(file) {
        return this.fetch('/debug/close-file', {
            method: 'POST',
            body: JSON.stringify({ file }),
        });
    }
    async getOpenFiles() {
        return this.fetch('/debug/open-files');
    }
    async goToLine(line) {
        return this.fetch('/debug/go-to-line', {
            method: 'POST',
            body: JSON.stringify({ line }),
        });
    }
    async expandVariable(path) {
        return this.fetch('/debug/variables/expand', {
            method: 'POST',
            body: JSON.stringify({ path }),
        });
    }
    async getModules() {
        return this.fetch('/debug/modules');
    }
    async checkHealth() {
        try {
            await this.fetch('/health');
            return true;
        }
        catch {
            return false;
        }
    }
}
