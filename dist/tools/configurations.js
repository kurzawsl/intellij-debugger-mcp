/**
 * Configuration tools - manage run configurations
 */
import { z } from 'zod';
import { defineTool, textContent } from './types.js';
export const getConfigurationsTool = defineTool({
    name: 'debug_get_configurations',
    description: 'List available run configurations.',
    inputSchema: z.object({
        projectId: z.string().optional().describe('Project ID (auto-selected if only one open)'),
    }),
    handler: async ({ projectId }, ctx) => {
        // Try V2 API first, fall back to V1
        if (projectId) {
            const resolvedProjectId = await ctx.resolveProjectId(projectId);
            const result = await ctx.client.getProjectConfigurations(resolvedProjectId);
            if (!result.configurations || result.configurations.length === 0) {
                return textContent('No run configurations found.');
            }
            let content = '**Run Configurations**:\n';
            result.configurations.forEach((c, i) => {
                content += `${i + 1}. ${c.name} (${c.type})\n`;
            });
            return textContent(content);
        }
        // V1 fallback
        const result = await ctx.client.getConfigurations();
        if (!result.configurations || result.configurations.length === 0) {
            return textContent('No run configurations found.');
        }
        let content = '**Run Configurations**:\n';
        result.configurations.forEach((c, i) => {
            content += `${i + 1}. ${c}\n`;
        });
        return textContent(content);
    },
});
export const createJunitClassConfigTool = defineTool({
    name: 'debug_create_junit_class_config',
    description: 'Create a JUnit configuration to run ALL tests in a class.',
    inputSchema: z.object({
        projectId: z.string().optional().describe('Project ID (auto-selected if only one open)'),
        name: z.string().describe('Configuration name'),
        className: z.string().describe('Fully qualified class name (e.g., "com.example.MyTestClass")'),
        module: z.string().optional().describe('Module name (optional)'),
        vmOptions: z.string().optional().describe('JVM options (optional)'),
    }),
    handler: async ({ projectId, name, className, module, vmOptions }, ctx) => {
        const config = {
            name,
            type: 'JUNIT_CLASS',
            className,
            module,
            vmOptions,
        };
        // Use V2 API if projectId provided
        if (projectId) {
            const resolvedProjectId = await ctx.resolveProjectId(projectId);
            const result = await ctx.client.createConfigurationInProject(resolvedProjectId, config);
            return textContent(result.success ? `Created JUnit class config: ${name}` : result.message);
        }
        // V1 fallback
        const result = await ctx.client.createConfiguration(config);
        return textContent(result.success ? `Created JUnit class config: ${name}` : result.message);
    },
});
export const createJunitMethodConfigTool = defineTool({
    name: 'debug_create_junit_method_config',
    description: 'Create a JUnit configuration to run a SINGLE test method.',
    inputSchema: z.object({
        projectId: z.string().optional().describe('Project ID (auto-selected if only one open)'),
        name: z.string().describe('Configuration name'),
        className: z.string().describe('Fully qualified class name (e.g., "com.example.MyTestClass")'),
        methodName: z.string().describe('Test method name'),
        module: z.string().optional().describe('Module name (optional)'),
        vmOptions: z.string().optional().describe('JVM options (optional)'),
    }),
    handler: async ({ projectId, name, className, methodName, module, vmOptions }, ctx) => {
        const config = {
            name,
            type: 'JUNIT_METHOD',
            className,
            methodName,
            module,
            vmOptions,
        };
        // Use V2 API if projectId provided
        if (projectId) {
            const resolvedProjectId = await ctx.resolveProjectId(projectId);
            const result = await ctx.client.createConfigurationInProject(resolvedProjectId, config);
            return textContent(result.success ? `Created JUnit method config: ${name}` : result.message);
        }
        // V1 fallback
        const result = await ctx.client.createConfiguration(config);
        return textContent(result.success ? `Created JUnit method config: ${name}` : result.message);
    },
});
export const createApplicationConfigTool = defineTool({
    name: 'debug_create_application_config',
    description: 'Create a configuration to run a main application class.',
    inputSchema: z.object({
        projectId: z.string().optional().describe('Project ID (auto-selected if only one open)'),
        name: z.string().describe('Configuration name'),
        className: z.string().describe('Fully qualified main class name'),
        module: z.string().optional().describe('Module name (optional)'),
        vmOptions: z.string().optional().describe('JVM options (e.g., "-Xmx512m")'),
        programArguments: z.string().optional().describe('Program arguments'),
    }),
    handler: async ({ projectId, name, className, module, vmOptions, programArguments }, ctx) => {
        const config = {
            name,
            type: 'APPLICATION',
            className,
            module,
            vmOptions,
            programArguments,
        };
        // Use V2 API if projectId provided
        if (projectId) {
            const resolvedProjectId = await ctx.resolveProjectId(projectId);
            const result = await ctx.client.createConfigurationInProject(resolvedProjectId, config);
            return textContent(result.success ? `Created application config: ${name}` : result.message);
        }
        // V1 fallback
        const result = await ctx.client.createConfiguration(config);
        return textContent(result.success ? `Created application config: ${name}` : result.message);
    },
});
export const createSpringBootConfigTool = defineTool({
    name: 'debug_create_spring_boot_config',
    description: 'Create a Spring Boot configuration with active profiles and optional AWS credentials.',
    inputSchema: z.object({
        projectId: z.string().optional().describe('Project ID (auto-selected if only one open)'),
        name: z.string().describe('Configuration name'),
        className: z.string().describe('Main application class (e.g., "com.example.Application")'),
        activeProfiles: z.string().optional().describe('Comma-separated Spring profiles (e.g., "dev,local")'),
        awsProfile: z.string().optional().describe('AWS credential profile name'),
        awsRegion: z.string().optional().describe('AWS region (e.g., "eu-west-2")'),
        module: z.string().optional().describe('Module name (optional)'),
        vmOptions: z.string().optional().describe('JVM options (e.g., "-Xmx1g")'),
        programArguments: z.string().optional().describe('Program arguments'),
    }),
    handler: async (args, ctx) => {
        const config = {
            name: args.name,
            type: 'SPRING_BOOT',
            className: args.className,
            activeProfiles: args.activeProfiles,
            awsProfile: args.awsProfile,
            awsRegion: args.awsRegion,
            module: args.module,
            vmOptions: args.vmOptions,
            programArguments: args.programArguments,
        };
        // Use V2 API if projectId provided
        if (args.projectId) {
            const resolvedProjectId = await ctx.resolveProjectId(args.projectId);
            const result = await ctx.client.createConfigurationInProject(resolvedProjectId, config);
            return textContent(result.success ? `Created Spring Boot config: ${args.name}` : result.message);
        }
        // V1 fallback
        const result = await ctx.client.createConfiguration(config);
        return textContent(result.success ? `Created Spring Boot config: ${args.name}` : result.message);
    },
});
export const deleteConfigurationTool = defineTool({
    name: 'debug_delete_configuration',
    description: 'Delete a run configuration by name.',
    inputSchema: z.object({
        name: z.string().describe('Configuration name to delete'),
    }),
    handler: async ({ name }, ctx) => {
        const result = await ctx.client.deleteConfiguration(name);
        return textContent(result.success ? `Deleted configuration: ${name}` : result.message);
    },
});
export const getModulesTool = defineTool({
    name: 'debug_get_modules',
    description: 'List available modules in the project.',
    handler: async (_, ctx) => {
        const result = await ctx.client.getModules();
        if (!result.modules || result.modules.length === 0) {
            return textContent('No modules found.');
        }
        let content = '**Project Modules**:\n';
        result.modules.forEach((m, i) => {
            content += `${i + 1}. ${m.name || m}\n`;
        });
        return textContent(content);
    },
});
export const configurationTools = [
    getConfigurationsTool,
    createJunitClassConfigTool,
    createJunitMethodConfigTool,
    createApplicationConfigTool,
    createSpringBootConfigTool,
    deleteConfigurationTool,
    getModulesTool,
];
