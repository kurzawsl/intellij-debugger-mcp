/**
 * Types for IntelliJ Debug Bridge API responses
 * Supports both V1 and V2 APIs
 */

// ============================================================
// COMMON TYPES
// ============================================================

export type DebugStatus = 'NO_SESSION' | 'RUNNING' | 'SUSPENDED' | 'TERMINATED';

export interface DebugLocation {
  file: string;
  filePath: string;
  line: number;
  method: string | null;
  className: string | null;
}

export interface StackFrame {
  index: number;
  method: string;
  file: string;
  line: number;
  className: string | null;
}

export interface VariableInfo {
  name: string;
  type: string;
  value: string;
  hasChildren: boolean;
}

export interface BreakpointInfo {
  file: string;
  line: number;
  enabled: boolean;
  condition: string | null;
}

// ============================================================
// V1 RESPONSE TYPES (backward compatible)
// ============================================================

export interface DebugState {
  status: DebugStatus;
  sessionName: string | null;
  location: DebugLocation | null;
  stackTrace: StackFrame[];
  activeBreakpoint: unknown | null;
}

export interface VariablesResponse {
  locals: VariableInfo[];
  thisObject: {
    type: string;
    fields: VariableInfo[];
  } | null;
}

export interface BreakpointsResponse {
  breakpoints: BreakpointInfo[];
}

export interface ApiResponse {
  success: boolean;
  message: string;
  state?: DebugState;
}

export interface EvaluateResponse {
  result: string;
  type: string;
  error: string | null;
}

export interface ConfigurationsResponse {
  configurations: string[];
}

// ============================================================
// V2 PROJECT TYPES
// ============================================================

export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  isDefault?: boolean;
  sessionCount?: number;
}

export interface ProjectsResponse {
  projects: ProjectInfo[];
}

export interface ProjectConfigurationsResponse {
  configurations: Array<{
    name: string;
    type: string;
  }>;
}

// ============================================================
// V2 SESSION TYPES
// ============================================================

export interface SessionInfo {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  status: DebugStatus;
  location?: DebugLocation;
}

export interface SessionsResponse {
  sessions: SessionInfo[];
}

export interface SessionDetailResponse extends SessionInfo {
  stackTrace?: StackFrame[];
}

export interface SessionActionResponse {
  success: boolean;
  message: string;
  sessionId: string;
  session?: SessionDetailResponse;
}

export interface StartDebugResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  projectId: string;
}

// ============================================================
// V2 ERROR TYPES
// ============================================================

export interface V2ErrorResponse {
  error: string;
  message: string;
  availableSessions?: SessionInfo[];
  availableProjects?: ProjectInfo[];
}

// ============================================================
// CONFIGURATION TYPES
// ============================================================

export type ConfigurationType =
  | 'JUNIT_CLASS'
  | 'JUNIT_METHOD'
  | 'APPLICATION'
  | 'SPRING_BOOT';

export interface CreateConfigurationRequest {
  name: string;
  type: ConfigurationType;
  className: string;
  methodName?: string;
  module?: string;
  vmOptions?: string;
  programArguments?: string;
  activeProfiles?: string;
  awsProfile?: string;
  awsRegion?: string;
}

// ============================================================
// CONSOLE TYPES
// ============================================================

export interface ConsoleLine {
  text: string;
  type: 'STDOUT' | 'STDERR' | 'SYSTEM';
}

export interface ConsoleResponse {
  lines: ConsoleLine[];
  totalLines: number;
}

// ============================================================
// FILE TYPES
// ============================================================

export interface OpenFileInfo {
  name: string;
  path?: string;
}

export interface OpenFilesResponse {
  files: OpenFileInfo[];
}

// ============================================================
// PROBLEMS TYPES
// ============================================================

export interface ProblemInfo {
  file: string;
  line: number;
  message: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
}

export interface ProblemsResponse {
  problems: ProblemInfo[];
}

// ============================================================
// MODULES TYPES
// ============================================================

export interface ModuleInfo {
  name: string;
}

export interface ModulesResponse {
  modules: ModuleInfo[];
}

// ============================================================
// VARIABLE EXPANSION
// ============================================================

export interface ExpandVariableResponse {
  children: VariableInfo[];
}

// ============================================================
// FRAMES
// ============================================================

export interface FramesResponse {
  frames: StackFrame[];
}
