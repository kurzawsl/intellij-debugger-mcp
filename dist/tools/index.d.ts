/**
 * Tool Registry - exports all tools for registration
 */
import type { RegisterableTool } from './types.js';
/**
 * All tools organized by category
 */
export declare const toolsByCategory: {
    discovery: RegisterableTool[];
    state: RegisterableTool[];
    control: RegisterableTool[];
    breakpoints: RegisterableTool[];
    evaluate: RegisterableTool[];
    console: RegisterableTool[];
    files: RegisterableTool[];
    configurations: RegisterableTool[];
    lifecycle: RegisterableTool[];
};
/**
 * All tools flattened into a single array for registration.
 * Total: 41 tools
 *
 * RegisterableTool type maintains structure for registration while
 * type safety is enforced at defineTool() call site.
 */
export declare const allTools: RegisterableTool[];
export * from './types.js';
