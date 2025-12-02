# Penpot MCP Toolkit 🎨🤖

**Drop-in guide for AI assistants to integrate with Penpot design files via MCP**

## Table of Contents
- [Quick Start](#quick-start)
- [Available Tools](#available-tools)
- [Common Patterns](#common-patterns)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Best Practices](#best-practices)

---

## Quick Start

### What is Penpot MCP?
Penpot MCP enables AI to interact with Penpot design files through the Model Context Protocol, allowing:
- Reading design system data (colors, typography, components)
- Creating and modifying shapes
- Querying selection and document structure
- Exporting designs as images or code
- Creating components from shapes

### Prerequisites
```bash
# The Penpot MCP server must be running
# Default endpoints:
# - WebSocket: ws://localhost:4402
# - MCP HTTP: http://localhost:4401/mcp
# - MCP SSE: http://localhost:4401/sse
```

### Basic Connection Check
```javascript
// Test if plugin is connected
const result = await mcp_penpot_execute_code({
  code: "return { connected: true, file: penpot.currentFile?.name }"
});
```

---

## Available Tools

### 1. `mcp_penpot_execute_code`
Execute arbitrary JavaScript in Penpot's plugin context.

**When to use:**
- Custom operations not covered by other tools
- Complex multi-step operations
- Querying design data
- Creating/modifying shapes programmatically

**Available globals:**
- `penpot` - Main Penpot API
- `penpotUtils` - Utility functions
- `storage` - Persistent storage across calls

**Example:**
```javascript
await mcp_penpot_execute_code({
  code: `
    const rect = penpot.createRectangle();
    rect.resize(100, 50);
    rect.fills = [{ fillColor: "#FF0000" }];
    return { id: rect.id, name: rect.name };
  `
});
```

### 2. `mcp_penpot_high_level_overview`
Get usage instructions and overview of Penpot MCP capabilities.

**When to use:**
- First time using Penpot MCP
- Need to understand available features
- Looking for general guidance

### 3. `mcp_penpot_penpot_api_info`
Get detailed API documentation for specific Penpot types.

**Parameters:**
- `type` (required) - Type name (e.g., "Shape", "Rectangle", "Penpot")
- `member` (optional) - Specific member to get info about

**Example:**
```javascript
await mcp_penpot_penpot_api_info({
  type: "Rectangle",
  member: "resize"
});
```

### 4. `mcp_penpot_export_shape`
Export a shape as PNG or SVG image.

**Parameters:**
- `shapeId` (required) - Shape ID or "selection" for current selection
- `format` - "png" (default) or "svg"
- `filePath` (optional) - Save to file instead of returning data

**Example:**
```javascript
await mcp_penpot_export_shape({
  shapeId: "selection",
  format: "png",
  filePath: "./exported-design.png"
});
```

### 5. `mcp_penpot_import_image`
Import an image file as a rectangle with image fill.

**Parameters:**
- `filePath` (required) - Absolute path to image file
- `x`, `y` (optional) - Position
- `width`, `height` (optional) - Dimensions (maintains aspect ratio if only one provided)

**Example:**
```javascript
await mcp_penpot_import_image({
  filePath: "/absolute/path/to/image.png",
  x: 100,
  y: 100,
  width: 200
});
```

### 6. `mcp_penpot_create_shape_from_css`
Create Penpot shapes from CSS properties.

**Parameters:**
- `css` (required) - CSS string or rule
- `shapeType` - "rectangle" (default) or "ellipse"
- `x`, `y` (optional) - Position
- `name` (optional) - Shape name

**Supported CSS properties:**
- Layout: `width`, `height`, `left`, `top`
- Colors: `background-color`, `border-color`
- Borders: `border`, `border-width`, `border-style`, `border-radius`
- Effects: `opacity`, `box-shadow`

**Example:**
```javascript
await mcp_penpot_create_shape_from_css({
  css: "width: 200px; height: 100px; background-color: #3B82F6; border-radius: 8px;",
  shapeType: "rectangle",
  x: 0,
  y: 0,
  name: "Blue Button"
});
```

---

## Common Patterns

### Pattern 1: Read Current Selection
```javascript
const selection = await mcp_penpot_execute_code({
  code: `
    return penpot.selection.map(shape => ({
      id: shape.id,
      name: shape.name,
      type: shape.type,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height
    }));
  `
});
```

### Pattern 2: Extract Design System
```javascript
const designSystem = await mcp_penpot_execute_code({
  code: `
    return {
      colors: penpot.library.local.colors.map(c => ({
        name: c.name,
        color: c.color,
        id: c.id
      })),
      typography: penpot.library.local.typographies.map(t => ({
        name: t.name,
        fontFamily: t.fontFamily,
        fontSize: t.fontSize,
        fontWeight: t.fontWeight
      })),
      components: penpot.library.local.components.map(c => ({
        name: c.name,
        id: c.id
      }))
    };
  `
});
```

### Pattern 3: Create Component from Shapes
```javascript
const component = await mcp_penpot_execute_code({
  code: `
    // Create shapes
    const rect = penpot.createRectangle();
    rect.resize(100, 100);
    rect.fills = [{ fillColor: "#3B82F6" }];
    rect.name = "Button";
    
    const text = penpot.createText("Click me");
    text.x = rect.x + 25;
    text.y = rect.y + 40;
    
    // Group them
    const group = penpot.group([rect, text]);
    
    // Create component
    const component = penpot.library.local.createComponent([group]);
    
    return {
      componentId: component.id,
      componentName: component.name
    };
  `
});
```

### Pattern 4: Find Shapes by Criteria
```javascript
const shapes = await mcp_penpot_execute_code({
  code: `
    // Find all rectangles with red fills
    const allShapes = penpot.currentPage.findShapes();
    const redRects = allShapes.filter(shape => {
      if (shape.type !== 'rectangle') return false;
      return shape.fills?.some(fill => 
        fill.fillColor?.toLowerCase().includes('ff0000')
      );
    });
    
    return redRects.map(s => ({ id: s.id, name: s.name }));
  `
});
```

### Pattern 5: Modify All Components
```javascript
await mcp_penpot_execute_code({
  code: `
    // Get all component instances
    const instances = penpot.currentPage.findShapes()
      .filter(shape => shape.isComponentInstance());
    
    // Modify each instance
    instances.forEach(instance => {
      instance.opacity = 0.8;
    });
    
    return { modified: instances.length };
  `
});
```

### Pattern 6: Generate CSS from Selection
```javascript
const css = await mcp_penpot_execute_code({
  code: `
    const selected = penpot.selection;
    return penpot.generateStyle(selected, {
      type: 'css',
      withPrelude: true,
      includeChildren: true
    });
  `
});
```

### Pattern 7: Batch Create UI Elements
```javascript
const uiElements = await mcp_penpot_execute_code({
  code: `
    const elements = [];
    const colors = ['#FF0000', '#00FF00', '#0000FF'];
    
    colors.forEach((color, index) => {
      const rect = penpot.createRectangle();
      rect.resize(100, 100);
      rect.x = index * 120;
      rect.y = 0;
      rect.fills = [{ fillColor: color }];
      rect.name = \`Color Box \${index + 1}\`;
      elements.push({ id: rect.id, color });
    });
    
    return elements;
  `
});
```

### Pattern 8: Working with Storage
```javascript
// Store data for later use
await mcp_penpot_execute_code({
  code: `
    storage.brandColors = {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#F59E0B'
    };
    return storage.brandColors;
  `
});

// Retrieve stored data in another call
await mcp_penpot_execute_code({
  code: `
    const rect = penpot.createRectangle();
    rect.fills = [{ fillColor: storage.brandColors.primary }];
    return { message: 'Used stored brand color' };
  `
});
```

---

## API Reference

### Penpot Global Object

```typescript
penpot: {
  // Current context
  currentFile: File | null
  currentPage: Page | null
  selection: Shape[]
  root: Shape | null
  
  // Shape creation
  createRectangle(): Rectangle
  createEllipse(): Ellipse
  createPath(): Path
  createText(text: string): Text | null
  createBoard(): Board
  createShapeFromSvg(svg: string): Group | null
  
  // Operations
  group(shapes: Shape[]): Group | null
  ungroup(group: Group): void
  
  // Library
  library: {
    local: LibraryContext
    connected: LibraryContext[]
  }
  
  // Code generation
  generateStyle(shapes: Shape[], options?: {
    type?: 'css'
    withPrelude?: boolean
    includeChildren?: boolean
  }): string
  
  generateMarkup(shapes: Shape[], options?: {
    type?: 'html' | 'svg'
  }): string
  
  // Media
  uploadMediaData(name: string, data: Uint8Array, mimeType: string): Promise<ImageData>
  
  // Page management
  createPage(): Page
  openPage(page: Page): void
  
  // Alignment & distribution
  alignHorizontal(shapes: Shape[], direction: 'left' | 'center' | 'right'): void
  alignVertical(shapes: Shape[], direction: 'top' | 'center' | 'bottom'): void
  distributeHorizontal(shapes: Shape[]): void
  distributeVertical(shapes: Shape[]): void
}
```

### Shape Common Properties

```typescript
shape: {
  // Identity
  id: string
  name: string
  type: 'rectangle' | 'ellipse' | 'text' | 'path' | 'board' | 'group' | etc.
  
  // Position & size
  x: number
  y: number
  width: number
  height: number
  rotation: number
  
  // Visual properties
  fills: Fill[]
  strokes: Stroke[]
  opacity: number
  shadows: Shadow[]
  blurs: Blur[]
  
  // Methods
  resize(width: number, height: number): void
  rotate(angle: number, center?: { x: number, y: number }): void
  remove(): void
  clone(): Shape
  
  // Hierarchy
  parent: Shape | null
  children: Shape[]
  appendChild(child: Shape): void
  
  // Component methods
  isComponentInstance(): boolean
  isComponentRoot(): boolean
  component(): LibraryComponent | null
}
```

### LibraryContext

```typescript
library: {
  colors: LibraryColor[]
  typographies: LibraryTypography[]
  components: LibraryComponent[]
  
  createColor(): LibraryColor
  createTypography(): LibraryTypography
  createComponent(shapes: Shape[]): LibraryComponent
}
```

---

## Examples

### Example 1: Design Token Extractor
```javascript
// Extract all design tokens for use in code
const tokens = await mcp_penpot_execute_code({
  code: `
    const library = penpot.library.local;
    
    return {
      colors: Object.fromEntries(
        library.colors.map(c => [
          c.name.replace(/\s+/g, '-').toLowerCase(),
          c.color
        ])
      ),
      typography: Object.fromEntries(
        library.typographies.map(t => [
          t.name.replace(/\s+/g, '-').toLowerCase(),
          {
            fontFamily: t.fontFamily,
            fontSize: t.fontSize,
            fontWeight: t.fontWeight,
            lineHeight: t.lineHeight
          }
        ])
      ),
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32
      }
    };
  `
});

// Use tokens to generate CSS variables
const cssVariables = Object.entries(tokens.colors)
  .map(([name, color]) => `--color-${name}: ${color};`)
  .join('\n');
```

### Example 2: Component Validator
```javascript
// Check if components follow design system rules
const validation = await mcp_penpot_execute_code({
  code: `
    const rules = {
      minWidth: 44,  // Accessibility minimum tap target
      minHeight: 44,
      allowedColors: ['#3B82F6', '#8B5CF6', '#F59E0B']
    };
    
    const components = penpot.library.local.components;
    const issues = [];
    
    components.forEach(comp => {
      const mainInstance = comp.mainInstance;
      if (!mainInstance) return;
      
      // Check dimensions
      if (mainInstance.width < rules.minWidth) {
        issues.push({
          component: comp.name,
          issue: 'Width too small',
          value: mainInstance.width
        });
      }
      
      // Check colors
      mainInstance.fills?.forEach(fill => {
        if (fill.fillColor && !rules.allowedColors.includes(fill.fillColor)) {
          issues.push({
            component: comp.name,
            issue: 'Color not in design system',
            value: fill.fillColor
          });
        }
      });
    });
    
    return {
      totalComponents: components.length,
      issuesFound: issues.length,
      issues
    };
  `
});
```

### Example 3: Auto-Layout Grid Generator
```javascript
// Create a responsive grid layout
await mcp_penpot_execute_code({
  code: `
    const config = {
      columns: 3,
      rows: 2,
      itemWidth: 150,
      itemHeight: 100,
      gap: 16,
      startX: 100,
      startY: 100
    };
    
    const items = [];
    
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.columns; col++) {
        const rect = penpot.createRectangle();
        rect.resize(config.itemWidth, config.itemHeight);
        rect.x = config.startX + (col * (config.itemWidth + config.gap));
        rect.y = config.startY + (row * (config.itemHeight + config.gap));
        rect.fills = [{ fillColor: '#E5E7EB' }];
        rect.name = \`Grid Item \${row * config.columns + col + 1}\`;
        items.push(rect);
      }
    }
    
    const grid = penpot.group(items);
    grid.name = 'Auto Grid';
    
    return {
      created: items.length,
      gridId: grid.id
    };
  `
});
```

### Example 4: Theme Switcher
```javascript
// Apply light/dark theme to selection
const applyTheme = async (theme) => {
  const themes = {
    light: {
      background: '#FFFFFF',
      text: '#000000',
      border: '#E5E7EB'
    },
    dark: {
      background: '#1F2937',
      text: '#FFFFFF',
      border: '#374151'
    }
  };
  
  await mcp_penpot_execute_code({
    code: `
      const theme = ${JSON.stringify(themes[theme])};
      const selected = penpot.selection;
      
      selected.forEach(shape => {
        // Apply background
        if (shape.fills) {
          shape.fills = [{ fillColor: theme.background }];
        }
        
        // Apply text color
        if (shape.type === 'text') {
          shape.fills = [{ fillColor: theme.text }];
        }
        
        // Apply border
        if (shape.strokes) {
          shape.strokes = [{
            strokeColor: theme.border,
            strokeWidth: 1,
            strokeStyle: 'solid'
          }];
        }
      });
      
      return { applied: '${theme}', shapesUpdated: selected.length };
    `
  });
};

// Usage
await applyTheme('dark');
```

### Example 5: Component Instance Finder
```javascript
// Find all instances of a specific component
const findComponentInstances = async (componentName) => {
  return await mcp_penpot_execute_code({
    code: `
      const allShapes = penpot.currentPage.findShapes();
      const instances = allShapes.filter(shape => {
        if (!shape.isComponentInstance()) return false;
        const comp = shape.component();
        return comp && comp.name === '${componentName}';
      });
      
      return instances.map(instance => ({
        id: instance.id,
        name: instance.name,
        x: instance.x,
        y: instance.y,
        page: penpot.currentPage.name
      }));
    `
  });
};

// Usage
const buttonInstances = await findComponentInstances('Button/Primary');
```

---

## Best Practices

### 1. Error Handling
Always wrap complex operations in try-catch:

```javascript
await mcp_penpot_execute_code({
  code: `
    try {
      const shape = penpot.selection[0];
      if (!shape) {
        return { error: 'No shape selected' };
      }
      // ... operations
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  `
});
```

### 2. Check for Null/Undefined
Penpot API often returns null for missing elements:

```javascript
const file = penpot.currentFile;
if (!file) {
  return { error: 'No file open' };
}

const page = penpot.currentPage;
if (!page) {
  return { error: 'No page selected' };
}
```

### 3. Use Storage for Multi-Step Operations
Store intermediate results in `storage`:

```javascript
// Step 1: Store selection
await mcp_penpot_execute_code({
  code: `
    storage.savedSelection = penpot.selection.map(s => s.id);
    return { saved: storage.savedSelection.length };
  `
});

// Step 2: Use stored selection
await mcp_penpot_execute_code({
  code: `
    const shapes = storage.savedSelection.map(id => 
      penpot.currentPage.findShapes({ id })[0]
    );
    // ... work with shapes
  `
});
```

### 4. Batch Operations
Group multiple operations in a single execute_code call:

```javascript
// ❌ Inefficient: Multiple calls
for (let i = 0; i < 10; i++) {
  await mcp_penpot_execute_code({
    code: `const rect = penpot.createRectangle(); rect.x = ${i * 100};`
  });
}

// ✅ Efficient: Single call
await mcp_penpot_execute_code({
  code: `
    for (let i = 0; i < 10; i++) {
      const rect = penpot.createRectangle();
      rect.x = i * 100;
    }
    return { created: 10 };
  `
});
```

### 5. Query Before Modify
Check shape properties before modifying:

```javascript
await mcp_penpot_execute_code({
  code: `
    const shape = penpot.selection[0];
    
    // Check if shape supports fills
    if (!('fills' in shape)) {
      return { error: 'Shape does not support fills' };
    }
    
    // Check if shape is locked
    if (shape.blocked) {
      return { error: 'Shape is locked' };
    }
    
    shape.fills = [{ fillColor: '#FF0000' }];
    return { success: true };
  `
});
```

### 6. Use Descriptive Names
Always name created shapes for easier debugging:

```javascript
const rect = penpot.createRectangle();
rect.name = 'Button Background';  // ✅ Good

const rect2 = penpot.createRectangle();
// rect2.name stays as default  // ❌ Bad
```

### 7. Return Useful Information
Return IDs and properties for further operations:

```javascript
return {
  id: shape.id,
  name: shape.name,
  type: shape.type,
  bounds: {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height
  }
};
```

---

## Troubleshooting

### Plugin Not Connected
**Error:** "No Penpot plugin instances are currently connected"

**Solutions:**
1. Ensure Penpot is open in browser
2. Load the plugin: Plugins → Load plugin → `http://localhost:4400/manifest.json`
3. Open the plugin UI
4. Click "Connect to MCP server"
5. Verify WebSocket connection in browser console

### Code Execution Timeout
**Error:** Task timeout after 30 seconds

**Solutions:**
1. Break complex operations into smaller chunks
2. Avoid infinite loops
3. Use async/await for long operations
4. Check for browser console errors

### Shape Not Found
**Error:** Cannot read property of undefined

**Solutions:**
1. Check if shape exists: `penpot.currentPage.findShapes({ id: shapeId })`
2. Verify shape is on current page
3. Check if shape was deleted

### API Method Not Available
**Error:** Property/method does not exist

**Solutions:**
1. Use `mcp_penpot_penpot_api_info` to check available methods
2. Verify Penpot version compatibility
3. Check if feature is in beta/experimental

---

## Integration Checklist

When integrating Penpot MCP into your project:

- [ ] Verify Penpot MCP server is running (port 4401 & 4402)
- [ ] Load and connect Penpot plugin in browser
- [ ] Test basic connection with `execute_code`
- [ ] Review available tools and their parameters
- [ ] Understand the Penpot API for your use case
- [ ] Implement error handling for disconnections
- [ ] Store frequently used data in `storage`
- [ ] Document any custom helper functions
- [ ] Test with different file states (empty, with components, etc.)
- [ ] Consider user permissions and file access

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    PENPOT MCP QUICK REF                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TOOLS                                                      │
│  • execute_code          - Run any JavaScript              │
│  • penpot_api_info      - Get API docs                     │
│  • export_shape         - Export PNG/SVG                   │
│  • import_image         - Import image file                │
│  • create_shape_from_css - Create from CSS                 │
│                                                             │
│  COMMON OPERATIONS                                          │
│  • Get selection:    penpot.selection                      │
│  • Create shape:     penpot.createRectangle()              │
│  • Find shapes:      page.findShapes()                     │
│  • Create component: library.local.createComponent([...])  │
│  • Group shapes:     penpot.group([...])                   │
│                                                             │
│  SHAPE PROPERTIES                                           │
│  • Position:    x, y, width, height, rotation              │
│  • Visual:      fills, strokes, opacity, shadows           │
│  • Hierarchy:   parent, children, appendChild()            │
│  • Methods:     resize(), rotate(), clone(), remove()      │
│                                                             │
│  DESIGN SYSTEM                                              │
│  • Colors:      penpot.library.local.colors                │
│  • Typography:  penpot.library.local.typographies          │
│  • Components:  penpot.library.local.components            │
│                                                             │
│  STORAGE                                                    │
│  • Persist data: storage.myData = { ... }                  │
│  • Retrieve:     const data = storage.myData               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Version & Compatibility

- **Penpot MCP Version:** 1.0.0
- **Penpot Plugin API:** Latest
- **Node.js:** v22+ recommended
- **Browsers:** Chrome, Firefox, Safari (Brave requires shield disabled)

---

## Additional Resources

- **Penpot Plugin API Docs:** Access via `mcp_penpot_penpot_api_info`
- **MCP Server README:** `/mcp-server/README.md`
- **Architecture Overview:** `/README.md`
- **API Types:** `/mcp-server/data/api_types.yml`

---

## Support & Contributing

For issues, questions, or contributions:
- Check existing documentation
- Review error messages in browser console
- Test with minimal reproduction case
- Report bugs with code examples

---

**Happy designing with AI! 🎨🤖**

