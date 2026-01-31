/**
 * Tool Registry - exports all tools for registration
 */
// Import all tool modules
import { discoveryTools } from './discovery.js';
import { stateTools } from './state.js';
import { controlTools } from './control.js';
import { breakpointTools } from './breakpoints.js';
import { evaluateTools } from './evaluate.js';
import { consoleTools } from './console.js';
import { fileTools } from './files.js';
import { configurationTools } from './configurations.js';
import { lifecycleTools } from './lifecycle.js';
/**
 * All tools organized by category
 */
export const toolsByCategory = {
    discovery: discoveryTools, // 2 tools: list_projects, list_sessions
    state: stateTools, // 3 tools: get_state, get_variables, get_frames
    control: controlTools, // 5 tools: step_over, step_into, step_out, resume, pause
    breakpoints: breakpointTools, // 6 tools: list, set, set_batch, remove, clear, toggle
    evaluate: evaluateTools, // 4 tools: evaluate, expand_variable, select_frame, run_to_cursor
    console: consoleTools, // 2 tools: get_console, clear_console
    files: fileTools, // 5 tools: open_file, close_file, get_open_files, go_to_line, get_problems
    configurations: configurationTools, // 7 tools: get, create_junit_class/method, create_app, create_spring, delete, get_modules
    lifecycle: lifecycleTools, // 7 tools: health_check, start_intellij, kill_intellij, start, stop, start_in_project, stop_session
};
/**
 * All tools flattened into a single array for registration.
 * Total: 41 tools
 *
 * RegisterableTool type maintains structure for registration while
 * type safety is enforced at defineTool() call site.
 */
export const allTools = [
    ...discoveryTools,
    ...stateTools,
    ...controlTools,
    ...breakpointTools,
    ...evaluateTools,
    ...consoleTools,
    ...fileTools,
    ...configurationTools,
    ...lifecycleTools,
];
// Re-export types and helpers
export * from './types.js';
