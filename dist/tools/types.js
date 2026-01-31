/**
 * Tool definition types for MCP server
 */
/**
 * Create a typed tool definition.
 * Returns RegisterableTool for array compatibility while
 * maintaining type safety at the definition site.
 */
export function defineTool(definition) {
    // Cast is safe: handler accepts TInput which is more specific than unknown
    // The runtime behavior is identical, we're just widening the type for registration
    return definition;
}
/**
 * Helper to create text content response
 */
export function textContent(text) {
    return {
        content: [{ type: 'text', text }],
    };
}
/**
 * Helper to create error response
 */
export function errorContent(message) {
    return {
        content: [{ type: 'text', text: message }],
        isError: true,
    };
}
