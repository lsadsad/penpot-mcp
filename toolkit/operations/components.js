/**
 * Component Operations
 * Functions for managing Penpot components and instances
 */

/**
 * List all components in the local library
 * @returns {string} Code to execute
 */
export const listComponents = () => `
const lib = penpot.library.local;
return lib.components.map(c => ({
  name: c.name,
  id: c.id,
  path: c.path
}));
`;

/**
 * Create a component from shape IDs
 * @param {string[]} shapeIds - Array of shape IDs to create component from
 * @param {string} name - Name for the component
 * @returns {string} Code to execute
 */
export const createComponent = (shapeIds, name) => `
const shapes = ${JSON.stringify(shapeIds)}
  .map(id => penpot.currentPage.findShapeById(id))
  .filter(Boolean);

if (shapes.length === 0) {
  throw new Error('No valid shapes found with provided IDs: ${JSON.stringify(shapeIds)}');
}

// Group if multiple shapes
let shapesToComponent = shapes;
if (shapes.length > 1) {
  const group = penpot.group(shapes);
  shapesToComponent = [group];
}

// Create component
const component = penpot.library.local.createComponent(shapesToComponent);
component.name = ${JSON.stringify(name)};

return {
  id: component.id,
  name: component.name,
  shapeCount: shapes.length
};
`;

/**
 * Create component from current selection
 * @returns {string} Code to execute
 */
export const createComponentFromSelection = () => `
const selected = penpot.selection;

if (selected.length === 0) {
  throw new Error('No shapes selected');
}

// Group if multiple shapes
let shapes = selected;
if (selected.length > 1) {
  const group = penpot.group(selected);
  shapes = [group];
}

// Create component
const component = penpot.library.local.createComponent(shapes);

return {
  componentId: component.id,
  componentName: component.name,
  shapesCount: selected.length
};
`;

/**
 * Find all instances of a component
 * @param {string} [componentId] - Optional component ID to filter by
 * @returns {string} Code to execute
 */
export const findComponentInstances = (componentId = null) => `
const allShapes = penpot.currentPage.findShapes();
const instances = allShapes.filter(s => s.isComponentInstance());

const result = instances.map(inst => {
  const comp = inst.component();
  return {
    shapeId: inst.id,
    shapeName: inst.name,
    componentName: comp?.name,
    componentId: comp?.id,
    isMain: inst.isComponentMainInstance(),
    x: inst.x,
    y: inst.y
  };
});

${componentId ? `
// Filter by specific component ID
return result.filter(r => r.componentId === ${JSON.stringify(componentId)});
` : `
// Return all instances
return result;
`}
`;

/**
 * Sync all instances of a component (update from main)
 * @param {string} componentId - Component ID to sync
 * @returns {string} Code to execute
 */
export const syncInstances = (componentId) => `
const lib = penpot.library.local;
const component = lib.components.find(c => c.id === ${JSON.stringify(componentId)});

if (!component) {
  throw new Error('Component not found: ${componentId}');
}

// Find all instances in current page
const allShapes = penpot.currentPage.findShapes();
const instances = allShapes.filter(shape => {
  if (!shape.isComponentInstance()) return false;
  const c = shape.component();
  return c && c.id === ${JSON.stringify(componentId)};
});

// Sync each instance
instances.forEach(instance => {
  if (instance.syncComponent) {
    instance.syncComponent();
  }
});

return {
  componentName: component.name,
  componentId: component.id,
  syncedInstances: instances.length
};
`;

/**
 * Delete a component from the library
 * @param {string} componentId - Component ID to delete
 * @returns {string} Code to execute
 */
export const deleteComponent = (componentId) => `
const lib = penpot.library.local;
const component = lib.components.find(c => c.id === ${JSON.stringify(componentId)});

if (!component) {
  throw new Error('Component not found: ${componentId}');
}

const componentName = component.name;

// Find all instances first
const allShapes = penpot.currentPage.findShapes();
const instances = allShapes.filter(shape => {
  if (!shape.isComponentInstance()) return false;
  const c = shape.component();
  return c && c.id === ${JSON.stringify(componentId)};
});

// Delete component (instances remain as regular shapes)
lib.deleteComponent(${JSON.stringify(componentId)});

return {
  deleted: componentName,
  instanceCount: instances.length,
  note: 'Instances converted to regular shapes'
};
`;

/**
 * Detach an instance from its component (convert to regular shapes)
 * @param {string} instanceId - Instance shape ID to detach
 * @returns {string} Code to execute
 */
export const detachInstance = (instanceId) => `
const instance = penpot.currentPage.findShapeById(${JSON.stringify(instanceId)});

if (!instance) {
  throw new Error('Shape not found: ${instanceId}');
}

if (!instance.isComponentInstance()) {
  throw new Error('Shape is not a component instance: ${instanceId}');
}

const componentName = instance.component()?.name;

// Detach from component
instance.detach();

return {
  instanceId: ${JSON.stringify(instanceId)},
  wasComponent: componentName,
  status: 'detached',
  note: 'Shape is now independent from component'
};
`;

/**
 * Get component usage statistics
 * @returns {string} Code to execute
 */
export const getComponentStats = () => `
const allShapes = penpot.currentPage.findShapes();
const components = penpot.library.local.components;

const stats = components.map(comp => {
  const instances = allShapes.filter(shape => {
    if (!shape.isComponentInstance()) return false;
    const c = shape.component();
    return c && c.id === comp.id;
  });

  return {
    name: comp.name,
    id: comp.id,
    instanceCount: instances.length,
    locations: instances.map(i => ({
      x: i.x,
      y: i.y,
      name: i.name
    }))
  };
});

return {
  totalComponents: components.length,
  stats
};
`;

/**
 * Update properties of all instances of a component
 * @param {string} componentName - Component name to find instances of
 * @param {object} properties - Properties to update (e.g., {opacity: 0.9})
 * @returns {string} Code to execute
 */
export const updateComponentInstances = (componentName, properties) => `
const allShapes = penpot.currentPage.findShapes();

const instances = allShapes.filter(shape => {
  if (!shape.isComponentInstance()) return false;
  const comp = shape.component();
  return comp && comp.name === ${JSON.stringify(componentName)};
});

// Apply properties to all instances
const props = ${JSON.stringify(properties)};
instances.forEach(instance => {
  Object.keys(props).forEach(key => {
    if (key in instance) {
      instance[key] = props[key];
    }
  });
});

return {
  componentName: ${JSON.stringify(componentName)},
  instancesFound: instances.length,
  updated: instances.length,
  properties: props
};
`;

/**
 * Create a variant of an existing component
 * @param {string} componentName - Original component name
 * @param {string} variantName - New variant name
 * @param {object} modifications - Properties to modify (e.g., {fillColor: '#8B5CF6'})
 * @returns {string} Code to execute
 */
export const createComponentVariant = (componentName, variantName, modifications) => `
// Find original component
const component = penpot.library.local.components
  .find(c => c.name === ${JSON.stringify(componentName)});

if (!component) {
  throw new Error('Component not found: ${componentName}');
}

// Clone the main instance
const original = component.mainInstance;
const variant = original.clone();
variant.name = ${JSON.stringify(variantName)};
variant.x = original.x + original.width + 50;

// Apply modifications
const mods = ${JSON.stringify(modifications)};
Object.keys(mods).forEach(key => {
  if (key === 'fillColor' && variant.fills) {
    variant.fills = [{ fillColor: mods[key] }];
  } else if (key in variant) {
    variant[key] = mods[key];
  }
});

// Create new component from variant
const newComponent = penpot.library.local.createComponent([variant]);

return {
  originalComponent: component.name,
  newComponent: newComponent.name,
  newComponentId: newComponent.id,
  variantId: variant.id
};
`;

/**
 * Find components that have no instances (unused components)
 * @returns {string} Code to execute
 */
export const findUnusedComponents = () => `
const components = penpot.library.local.components;
const allShapes = penpot.currentPage.findShapes();

const unused = components.filter(comp => {
  const hasInstance = allShapes.some(shape => {
    if (!shape.isComponentInstance()) return false;
    const c = shape.component();
    return c && c.id === comp.id;
  });
  return !hasInstance;
});

return {
  totalComponents: components.length,
  unusedCount: unused.length,
  unused: unused.map(c => ({ name: c.name, id: c.id, path: c.path }))
};
`;
