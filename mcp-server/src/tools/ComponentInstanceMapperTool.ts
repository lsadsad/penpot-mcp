import { z } from "zod";
import { Tool } from "../Tool";
import { TextResponse, ToolResponse } from "../ToolResponse";
import "reflect-metadata";
import { PenpotMcpServer } from "../PenpotMcpServer";
import { ExecuteCodePluginTask } from "../tasks/ExecuteCodePluginTask";

/**
 * Arguments schema for ComponentInstanceMapperTool
 */
export class ComponentInstanceMapperArgs {
    static schema = {
        operation: z
            .enum([
                "getInstances",
                "getInstanceSource",
                "getDependencies",
                "findOrphaned",
                "findUnlinked",
                "generateReport",
            ])
            .describe(
                "Operation to perform:\n" +
                    "- 'getInstances': Find all instances of a specific component across pages\n" +
                    "- 'getInstanceSource': Identify which component a shape instance comes from\n" +
                    "- 'getDependencies': Generate full dependency graph of all components\n" +
                    "- 'findOrphaned': Find components with no instances (unused)\n" +
                    "- 'findUnlinked': Find instances that lost their component link\n" +
                    "- 'generateReport': Generate comprehensive usage report"
            ),

        componentId: z
            .string()
            .optional()
            .describe(
                "Component ID (required for 'getInstances', optional for 'generateReport' to focus on specific component)"
            ),

        shapeId: z
            .string()
            .optional()
            .describe("Shape ID to check (required for 'getInstanceSource')"),

        includeAllPages: z
            .boolean()
            .optional()
            .default(true)
            .describe("Whether to search across all pages or just the current page (default: true)"),

        outputFormat: z
            .enum(["json", "mermaid"])
            .optional()
            .default("json")
            .describe("Output format for 'getDependencies': 'json' (default) or 'mermaid' diagram"),
    };

    operation!:
        | "getInstances"
        | "getInstanceSource"
        | "getDependencies"
        | "findOrphaned"
        | "findUnlinked"
        | "generateReport";
    componentId?: string;
    shapeId?: string;
    includeAllPages?: boolean;
    outputFormat?: "json" | "mermaid";
}

/**
 * Tool for tracking relationships between component instances and their main components.
 *
 * Provides operations to map component usage, find dependencies, identify orphaned
 * or unlinked components, and generate comprehensive usage reports for design system
 * governance.
 */
export class ComponentInstanceMapperTool extends Tool<ComponentInstanceMapperArgs> {
    constructor(mcpServer: PenpotMcpServer) {
        super(mcpServer, ComponentInstanceMapperArgs.schema);
    }

    public getToolName(): string {
        return "component_instance_mapper";
    }

    public getToolDescription(): string {
        return (
            "Track relationships between component instances and their main components. " +
            "Essential for design system governance and understanding component usage.\n\n" +
            "Operations:\n" +
            "- 'getInstances': Find all instances of a component across pages. Requires 'componentId'.\n" +
            "- 'getInstanceSource': Identify which component a shape instance comes from. Requires 'shapeId'.\n" +
            "- 'getDependencies': Generate full dependency graph of all components. Supports 'mermaid' output format.\n" +
            "- 'findOrphaned': List components with no instances (unused components).\n" +
            "- 'findUnlinked': Find instances that appear to have lost their component link.\n" +
            "- 'generateReport': Generate comprehensive usage statistics. Optional 'componentId' for focused report."
        );
    }

    protected async executeCore(args: ComponentInstanceMapperArgs): Promise<ToolResponse> {
        switch (args.operation) {
            case "getInstances":
                return this.getComponentInstances(args);
            case "getInstanceSource":
                return this.getInstanceSource(args);
            case "getDependencies":
                return this.getComponentDependencies(args);
            case "findOrphaned":
                return this.findOrphanedComponents(args);
            case "findUnlinked":
                return this.findUnlinkedInstances(args);
            case "generateReport":
                return this.generateUsageReport(args);
            default:
                return new TextResponse(`Unknown operation: ${args.operation}`);
        }
    }

    /**
     * Find all instances of a specific component across pages.
     */
    private async getComponentInstances(args: ComponentInstanceMapperArgs): Promise<ToolResponse> {
        if (!args.componentId) {
            return new TextResponse("Error: 'componentId' is required for 'getInstances' operation");
        }

        const includeAllPages = args.includeAllPages !== false;

        const code = `
const componentId = ${JSON.stringify(args.componentId)};
const includeAllPages = ${includeAllPages};

// First, verify the component exists
const lib = penpot.library.local;
const targetComponent = lib.components.find(c => c.id === componentId);

if (!targetComponent) {
    throw new Error('Component not found: ' + componentId);
}

const instances = [];
const pages = includeAllPages ? penpot.currentFile.pages : [penpot.currentPage];

for (const page of pages) {
    const shapes = page.findShapes();
    
    for (const shape of shapes) {
        if (shape.isComponentInstance && shape.isComponentInstance()) {
            const comp = shape.component ? shape.component() : null;
            if (comp && comp.id === componentId) {
                instances.push({
                    shapeId: shape.id,
                    shapeName: shape.name,
                    pageId: page.id,
                    pageName: page.name,
                    isMainInstance: shape.isComponentMainInstance ? shape.isComponentMainInstance() : false,
                    isCopyInstance: shape.isComponentCopyInstance ? shape.isComponentCopyInstance() : false,
                    position: { x: shape.x, y: shape.y },
                    dimensions: { width: shape.width, height: shape.height },
                    parentId: shape.parent ? shape.parent.id : null
                });
            }
        }
    }
}

return {
    componentId: componentId,
    componentName: targetComponent.name,
    componentPath: targetComponent.path,
    totalInstances: instances.length,
    pagesSearched: pages.length,
    instances: instances,
    summary: {
        mainInstances: instances.filter(i => i.isMainInstance).length,
        copyInstances: instances.filter(i => i.isCopyInstance).length,
        pagesWithInstances: [...new Set(instances.map(i => i.pageId))].length
    }
};
`;

        return this.executePluginCode(code);
    }

    /**
     * Identify which component a shape instance comes from.
     */
    private async getInstanceSource(args: ComponentInstanceMapperArgs): Promise<ToolResponse> {
        if (!args.shapeId) {
            return new TextResponse("Error: 'shapeId' is required for 'getInstanceSource' operation");
        }

        const code = `
const shapeId = ${JSON.stringify(args.shapeId)};

// Search for shape across all pages
let shape = null;
let foundPage = null;

for (const page of penpot.currentFile.pages) {
    const found = page.getShapeById(shapeId);
    if (found) {
        shape = found;
        foundPage = page;
        break;
    }
}

if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
}

// Check if it's a component instance
const isInstance = shape.isComponentInstance ? shape.isComponentInstance() : false;

if (!isInstance) {
    return {
        shapeId: shapeId,
        shapeName: shape.name,
        pageId: foundPage.id,
        pageName: foundPage.name,
        isComponentInstance: false,
        message: 'This shape is not a component instance'
    };
}

// Get component information
const component = shape.component ? shape.component() : null;
const componentRoot = shape.componentRoot ? shape.componentRoot() : null;
const componentHead = shape.componentHead ? shape.componentHead() : null;
const refShape = shape.componentRefShape ? shape.componentRefShape() : null;

return {
    shapeId: shapeId,
    shapeName: shape.name,
    shapeType: shape.type,
    pageId: foundPage.id,
    pageName: foundPage.name,
    isComponentInstance: true,
    isMainInstance: shape.isComponentMainInstance ? shape.isComponentMainInstance() : false,
    isCopyInstance: shape.isComponentCopyInstance ? shape.isComponentCopyInstance() : false,
    isComponentRoot: shape.isComponentRoot ? shape.isComponentRoot() : false,
    isComponentHead: shape.isComponentHead ? shape.isComponentHead() : false,
    component: component ? {
        id: component.id,
        name: component.name,
        path: component.path,
        libraryId: component.libraryId
    } : null,
    componentRoot: componentRoot ? {
        id: componentRoot.id,
        name: componentRoot.name
    } : null,
    componentHead: componentHead ? {
        id: componentHead.id,
        name: componentHead.name
    } : null,
    referenceShape: refShape ? {
        id: refShape.id,
        name: refShape.name,
        note: 'The equivalent shape in the main component instance'
    } : null
};
`;

        return this.executePluginCode(code);
    }

    /**
     * Generate full dependency graph of all components.
     */
    private async getComponentDependencies(args: ComponentInstanceMapperArgs): Promise<ToolResponse> {
        const outputFormat = args.outputFormat || "json";
        const includeAllPages = args.includeAllPages !== false;

        const code = `
const includeAllPages = ${includeAllPages};
const outputFormat = ${JSON.stringify(outputFormat)};

const lib = penpot.library.local;
const components = lib.components;
const pages = includeAllPages ? penpot.currentFile.pages : [penpot.currentPage];

// Build component usage map
const componentUsage = new Map();

// Initialize all components
for (const comp of components) {
    componentUsage.set(comp.id, {
        id: comp.id,
        name: comp.name,
        path: comp.path,
        instances: [],
        usedByComponents: new Set(), // Components that contain this component's instances
        usesComponents: new Set() // Components that this component uses
    });
}

// Scan all shapes to build relationships
for (const page of pages) {
    const shapes = page.findShapes();
    
    for (const shape of shapes) {
        if (shape.isComponentInstance && shape.isComponentInstance()) {
            const comp = shape.component ? shape.component() : null;
            if (comp && componentUsage.has(comp.id)) {
                const usage = componentUsage.get(comp.id);
                usage.instances.push({
                    shapeId: shape.id,
                    pageId: page.id,
                    pageName: page.name
                });
                
                // Check if this instance is inside another component
                const parentComponent = shape.componentHead ? shape.componentHead() : null;
                if (parentComponent && parentComponent.isComponentInstance && parentComponent.isComponentInstance()) {
                    const parentComp = parentComponent.component ? parentComponent.component() : null;
                    if (parentComp && parentComp.id !== comp.id) {
                        // This component is used by the parent component
                        usage.usedByComponents.add(parentComp.id);
                        
                        // The parent component uses this component
                        if (componentUsage.has(parentComp.id)) {
                            componentUsage.get(parentComp.id).usesComponents.add(comp.id);
                        }
                    }
                }
            }
        }
    }
}

// Convert to serializable format
const graph = {
    nodes: [],
    edges: []
};

for (const [id, data] of componentUsage) {
    graph.nodes.push({
        id: id,
        name: data.name,
        path: data.path,
        instanceCount: data.instances.length,
        usedByCount: data.usedByComponents.size,
        usesCount: data.usesComponents.size
    });
    
    // Add edges for "uses" relationships
    for (const usedId of data.usesComponents) {
        graph.edges.push({
            from: id,
            to: usedId,
            type: 'uses'
        });
    }
}

// Sort nodes by instance count
graph.nodes.sort((a, b) => b.instanceCount - a.instanceCount);

if (outputFormat === 'mermaid') {
    // Generate Mermaid diagram
    let mermaid = 'graph TD\\n';
    
    // Add nodes with instance counts
    for (const node of graph.nodes) {
        const label = node.name.replace(/[^a-zA-Z0-9]/g, '_');
        const displayName = node.name + ' (' + node.instanceCount + ')';
        mermaid += '    ' + label + '["' + displayName + '"]\\n';
    }
    
    // Add edges
    for (const edge of graph.edges) {
        const fromNode = graph.nodes.find(n => n.id === edge.from);
        const toNode = graph.nodes.find(n => n.id === edge.to);
        if (fromNode && toNode) {
            const fromLabel = fromNode.name.replace(/[^a-zA-Z0-9]/g, '_');
            const toLabel = toNode.name.replace(/[^a-zA-Z0-9]/g, '_');
            mermaid += '    ' + fromLabel + ' --> ' + toLabel + '\\n';
        }
    }
    
    return {
        format: 'mermaid',
        diagram: mermaid,
        summary: {
            totalComponents: graph.nodes.length,
            totalRelationships: graph.edges.length,
            pagesScanned: pages.length
        }
    };
}

return {
    format: 'json',
    graph: graph,
    summary: {
        totalComponents: graph.nodes.length,
        totalRelationships: graph.edges.length,
        pagesScanned: pages.length,
        mostUsed: graph.nodes.slice(0, 5).map(n => ({ name: n.name, instances: n.instanceCount }))
    }
};
`;

        return this.executePluginCode(code);
    }

    /**
     * Find components with no instances (unused/orphaned components).
     */
    private async findOrphanedComponents(args: ComponentInstanceMapperArgs): Promise<ToolResponse> {
        const includeAllPages = args.includeAllPages !== false;

        const code = `
const includeAllPages = ${includeAllPages};

const lib = penpot.library.local;
const components = lib.components;
const pages = includeAllPages ? penpot.currentFile.pages : [penpot.currentPage];

// Track which components have instances
const componentInstanceCounts = new Map();

// Initialize all components with 0 count
for (const comp of components) {
    componentInstanceCounts.set(comp.id, {
        id: comp.id,
        name: comp.name,
        path: comp.path,
        count: 0
    });
}

// Count instances for each component
for (const page of pages) {
    const shapes = page.findShapes();
    
    for (const shape of shapes) {
        if (shape.isComponentInstance && shape.isComponentInstance()) {
            const comp = shape.component ? shape.component() : null;
            if (comp && componentInstanceCounts.has(comp.id)) {
                componentInstanceCounts.get(comp.id).count++;
            }
        }
    }
}

// Find orphaned (unused) components
const orphaned = [];
const used = [];

for (const [id, data] of componentInstanceCounts) {
    if (data.count === 0) {
        orphaned.push({
            id: data.id,
            name: data.name,
            path: data.path
        });
    } else {
        used.push({
            id: data.id,
            name: data.name,
            path: data.path,
            instanceCount: data.count
        });
    }
}

// Sort orphaned by name
orphaned.sort((a, b) => a.name.localeCompare(b.name));

return {
    orphanedComponents: orphaned,
    usedComponents: used,
    summary: {
        totalComponents: components.length,
        orphanedCount: orphaned.length,
        usedCount: used.length,
        orphanedPercentage: components.length > 0 
            ? Math.round((orphaned.length / components.length) * 100) 
            : 0,
        pagesScanned: pages.length
    },
    recommendations: orphaned.length > 0 
        ? 'Consider reviewing the ' + orphaned.length + ' unused component(s) for potential cleanup or archival.'
        : 'All components are in use. Design system is well-maintained!'
};
`;

        return this.executePluginCode(code);
    }

    /**
     * Find instances that appear to have lost their component link.
     */
    private async findUnlinkedInstances(args: ComponentInstanceMapperArgs): Promise<ToolResponse> {
        const includeAllPages = args.includeAllPages !== false;

        const code = `
const includeAllPages = ${includeAllPages};

const lib = penpot.library.local;
const componentIds = new Set(lib.components.map(c => c.id));
const pages = includeAllPages ? penpot.currentFile.pages : [penpot.currentPage];

const unlinkedInstances = [];
const validInstances = [];
const potentialIssues = [];

for (const page of pages) {
    const shapes = page.findShapes();
    
    for (const shape of shapes) {
        // Check if shape claims to be a component instance
        const isInstance = shape.isComponentInstance ? shape.isComponentInstance() : false;
        
        if (isInstance) {
            const comp = shape.component ? shape.component() : null;
            
            if (!comp) {
                // Instance with no component reference - potentially broken
                unlinkedInstances.push({
                    shapeId: shape.id,
                    shapeName: shape.name,
                    shapeType: shape.type,
                    pageId: page.id,
                    pageName: page.name,
                    issue: 'Component reference is null',
                    position: { x: shape.x, y: shape.y }
                });
            } else if (!componentIds.has(comp.id)) {
                // Instance references a component not in local library
                // This could be from a linked library (valid) or a deleted component (issue)
                potentialIssues.push({
                    shapeId: shape.id,
                    shapeName: shape.name,
                    pageId: page.id,
                    pageName: page.name,
                    componentId: comp.id,
                    componentName: comp.name,
                    libraryId: comp.libraryId,
                    issue: 'Component not found in local library (may be from linked library)',
                    position: { x: shape.x, y: shape.y }
                });
            } else {
                validInstances.push({
                    shapeId: shape.id,
                    componentId: comp.id
                });
            }
        }
    }
}

return {
    unlinkedInstances: unlinkedInstances,
    potentialIssues: potentialIssues,
    summary: {
        totalInstancesScanned: validInstances.length + unlinkedInstances.length + potentialIssues.length,
        validInstances: validInstances.length,
        unlinkedCount: unlinkedInstances.length,
        potentialIssuesCount: potentialIssues.length,
        pagesScanned: pages.length
    },
    recommendations: unlinkedInstances.length > 0 || potentialIssues.length > 0
        ? 'Found ' + unlinkedInstances.length + ' unlinked instance(s) and ' + potentialIssues.length + ' potential issue(s). Review the affected shapes.'
        : 'All component instances are properly linked. Design system integrity is maintained!'
};
`;

        return this.executePluginCode(code);
    }

    /**
     * Generate comprehensive usage report.
     */
    private async generateUsageReport(args: ComponentInstanceMapperArgs): Promise<ToolResponse> {
        const includeAllPages = args.includeAllPages !== false;
        const focusComponentId = args.componentId;

        const code = `
const includeAllPages = ${includeAllPages};
const focusComponentId = ${focusComponentId ? JSON.stringify(focusComponentId) : "null"};

const lib = penpot.library.local;
const components = lib.components;
const pages = includeAllPages ? penpot.currentFile.pages : [penpot.currentPage];

// Build comprehensive usage data
const componentData = new Map();

for (const comp of components) {
    componentData.set(comp.id, {
        id: comp.id,
        name: comp.name,
        path: comp.path,
        instances: [],
        pageDistribution: new Map(),
        depth: { min: Infinity, max: -Infinity, avg: 0 }
    });
}

// Helper to calculate nesting depth
function calculateDepth(shape) {
    let depth = 0;
    let current = shape.parent;
    while (current) {
        depth++;
        current = current.parent;
    }
    return depth;
}

// Collect instance data
for (const page of pages) {
    const shapes = page.findShapes();
    
    for (const shape of shapes) {
        if (shape.isComponentInstance && shape.isComponentInstance()) {
            const comp = shape.component ? shape.component() : null;
            if (comp && componentData.has(comp.id)) {
                const data = componentData.get(comp.id);
                const depth = calculateDepth(shape);
                
                data.instances.push({
                    shapeId: shape.id,
                    shapeName: shape.name,
                    pageId: page.id,
                    pageName: page.name,
                    isMain: shape.isComponentMainInstance ? shape.isComponentMainInstance() : false,
                    depth: depth
                });
                
                // Track page distribution
                data.pageDistribution.set(
                    page.id, 
                    (data.pageDistribution.get(page.id) || 0) + 1
                );
                
                // Track depth stats
                data.depth.min = Math.min(data.depth.min, depth);
                data.depth.max = Math.max(data.depth.max, depth);
            }
        }
    }
}

// Calculate averages and finalize data
const report = {
    generatedAt: new Date().toISOString(),
    scope: includeAllPages ? 'all pages' : 'current page only',
    pagesAnalyzed: pages.length,
    totalComponents: components.length,
    componentReports: []
};

let totalInstances = 0;
const unusedComponents = [];

for (const [id, data] of componentData) {
    // Skip if focusing on specific component and this isn't it
    if (focusComponentId && id !== focusComponentId) continue;
    
    const instanceCount = data.instances.length;
    totalInstances += instanceCount;
    
    // Calculate average depth
    if (instanceCount > 0) {
        const totalDepth = data.instances.reduce((sum, i) => sum + i.depth, 0);
        data.depth.avg = Math.round((totalDepth / instanceCount) * 10) / 10;
    } else {
        data.depth = { min: 0, max: 0, avg: 0 };
        unusedComponents.push({ id: data.id, name: data.name });
    }
    
    // Convert page distribution to array
    const pageDistribution = [];
    for (const [pageId, count] of data.pageDistribution) {
        const page = pages.find(p => p.id === pageId);
        pageDistribution.push({
            pageId: pageId,
            pageName: page ? page.name : 'Unknown',
            count: count
        });
    }
    pageDistribution.sort((a, b) => b.count - a.count);
    
    report.componentReports.push({
        componentId: data.id,
        componentName: data.name,
        componentPath: data.path,
        totalInstances: instanceCount,
        mainInstances: data.instances.filter(i => i.isMain).length,
        copyInstances: data.instances.filter(i => !i.isMain).length,
        pageDistribution: pageDistribution,
        nestingDepth: data.depth,
        usageStatus: instanceCount === 0 ? 'unused' : instanceCount < 3 ? 'low' : instanceCount < 10 ? 'moderate' : 'high'
    });
}

// Sort by usage (most used first)
report.componentReports.sort((a, b) => b.totalInstances - a.totalInstances);

// Add summary
report.summary = {
    totalInstances: totalInstances,
    averageInstancesPerComponent: components.length > 0 
        ? Math.round((totalInstances / components.length) * 10) / 10 
        : 0,
    unusedComponentCount: unusedComponents.length,
    unusedComponents: unusedComponents,
    mostUsedComponents: report.componentReports.slice(0, 5).map(r => ({
        name: r.componentName,
        instances: r.totalInstances
    })),
    leastUsedComponents: report.componentReports
        .filter(r => r.totalInstances > 0)
        .slice(-5)
        .reverse()
        .map(r => ({
            name: r.componentName,
            instances: r.totalInstances
        }))
};

return report;
`;

        return this.executePluginCode(code);
    }

    /**
     * Helper method to execute plugin code and return a standardized response.
     */
    private async executePluginCode(code: string): Promise<ToolResponse> {
        const task = new ExecuteCodePluginTask({ code });
        const result = await this.mcpServer.pluginBridge.executePluginTask(task);

        if (result.data !== undefined) {
            return new TextResponse(JSON.stringify(result.data, null, 2));
        } else {
            return new TextResponse("Operation completed successfully with no return value.");
        }
    }
}

