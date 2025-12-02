# Penpot MCP Tool Recommendations

This document outlines recommended tools to build for managing Penpot projects, design systems, and maintaining links between projects and visual components.

## Current Tools (Implemented)

1. **execute_code** - Execute JavaScript in Penpot plugin context
2. **high_level_overview** - Get overview of Penpot tools and API
3. **penpot_api_info** - Retrieve API documentation for Penpot types
4. **export_shape** - Export shapes to PNG or SVG format
5. **import_image** - Import raster images into Penpot
6. **create_shape_from_css** - Create shapes from CSS properties

## Recommended Tools (Priority Order)

### HIGH PRIORITY - Design System Management

#### 1. Component Library Manager Tool
**Purpose**: Create, update, and sync design system components across files.

**Operations**:
- `createComponent(shapeIds: string[], name: string)` - Create component from shapes
- `updateComponent(componentId: string, updates: ComponentUpdates)` - Update component properties
- `listComponents(filter?: ComponentFilter)` - List all components with optional filtering
- `deleteComponent(componentId: string)` - Remove component from library
- `syncInstances(componentId: string)` - Update all instances when main component changes
- `detachInstance(instanceId: string)` - Convert instance to regular shapes

**Why**: Core functionality for design system maintenance. Currently you can create components via `execute_code`, but a dedicated tool provides better validation, error handling, and workflows.

**Implementation Notes**:
- Use `penpot.library.local.createComponent(shapes)`
- Track component updates with timestamps
- Validate component names are unique
- Handle nested components appropriately

---

#### 2. Design Token Manager Tool
**Purpose**: Manage colors, typography, and other design tokens as reusable assets.

**Operations**:
- `createColorToken(name: string, color: string)` - Add color to library
- `createTypographyToken(name: string, fontFamily: string, fontSize: number, ...)` - Add typography style
- `listTokens(type?: 'colors' | 'typography')` - List all design tokens
- `updateToken(tokenId: string, properties: TokenProperties)` - Modify existing token
- `deleteToken(tokenId: string)` - Remove token from library
- `applyColorToken(shapeIds: string[], tokenName: string)` - Apply color token to shapes
- `applyTypographyToken(shapeIds: string[], tokenName: string)` - Apply typography to text
- `exportTokens(format: 'json' | 'css')` - Export tokens for use in code
- `importTokens(tokens: DesignTokens)` - Import tokens from JSON

**Why**: Design tokens are the foundation of design systems. This bridges the gap between code (CSS variables) and Penpot libraries. Works perfectly with your existing `create_shape_from_css` tool.

**Implementation Notes**:
- Use `penpot.library.local.createColor()` for colors
- Use `penpot.library.local.createTypography()` for text styles
- Support standard design token formats (Style Dictionary, Tokens Studio)
- Validate color formats (hex, rgb, rgba, hsl)
- Handle typography scales (rem, px)

---

#### 3. Component Instance Mapper Tool
**Purpose**: Track relationships between component instances and their main components.

**Operations**:
- `getComponentInstances(componentId: string)` - Find all instances of a component
- `getInstanceSource(shapeId: string)` - Identify which component an instance comes from
- `getComponentDependencies()` - Generate full dependency graph
- `findOrphanedComponents()` - List unused components
- `findUnlinkedInstances()` - Find instances that lost their component link
- `generateUsageReport(componentId?: string)` - Create usage statistics

**Why**: Essential for maintaining links between projects and visual components. Helps you understand the impact of changes before making them. Critical for design system governance.

**Implementation Notes**:
- Use `shape.componentId` and `shape.componentFile` properties
- Build graph data structure for dependencies
- Cache results for performance
- Support cross-file component tracking
- Visualize with mermaid diagrams or similar

---

### MEDIUM PRIORITY - Project-Level Management

#### 4. Shape Query Tool
**Purpose**: Advanced search and filtering for shapes across pages.

**Operations**:
- `findShapes(query: ShapeQuery)` - Find shapes matching criteria
- `findByType(type: ShapeType, options?: QueryOptions)` - Find by shape type
- `findByName(pattern: string | RegExp)` - Find by name pattern
- `findByProperty(property: string, value: any)` - Find by specific property
- `findByComponentSource(componentId: string)` - Find all component instances
- `findByColor(color: string, tolerance?: number)` - Find shapes with specific color
- `findByTextContent(text: string)` - Search text within shapes
- `complexQuery(query: ComplexQuery)` - Combine multiple filters with AND/OR logic

**Example Queries**:
```typescript
// Find all blue buttons
findShapes({
  type: 'rectangle',
  namePattern: /button/i,
  fill: { color: '#0000FF', tolerance: 10 }
})

// Find unused components
findShapes({
  isComponent: true,
  hasInstances: false
})
```

**Why**: You have `penpotUtils.findShapes()` but a dedicated tool with rich query syntax would be more powerful for managing large projects. Essential for bulk operations and auditing.

**Implementation Notes**:
- Build query DSL (Domain-Specific Language)
- Support pagination for large result sets
- Cache frequently-used queries
- Return results with path information (page > frame > shape)
- Support sorting and ranking

---

#### 5. Bulk Update Tool
**Purpose**: Apply consistent changes across multiple shapes/components.

**Operations**:
- `bulkUpdateColors(selector: ShapeSelector, oldColor: string, newColor: string)` - Replace colors
- `bulkUpdateTypography(selector: ShapeSelector, typography: TypographyStyle)` - Update text styles
- `bulkUpdateDimensions(selector: ShapeSelector, dimensions: Dimensions)` - Resize shapes
- `bulkUpdatePositions(selector: ShapeSelector, transform: Transform)` - Move/align shapes
- `bulkApplyComponentUpdates(componentId: string)` - Sync all instances
- `previewChanges(operation: BulkOperation)` - Preview before applying
- `undoLastBulkOperation()` - Rollback last bulk change

**Why**: When updating design systems, you need to propagate changes efficiently. Manual updates are error-prone and time-consuming. This tool ensures consistency.

**Implementation Notes**:
- Implement transaction support (all-or-nothing)
- Store operation history for undo
- Validate changes before applying
- Support dry-run mode
- Batch operations for performance
- Show progress for long operations

---

#### 6. Layout/Auto-layout Tool
**Purpose**: Create and manage flex-like layouts (rows, columns, grids).

**Operations**:
- `createFlexLayout(shapeIds: string[], direction: 'row' | 'column', spacing: number)` - Create flex container
- `updateFlexProperties(shapeId: string, properties: FlexProperties)` - Modify flex settings
- `distributeShapes(shapeIds: string[], distribution: 'horizontal' | 'vertical', spacing: number)` - Space evenly
- `alignShapes(shapeIds: string[], alignment: AlignmentType)` - Align shapes
- `createGrid(rows: number, columns: number, cellWidth: number, cellHeight: number, gap: number)` - Create grid
- `applyAutoLayout(shapeId: string, constraints: LayoutConstraints)` - Add auto-layout

**Why**: Essential for building consistent, responsive UI layouts. Penpot has flex layout features that need easier access through MCP tools.

**Implementation Notes**:
- Use Penpot's layout features (`shape.layout`)
- Support flex properties (justify-content, align-items, gap)
- Handle nested layouts
- Preserve constraints when resizing
- Support responsive behavior

---

### LOWER PRIORITY - Development Workflow

#### 7. CSS-to-Component Pipeline Tool
**Purpose**: Extend CSS tool to create complete components, not just shapes.

**Operations**:
- `createComponentFromHTML(html: string, css: string, name: string)` - Parse HTML structure + CSS
- `createComponentFromUrl(url: string, selector: string)` - Extract component from webpage
- `updateComponentFromCSS(componentId: string, css: string)` - Update existing component
- `syncWithCodebase(path: string, mapping: ComponentMapping)` - Keep designs in sync with code

**Why**: Natural evolution of your `create_shape_from_css` tool. Bridges web development and Penpot more completely. Enables design-to-code and code-to-design workflows.

**Implementation Notes**:
- Parse HTML structure into Penpot shape hierarchy
- Map CSS classes to layer names
- Handle CSS selectors and pseudo-elements
- Support CSS Grid and Flexbox
- Extract assets (images, fonts)
- Handle responsive breakpoints

---

#### 8. Diff/Compare Tool
**Purpose**: Compare two versions of components or files.

**Operations**:
- `compareComponents(componentId1: string, componentId2: string)` - Compare two components
- `compareShapes(shapeId1: string, shapeId2: string)` - Compare two shapes
- `detectChanges(componentId: string, since: Date)` - Find changes since timestamp
- `visualDiff(shapeId1: string, shapeId2: string)` - Generate visual diff image
- `getChangeHistory(componentId: string)` - Get component change log

**Why**: Helps maintain design system integrity when reviewing changes. Useful for version control integration and team collaboration.

**Implementation Notes**:
- Compare properties recursively
- Highlight visual differences
- Support semantic comparison (ignore trivial changes)
- Generate diff reports (JSON, HTML, Markdown)
- Integrate with git/version control

---

#### 9. Documentation Generator Tool
**Purpose**: Generate visual documentation from Penpot files.

**Operations**:
- `generateComponentGallery(filter?: ComponentFilter)` - Create component showcase
- `generateStyleGuide(options: StyleGuideOptions)` - Create full style guide
- `exportComponentDocs(componentId: string, format: 'html' | 'markdown')` - Document single component
- `generateTokenDocs()` - Document design tokens
- `createInteractiveStorybook()` - Generate interactive documentation

**Why**: Keeps documentation in sync with actual design system. Reduces manual documentation work. Helps teams understand and use the design system.

**Implementation Notes**:
- Export component previews as images
- Include property specifications
- Show usage examples
- Generate code snippets
- Support theming/branding
- Auto-update on component changes

---

## Implementation Strategy

### Phase 1: Foundation (Weeks 1-2)
1. **Component Library Manager** - Core functionality
2. **Design Token Manager** - Token management basics

### Phase 2: Discovery & Analysis (Weeks 3-4)
3. **Component Instance Mapper** - Relationship tracking
4. **Shape Query Tool** - Advanced search

### Phase 3: Automation (Weeks 5-6)
5. **Bulk Update Tool** - Mass operations
6. **Layout/Auto-layout Tool** - Layout helpers

### Phase 4: Integration (Weeks 7-8)
7. **CSS-to-Component Pipeline** - Code integration
8. **Diff/Compare Tool** - Version tracking
9. **Documentation Generator** - Auto-docs

## Architecture Considerations

### Tool Composition
Build higher-level tools that compose lower-level operations using `execute_code` internally:

```typescript
// Example: Component Library Manager uses execute_code
async createComponent(shapeIds: string[], name: string) {
    const code = `
        const shapes = ${JSON.stringify(shapeIds)}.map(id => penpot.currentPage.findShapeById(id));
        const component = penpot.library.local.createComponent(shapes);
        component.name = ${JSON.stringify(name)};
        return { id: component.id, name: component.name };
    `;
    return await executeCode(code);
}
```

### Validation Layer
Add schema validation for design tokens and components:
- Color formats (hex, rgb, rgba, hsl)
- Typography scales and families
- Component naming conventions
- Property constraints

### Transaction Support
For bulk operations, implement rollback capability:
- Store operation history in plugin storage
- Create snapshots before major changes
- Provide undo/redo functionality

### Caching Strategy
Store component/instance mappings for performance:
- Use plugin `storage` object for persistence
- Invalidate cache on component changes
- Background refresh for large files

### Error Handling
Robust error handling for production use:
- Validate inputs before operations
- Graceful degradation on failures
- Detailed error messages with recovery steps
- Logging for debugging

## Integration with Existing Tools

### With `create_shape_from_css`
- Design Token Manager exports tokens as CSS
- CSS-to-Component Pipeline uses shape creation
- Bulk Update Tool can update CSS-generated shapes

### With `execute_code`
- All tools use execute_code for Penpot API access
- Complex operations compose multiple code executions
- Reusable code snippets for common operations

### With `export_shape`
- Documentation Generator exports component previews
- Diff Tool creates visual comparison images
- Component Gallery uses exports for thumbnails

## Benefits Summary

1. **Design System Governance**: Track components, tokens, and usage
2. **Efficiency**: Bulk operations replace manual work
3. **Consistency**: Automated updates ensure uniformity
4. **Integration**: Bridge between code and design
5. **Documentation**: Auto-generated, always up-to-date docs
6. **Collaboration**: Better team workflows with diffs and tracking
7. **Scalability**: Manage large design systems effectively

## Success Metrics

- Time saved on design system updates
- Reduction in design inconsistencies
- Adoption rate of design tokens
- Component reuse percentage
- Documentation accuracy
- Team onboarding time

---

## Quick Start: Building Your First Tool

Start with **Component Library Manager** as it provides the most immediate value:

1. Create `tools/ComponentLibraryManagerTool.ts`
2. Extend `Tool<ComponentLibraryManagerArgs>`
3. Define Zod schema for arguments
4. Implement `executeCore()` using `execute_code`
5. Register in `PenpotMcpServer.ts`
6. Test with simple component creation
7. Add error handling and validation
8. Document usage in tool description

Example skeleton:

```typescript
import { Tool } from "../Tool";
import { z } from "zod";

const schema = z.object({
    operation: z.enum(['create', 'update', 'list', 'delete', 'sync']),
    shapeIds: z.array(z.string()).optional(),
    componentId: z.string().optional(),
    name: z.string().optional(),
    // ... more fields
});

export class ComponentLibraryManagerTool extends Tool<z.infer<typeof schema>> {
    static schema = schema;

    constructor(private server: PenpotMcpServer) {
        super(
            "component_library_manager",
            "Manage design system components: create, update, sync, and organize reusable components",
            schema
        );
    }

    async executeCore(args: z.infer<typeof schema>): Promise<ToolResponse> {
        switch (args.operation) {
            case 'create':
                return this.createComponent(args);
            case 'update':
                return this.updateComponent(args);
            // ... handle other operations
        }
    }

    private async createComponent(args: any): Promise<ToolResponse> {
        const code = `
            // Implementation using Penpot API
        `;
        const task = new ExecuteCodePluginTask(code);
        const result = await this.server.pluginBridge.executeTask(task);
        return new TextResponse(JSON.stringify(result, null, 2));
    }
}
```

Then register in `PenpotMcpServer.ts`:

```typescript
import { ComponentLibraryManagerTool } from "./tools/ComponentLibraryManagerTool";

// In registerTools()
const toolInstances: Tool<any>[] = [
    // ... existing tools
    new ComponentLibraryManagerTool(this),
];
```

## Resources

- [Penpot Plugin API Documentation](https://help.penpot.app/technical-guide/plugins/)
- [MCP SDK Documentation](https://modelcontextprotocol.io/)
- [Design Tokens Community Group](https://designtokens.org/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)

## Questions?

- Check existing tool implementations in `mcp-server/src/tools/`
- Review `Tool.ts` base class for patterns
- Look at `ExecuteCodeTool.ts` for execute_code usage
- Reference `api_types.yml` for Penpot API details
