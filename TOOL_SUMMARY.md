# Penpot MCP Tools - Quick Reference Summary

## Current Tools (6)
1. ✅ `execute_code` - Execute JavaScript in Penpot
2. ✅ `high_level_overview` - Get tool/API overview
3. ✅ `penpot_api_info` - API documentation lookup
4. ✅ `export_shape` - Export to PNG/SVG
5. ✅ `import_image` - Import images
6. ✅ `create_shape_from_css` - CSS to shapes

---

## Tools to Build (9 Total)

### HIGH PRIORITY - Design System Core

#### 1. Component Library Manager
**Goal**: Manage reusable components

**Key Functions**:
```typescript
createComponent(shapeIds, name)
updateComponent(componentId, updates)
listComponents(filter?)
deleteComponent(componentId)
syncInstances(componentId)
detachInstance(instanceId)
```

**Why**: Core design system functionality. Create, organize, and sync components.

---

#### 2. Design Token Manager
**Goal**: Manage colors, typography, design tokens

**Key Functions**:
```typescript
createColorToken(name, color)
createTypographyToken(name, fontFamily, fontSize, ...)
listTokens(type?)
updateToken(tokenId, properties)
deleteToken(tokenId)
applyColorToken(shapeIds, tokenName)
applyTypographyToken(shapeIds, tokenName)
exportTokens(format) // json or css
importTokens(tokens)
```

**Why**: Foundation of design systems. Bridges CSS variables and Penpot.

---

#### 3. Component Instance Mapper
**Goal**: Track component usage and relationships

**Key Functions**:
```typescript
getComponentInstances(componentId)
getInstanceSource(shapeId)
getComponentDependencies()
findOrphanedComponents()
findUnlinkedInstances()
generateUsageReport(componentId?)
```

**Why**: Understand impact before making changes. Essential for governance.

---

### MEDIUM PRIORITY - Project Management

#### 4. Shape Query Tool
**Goal**: Advanced search and filtering

**Key Functions**:
```typescript
findShapes(query)
findByType(type, options?)
findByName(pattern)
findByProperty(property, value)
findByComponentSource(componentId)
findByColor(color, tolerance?)
findByTextContent(text)
complexQuery(query) // AND/OR logic
```

**Why**: Powerful search for large projects. Enable bulk operations and auditing.

**Example**:
```typescript
// Find all blue buttons
findShapes({
  type: 'rectangle',
  namePattern: /button/i,
  fill: { color: '#0000FF', tolerance: 10 }
})
```

---

#### 5. Bulk Update Tool
**Goal**: Apply changes across multiple shapes

**Key Functions**:
```typescript
bulkUpdateColors(selector, oldColor, newColor)
bulkUpdateTypography(selector, typography)
bulkUpdateDimensions(selector, dimensions)
bulkUpdatePositions(selector, transform)
bulkApplyComponentUpdates(componentId)
previewChanges(operation)
undoLastBulkOperation()
```

**Why**: Propagate design system changes efficiently. Ensure consistency.

---

#### 6. Layout/Auto-layout Tool
**Goal**: Create flex-like layouts

**Key Functions**:
```typescript
createFlexLayout(shapeIds, direction, spacing)
updateFlexProperties(shapeId, properties)
distributeShapes(shapeIds, distribution, spacing)
alignShapes(shapeIds, alignment)
createGrid(rows, columns, cellWidth, cellHeight, gap)
applyAutoLayout(shapeId, constraints)
```

**Why**: Essential for building consistent, responsive UIs.

---

### LOWER PRIORITY - Development Integration

#### 7. CSS-to-Component Pipeline
**Goal**: HTML+CSS to Penpot components

**Key Functions**:
```typescript
createComponentFromHTML(html, css, name)
createComponentFromUrl(url, selector)
updateComponentFromCSS(componentId, css)
syncWithCodebase(path, mapping)
```

**Why**: Natural evolution of `create_shape_from_css`. Design-to-code workflows.

---

#### 8. Diff/Compare Tool
**Goal**: Compare component versions

**Key Functions**:
```typescript
compareComponents(componentId1, componentId2)
compareShapes(shapeId1, shapeId2)
detectChanges(componentId, since)
visualDiff(shapeId1, shapeId2)
getChangeHistory(componentId)
```

**Why**: Review changes. Version control integration. Team collaboration.

---

#### 9. Documentation Generator
**Goal**: Auto-generate style guides

**Key Functions**:
```typescript
generateComponentGallery(filter?)
generateStyleGuide(options)
exportComponentDocs(componentId, format)
generateTokenDocs()
createInteractiveStorybook()
```

**Why**: Keep docs in sync with designs. Reduce manual work.

---

## Implementation Order

### Phase 1: Foundation (Weeks 1-2)
- ✅ Component Library Manager
- ✅ Design Token Manager

### Phase 2: Discovery (Weeks 3-4)
- ✅ Component Instance Mapper
- ✅ Shape Query Tool

### Phase 3: Automation (Weeks 5-6)
- ✅ Bulk Update Tool
- ✅ Layout/Auto-layout Tool

### Phase 4: Integration (Weeks 7-8)
- ✅ CSS-to-Component Pipeline
- ✅ Diff/Compare Tool
- ✅ Documentation Generator

---

## Quick Build Pattern

Every tool follows this structure:

```typescript
// 1. Create file: tools/YourToolName.ts
import { Tool } from "../Tool";
import { z } from "zod";

// 2. Define schema
const schema = z.object({
    operation: z.enum(['op1', 'op2', 'op3']),
    // ... parameters
});

// 3. Extend Tool class
export class YourTool extends Tool<z.infer<typeof schema>> {
    static schema = schema;

    constructor(private server: PenpotMcpServer) {
        super("tool_name", "Description", schema);
    }

    // 4. Implement core logic
    async executeCore(args: z.infer<typeof schema>): Promise<ToolResponse> {
        const code = `
            // Penpot API code here
        `;
        const task = new ExecuteCodePluginTask(code);
        const result = await this.server.pluginBridge.executeTask(task);
        return new TextResponse(JSON.stringify(result, null, 2));
    }
}

// 5. Register in PenpotMcpServer.ts
```

---

## Key Penpot APIs to Use

### Component Management
```javascript
penpot.library.local.createComponent(shapes)
penpot.library.local.components // list all
component.mainInstance()
component.instance() // create instance
```

### Design Tokens
```javascript
penpot.library.local.createColor(name, color)
penpot.library.local.createTypography(name, props)
penpot.library.local.colors
penpot.library.local.typographies
```

### Shape Operations
```javascript
penpot.currentPage.findShapeById(id)
penpotUtils.findShapes(predicate)
shape.componentId
shape.componentFile
```

### Layout
```javascript
shape.layout // flex properties
shape.layoutChild // child constraints
```

---

## Success Criteria

✅ **Design System Governance** - Track components and usage
✅ **Efficiency** - Bulk operations replace manual work
✅ **Consistency** - Automated updates ensure uniformity
✅ **Integration** - Bridge code and design
✅ **Documentation** - Auto-generated, always current
✅ **Collaboration** - Better team workflows
✅ **Scalability** - Manage large design systems

---

## Tool Integration Map

```
create_shape_from_css
    ↓
Design Token Manager ←→ CSS-to-Component Pipeline
    ↓
Component Library Manager
    ↓
Component Instance Mapper ←→ Shape Query Tool
    ↓
Bulk Update Tool ←→ Layout/Auto-layout Tool
    ↓
Diff/Compare Tool
    ↓
Documentation Generator
```

---

## Next Steps

1. **Start with Tool #1** (Component Library Manager)
2. **Follow the Quick Build Pattern** above
3. **Test thoroughly** with real components
4. **Build Tool #2** (Design Token Manager)
5. **Continue down the priority list**

See `TOOL_RECOMMENDATIONS.md` for detailed implementation notes.

---

## Resources

- **Full Details**: `TOOL_RECOMMENDATIONS.md`
- **Existing Tools**: `mcp-server/src/tools/`
- **Base Class**: `mcp-server/src/Tool.ts`
- **Penpot API**: `data/api_types.yml`
- **Example**: `tools/CreateShapeFromCssTool.ts`
