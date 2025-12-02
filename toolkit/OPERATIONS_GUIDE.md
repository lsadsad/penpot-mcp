# Toolkit Operations Guide

**Modular, importable Penpot operations for tools and external projects**

## Overview

The `operations/` directory contains modular JavaScript functions that generate Penpot API code. These operations can be:

1. **Used by MCP tools** - Tools import and use these operations internally
2. **Used by external projects** - Import operations directly from the npm package

## Structure

```
toolkit/operations/
├── index.js          # Central exports
├── components.js     # Component management
├── tokens.js         # Design tokens
├── shapes.js         # Shape creation/modification
├── layout.js         # Layout & positioning
└── validation.js     # Design validation
```

## Usage Patterns

### Pattern 1: In MCP Tools (Internal)

```typescript
// mcp-server/src/tools/ComponentLibraryManagerTool.ts
import { components } from '../../../toolkit/operations/index.js';

class ComponentLibraryManagerTool extends Tool {
    async executeCore(args) {
        const code = components.listComponents();
        const task = new ExecuteCodePluginTask(code);
        return await this.server.pluginBridge.executeTask(task);
    }
}
```

### Pattern 2: External Projects (Published Package)

```javascript
// user-project/sync-design-tokens.js
import { tokens } from 'penpot-mcp/toolkit/operations/index.js';

// Extract tokens
const code = tokens.extractTokens();
await mcp_penpot_execute_code({ code });

// Create a new color
const createCode = tokens.createColorToken('primary', '#3B82F6');
await mcp_penpot_execute_code({ code: createCode });
```

### Pattern 3: Direct Import

```javascript
import { createComponent } from 'penpot-mcp/toolkit/operations/components.js';
import { extractTokens } from 'penpot-mcp/toolkit/operations/tokens.js';

const componentCode = createComponent(['id1', 'id2'], 'MyButton');
await mcp_penpot_execute_code({ code: componentCode });
```

## Available Operations

### Components (`components.js`)

| Function | Parameters | Description |
|----------|-----------|-------------|
| `listComponents()` | - | List all components in library |
| `createComponent(shapeIds, name)` | ids, name | Create component from shapes |
| `createComponentFromSelection()` | - | Create from current selection |
| `findComponentInstances(componentId?)` | optional id | Find all/specific instances |
| `syncInstances(componentId)` | id | Sync all instances with main |
| `deleteComponent(componentId)` | id | Delete component |
| `detachInstance(instanceId)` | id | Detach instance from component |
| `getComponentStats()` | - | Get usage statistics |
| `updateComponentInstances(name, props)` | name, props | Update all instances |
| `createComponentVariant(name, variant, mods)` | names, mods | Create variant |
| `findUnusedComponents()` | - | Find unused components |

### Design Tokens (`tokens.js`)

| Function | Parameters | Description |
|----------|-----------|-------------|
| `extractTokens()` | - | Extract all design tokens |
| `createColorToken(name, color, opacity?)` | name, color, opacity | Create color token |
| `createTypographyToken(name, style)` | name, style | Create typography token |
| `updateColorToken(tokenId, updates)` | id, updates | Update color token |
| `deleteColorToken(tokenId)` | id | Delete color token |
| `deleteTypographyToken(tokenId)` | id | Delete typography token |
| `applyColorToken(shapeIds, tokenName)` | ids, name | Apply color to shapes |
| `applyTypographyToken(shapeIds, tokenName)` | ids, name | Apply typography |
| `getColorPalette()` | - | Get colors from page |
| `exportTokens(format?)` | format | Export as json/css/scss |
| `importTokens(tokens)` | tokens | Import tokens from JSON |
| `storeTokens()` | - | Store in persistent storage |

### Shapes (`shapes.js`)

| Function | Parameters | Description |
|----------|-----------|-------------|
| `getSelection()` | - | Get selected shapes info |
| `findShapesByType(type)` | type | Find shapes by type |
| `findShapesByName(pattern)` | pattern | Find shapes by name |
| `getPageStructure()` | - | Get file/page structure |
| `createButton(x, y, label)` | x, y, label | Create styled button |
| `createCard(x, y, title)` | x, y, title | Create card component |
| `createGrid(config)` | config | Create grid layout |
| `applyThemeToSelection(theme)` | theme | Apply theme colors |
| `resizeSelection(scale)` | scale | Resize proportionally |
| `addRoundedCorners(radius)` | radius | Add border radius |
| `exportShapeData(shapeId?)` | id | Export shape as JSON |
| `generateCss(includeChildren?)` | bool | Generate CSS |
| `generateHtml()` | - | Generate HTML |
| `batchCreate(items)` | items | Batch create shapes |

### Layout (`layout.js`)

| Function | Parameters | Description |
|----------|-----------|-------------|
| `distributeHorizontally()` | - | Distribute shapes horizontally |
| `distributeVertically()` | - | Distribute shapes vertically |
| `alignHorizontal(alignment)` | alignment | Align horizontally |
| `alignVertical(alignment)` | alignment | Align vertically |
| `alignToCenter()` | - | Align to center |
| `createFlexLayout(ids, dir, spacing)` | ids, dir, spacing | Create flex container |
| `createAutoLayout(config)` | config | Create auto-layout |

### Validation (`validation.js`)

| Function | Parameters | Description |
|----------|-----------|-------------|
| `validateDesignSystem(rules)` | rules | Validate against rules |
| `findUnusedColors()` | - | Find unused library colors |
| `findInconsistentSpacing()` | - | Find spacing issues |
| `auditAccessibility()` | - | Audit for a11y issues |

## Examples

### Example 1: Component Management

```javascript
import { components } from 'penpot-mcp/toolkit/operations/index.js';

// List all components
const listCode = components.listComponents();
const result = await mcp_penpot_execute_code({ code: listCode });
console.log(result);

// Create a component
const createCode = components.createComponent(
    ['shape-id-1', 'shape-id-2'],
    'Primary Button'
);
await mcp_penpot_execute_code({ code: createCode });

// Find instances
const findCode = components.findComponentInstances('component-id');
await mcp_penpot_execute_code({ code: findCode });
```

### Example 2: Design Token Workflow

```javascript
import { tokens } from 'penpot-mcp/toolkit/operations/index.js';

// Extract existing tokens
const extractCode = tokens.extractTokens();
const currentTokens = await mcp_penpot_execute_code({ code: extractCode });

// Create new tokens
const colorCode = tokens.createColorToken('brand-primary', '#3B82F6');
await mcp_penpot_execute_code({ code: colorCode });

// Export as CSS
const exportCode = tokens.exportTokens('css');
const cssVars = await mcp_penpot_execute_code({ code: exportCode });
console.log(cssVars.output);
```

### Example 3: Validation

```javascript
import { validation } from 'penpot-mcp/toolkit/operations/index.js';

const rules = {
    minTouchTarget: 44,
    allowedColors: ['#3B82F6', '#10B981', '#EF4444'],
    minTextSize: 12,
    maxTextSize: 72
};

const validateCode = validation.validateDesignSystem(rules);
const issues = await mcp_penpot_execute_code({ code: validateCode });

if (issues.issuesFound > 0) {
    console.log('Design issues found:', issues.issues);
}
```

## Benefits

### For Tool Development

- **Code Reuse**: Tools share battle-tested operations
- **Consistency**: Same operations used everywhere
- **Testing**: Test operations independently
- **Maintainability**: Update once, all tools benefit

### For External Projects

- **Ready to Use**: Import and execute immediately
- **Type Safe**: JSDoc comments for IDE support
- **Flexible**: Combine operations as needed
- **Documented**: Each function documented

## Migration from examples.js

The legacy `examples.js` file is still available but new code is added to `operations/` modules:

**Old way:**
```javascript
import { extractDesignTokens } from 'penpot-mcp/toolkit/examples.js';
await mcp_penpot_execute_code({ code: extractDesignTokens });
```

**New way:**
```javascript
import { tokens } from 'penpot-mcp/toolkit/operations/index.js';
const code = tokens.extractTokens();
await mcp_penpot_execute_code({ code });
```

## Contributing

When adding new operations:

1. Choose the appropriate module (or create new one)
2. Export as named function
3. Add JSDoc comments
4. Update this guide
5. Test with both tools and external usage

## See Also

- **`examples.js`** - Legacy code snippets
- **`PENPOT_MCP_TOOLKIT.md`** - Comprehensive API guide
- **`GOTCHAS.md`** - Critical learnings
- **`integration-template.md`** - Project setup guide
