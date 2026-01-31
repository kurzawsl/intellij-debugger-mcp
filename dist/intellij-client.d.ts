/**
 * REST client for IntelliJ Debug Bridge plugin
 * Supports both V1 and V2 APIs
 */
import type { DebugState, VariablesResponse, BreakpointsResponse, ApiResponse, EvaluateResponse, ConfigurationsResponse, CreateConfigurationRequest, ConsoleResponse, OpenFilesResponse, ProblemsResponse, ModulesResponse, ExpandVariableResponse, FramesResponse, ProjectsResponse, SessionsResponse, SessionDetailResponse, SessionActionResponse, StartDebugResponse, ProjectConfigurationsResponse } from './types.js';
export declare class IntelliJDebugClient {
    private baseUrl;
    private timeout;
    constructor();
    private fetch;
    /**
     * List all open IntelliJ projects
     */
    getProjects(): Promise<ProjectsResponse>;
    /**
     * List all active debug sessions
     * @param projectId - Optional filter by project
     */
    getSessions(projectId?: string): Promise<SessionsResponse>;
    /**
     * Get detailed session information including stack trace
     */
    getSessionDetails(sessionId: string): Promise<SessionDetailResponse>;
    /**
     * Get variables for a specific session
     */
    getVariablesForSession(sessionId: string): Promise<VariablesResponse>;
    /**
     * Step over in a specific session
     */
    stepOverSession(sessionId: string): Promise<SessionActionResponse>;
    /**
     * Step into in a specific session
     */
    stepIntoSession(sessionId: string): Promise<SessionActionResponse>;
    /**
     * Step out in a specific session
     */
    stepOutSession(sessionId: string): Promise<SessionActionResponse>;
    /**
     * Resume a specific session
     */
    resumeSession(sessionId: string): Promise<SessionActionResponse>;
    /**
     * Pause a specific session
     */
    pauseSession(sessionId: string): Promise<SessionActionResponse>;
    /**
     * Stop a specific session
     */
    stopSession(sessionId: string): Promise<SessionActionResponse>;
    /**
     * Evaluate expression in a specific session
     */
    evaluateInSession(sessionId: string, expression: string): Promise<EvaluateResponse>;
    /**
     * Get project details
     */
    getProjectDetails(projectId: string): Promise<ProjectsResponse>;
    /**
     * Get run configurations for a project
     */
    getProjectConfigurations(projectId: string): Promise<ProjectConfigurationsResponse>;
    /**
     * Get breakpoints for a project
     */
    getProjectBreakpoints(projectId: string): Promise<BreakpointsResponse>;
    /**
     * Create a run configuration in a specific project (V2 API)
     */
    createConfigurationInProject(projectId: string, config: CreateConfigurationRequest): Promise<ApiResponse>;
    /**
     * Add breakpoint to a project
     */
    addBreakpointToProject(projectId: string, file: string, line: number, condition?: string): Promise<ApiResponse>;
    /**
     * Remove breakpoint from a project
     */
    removeBreakpointFromProject(projectId: string, file: string, line: number): Promise<ApiResponse>;
    /**
     * Start debugging in a specific project
     */
    startDebugInProject(projectId: string, configName?: string): Promise<StartDebugResponse>;
    getState(): Promise<DebugState>;
    getVariables(): Promise<VariablesResponse>;
    getConfigurations(): Promise<ConfigurationsResponse>;
    createConfiguration(config: CreateConfigurationRequest): Promise<ApiResponse>;
    deleteConfiguration(name: string): Promise<ApiResponse>;
    startDebug(configName?: string): Promise<ApiResponse>;
    stopDebug(): Promise<ApiResponse>;
    stepOver(): Promise<ApiResponse>;
    stepInto(): Promise<ApiResponse>;
    stepOut(): Promise<ApiResponse>;
    resume(): Promise<ApiResponse>;
    pause(): Promise<ApiResponse>;
    runToCursor(file: string, line: number): Promise<ApiResponse>;
    getBreakpoints(): Promise<BreakpointsResponse>;
    addBreakpoint(file: string, line: number, condition?: string): Promise<ApiResponse>;
    removeBreakpoint(file: string, line: number): Promise<ApiResponse>;
    toggleBreakpoint(file: string, line: number): Promise<ApiResponse>;
    clearAllBreakpoints(): Promise<ApiResponse>;
    evaluate(expression: string): Promise<EvaluateResponse>;
    getFrames(): Promise<FramesResponse>;
    selectFrame(index: number): Promise<ApiResponse>;
    getConsole(options?: {
        lastN?: number;
        fromLine?: number;
        toLine?: number;
        filter?: string;
        type?: string;
    }): Promise<ConsoleResponse>;
    clearConsole(): Promise<ApiResponse>;
    getProblems(): Promise<ProblemsResponse>;
    openFile(file: string, line?: number): Promise<ApiResponse>;
    closeFile(file: string): Promise<ApiResponse>;
    getOpenFiles(): Promise<OpenFilesResponse>;
    goToLine(line: number): Promise<ApiResponse>;
    expandVariable(path: string): Promise<ExpandVariableResponse>;
    getModules(): Promise<ModulesResponse>;
    checkHealth(): Promise<boolean>;
}
