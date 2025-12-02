/**
 * Layout Operations
 * Functions for positioning, aligning, and distributing shapes
 */

export const distributeHorizontally = () => `
const selected = penpot.selection;

if (selected.length < 2) {
  throw new Error('Select at least 2 shapes');
}

penpot.distributeHorizontal(selected);
return { distributed: selected.length };
`;

export const distributeVertically = () => `
const selected = penpot.selection;

if (selected.length < 2) {
  throw new Error('Select at least 2 shapes');
}

penpot.distributeVertical(selected);
return { distributed: selected.length };
`;

export const alignHorizontal = (alignment = 'center') => `
const selected = penpot.selection;

if (selected.length < 2) {
  throw new Error('Select at least 2 shapes');
}

penpot.alignHorizontal(selected, ${JSON.stringify(alignment)});
return { aligned: selected.length, alignment: ${JSON.stringify(alignment)} };
`;

export const alignVertical = (alignment = 'center') => `
const selected = penpot.selection;

if (selected.length < 2) {
  throw new Error('Select at least 2 shapes');
}

penpot.alignVertical(selected, ${JSON.stringify(alignment)});
return { aligned: selected.length, alignment: ${JSON.stringify(alignment)} };
`;

export const alignToCenter = () => `
const selected = penpot.selection;

if (selected.length < 2) {
  throw new Error('Select at least 2 shapes');
}

penpot.alignHorizontal(selected, 'center');
penpot.alignVertical(selected, 'center');

return { aligned: selected.length };
`;

export const createFlexLayout = (shapeIds, direction, spacing) => `
const shapes = ${JSON.stringify(shapeIds)}
  .map(id => penpot.currentPage.findShapeById(id))
  .filter(Boolean);

if (shapes.length === 0) {
  throw new Error('No valid shapes found');
}

const container = penpot.group(shapes);
container.name = 'Flex Container';

if (container.layout) {
  container.layout = {
    dir: ${JSON.stringify(direction)},
    gap: ${spacing}
  };
}

return {
  containerId: container.id,
  direction: ${JSON.stringify(direction)},
  spacing: ${spacing},
  itemCount: shapes.length
};
`;

export const createAutoLayout = (config) => `
const cfg = ${JSON.stringify(config)};

// Create container with auto-layout
const container = penpot.createBoard();
container.name = cfg.name || 'Auto Layout';
container.x = cfg.x || 100;
container.y = cfg.y || 100;

if (container.layout) {
  container.layout = {
    dir: cfg.direction || 'column',
    gap: cfg.gap || 16,
    padding: cfg.padding || { top: 16, right: 16, bottom: 16, left: 16 },
    horizontalAlign: cfg.horizontalAlign || 'start',
    verticalAlign: cfg.verticalAlign || 'start'
  };
}

return {
  containerId: container.id,
  layout: container.layout
};
`;
