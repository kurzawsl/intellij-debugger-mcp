/**
 * Response formatting utilities
 */
import type { DebugState, DebugLocation, StackFrame, VariablesResponse, BreakpointsResponse, SessionInfo, ProjectInfo, SessionDetailResponse, SessionActionResponse } from '../types.js';
/**
 * Format debug state for display
 */
export declare function formatDebugState(state: DebugState, sessionId?: string): string;
/**
 * Format location for display
 */
export declare function formatLocation(location: DebugLocation): string;
/**
 * Format stack trace for display
 */
export declare function formatStackTrace(frames: StackFrame[], limit?: number): string;
/**
 * Format variables for display
 */
export declare function formatVariables(vars: VariablesResponse, sessionId?: string): string;
/**
 * Format breakpoints for display
 */
export declare function formatBreakpoints(response: BreakpointsResponse, projectId?: string): string;
/**
 * Format sessions list for display
 */
export declare function formatSessionsList(sessions: SessionInfo[]): string;
/**
 * Format projects list for display
 */
export declare function formatProjectsList(projects: ProjectInfo[]): string;
/**
 * Format step result for display
 */
export declare function formatStepResult(result: SessionActionResponse, action: string): string;
/**
 * Format session detail for display
 */
export declare function formatSessionDetail(session: SessionDetailResponse): string;
