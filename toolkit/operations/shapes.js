/**
 * Shape Operations
 * Functions for creating, modifying, and querying shapes
 */

// ===== QUERY OPERATIONS =====

export const getSelection = () => `
return penpot.selection.map(shape => ({
  id: shape.id,
  name: shape.name,
  type: shape.type,
  x: shape.x,
  y: shape.y,
  width: shape.width,
  height: shape.height,
  fills: shape.fills?.map(f => f.fillColor),
  isComponent: shape.isComponentInstance()
}));
`;

export const findShapesByType = (shapeType) => `
const shapes = penpot.currentPage.findShapes();
return shapes
  .filter(s => s.type === ${JSON.stringify(shapeType)})
  .map(s => ({ id: s.id, name: s.name, type: s.type }));
`;

export const findShapesByName = (pattern) => `
const shapes = penpot.currentPage.findShapes();
return shapes
  .filter(s => s.name.includes(${JSON.stringify(pattern)}))
  .map(s => ({ id: s.id, name: s.name, type: s.type }));
`;

export const getPageStructure = () => `
return {
  fileName: penpot.currentFile?.name,
  currentPage: penpot.currentPage?.name,
  totalPages: penpot.currentFile?.pages.length,
  pages: penpot.currentFile?.pages.map(p => ({
    id: p.id,
    name: p.name
  }))
};
`;

// ===== CREATION OPERATIONS =====

export const createButton = (x = 100, y = 100, label = "Click Me") => `
const bg = penpot.createRectangle();
bg.name = 'Button Background';
bg.resize(120, 44);
bg.x = ${x};
bg.y = ${y};
bg.fills = [{ fillColor: '#3B82F6' }];
bg.borderRadius = 8;

const text = penpot.createText(${JSON.stringify(label)});
text.name = 'Button Label';
text.x = bg.x + 30;
text.y = bg.y + 14;
text.fills = [{ fillColor: '#FFFFFF' }];
text.fontSize = '16';
text.fontWeight = '600';

const button = penpot.group([bg, text]);
button.name = 'Button';

return { buttonId: button.id, x: button.x, y: button.y };
`;

export const createCard = (x = 100, y = 100, title = "Card Title") => `
const card = penpot.createRectangle();
card.name = 'Card';
card.resize(300, 200);
card.x = ${x};
card.y = ${y};
card.fills = [{ fillColor: '#FFFFFF' }];
card.borderRadius = 12;
card.shadows = [{
  color: '#00000026',
  offsetX: 0,
  offsetY: 4,
  blur: 12,
  spread: 0
}];

const titleText = penpot.createText(${JSON.stringify(title)});
titleText.name = 'Title';
titleText.x = card.x + 20;
titleText.y = card.y + 20;
titleText.fontSize = '20';
titleText.fontWeight = '700';

const desc = penpot.createText('Card description text goes here');
desc.name = 'Description';
desc.x = card.x + 20;
desc.y = card.y + 50;
desc.fontSize = '14';
desc.fills = [{ fillColor: '#6B7280' }];

card.appendChild(titleText);
card.appendChild(desc);

return { cardId: card.id };
`;

export const createGrid = (config) => `
const cfg = ${JSON.stringify(config)};
const items = [];

for (let row = 0; row < cfg.rows; row++) {
  for (let col = 0; col < cfg.cols; col++) {
    const rect = penpot.createRectangle();
    rect.resize(cfg.itemWidth, cfg.itemHeight);
    rect.x = cfg.startX + (col * (cfg.itemWidth + cfg.gap));
    rect.y = cfg.startY + (row * (cfg.itemHeight + cfg.gap));
    rect.fills = [{ fillColor: '#E5E7EB' }];
    rect.borderRadius = 8;
    rect.name = \`Grid Item \${row}-\${col}\`;
    items.push(rect);
  }
}

const grid = penpot.group(items);
grid.name = 'Grid Layout';

return { gridId: grid.id, totalItems: items.length };
`;

// ===== MODIFICATION OPERATIONS =====

export const applyThemeToSelection = (theme) => `
const themeColors = ${JSON.stringify(theme)};
const selected = penpot.selection;
let modified = 0;

selected.forEach(shape => {
  if (shape.type === 'rectangle' || shape.type === 'ellipse') {
    shape.fills = [{ fillColor: themeColors.background }];
    shape.strokes = [{
      strokeColor: themeColors.border,
      strokeWidth: 1,
      strokeStyle: 'solid',
      strokeAlignment: 'inner'
    }];
    modified++;
  }

  if (shape.type === 'text') {
    shape.fills = [{ fillColor: themeColors.text }];
    modified++;
  }
});

return { modified, theme: themeColors };
`;

export const resizeSelection = (scaleFactor) => `
const selected = penpot.selection;

selected.forEach(shape => {
  const newWidth = shape.width * ${scaleFactor};
  const newHeight = shape.height * ${scaleFactor};
  shape.resize(newWidth, newHeight);
});

return { resized: selected.length, scaleFactor: ${scaleFactor} };
`;

export const addRoundedCorners = (radius) => `
const selected = penpot.selection;
let modified = 0;

selected.forEach(shape => {
  if ('borderRadius' in shape) {
    shape.borderRadius = ${radius};
    modified++;
  }
});

return { modified, radius: ${radius} };
`;

// ===== DATA EXTRACTION =====

export const exportShapeData = (shapeId = null) => `
const shape = ${shapeId ? `penpot.currentPage.findShapeById(${JSON.stringify(shapeId)})` : 'penpot.selection[0]'};

if (!shape) {
  throw new Error('No shape ${shapeId ? 'found' : 'selected'}');
}

return {
  id: shape.id,
  name: shape.name,
  type: shape.type,
  geometry: {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
    rotation: shape.rotation
  },
  style: {
    fills: shape.fills,
    strokes: shape.strokes,
    opacity: shape.opacity,
    shadows: shape.shadows,
    blurs: shape.blurs
  },
  hierarchy: {
    parent: shape.parent?.name,
    childrenCount: shape.children?.length || 0,
    children: shape.children?.map(c => ({ id: c.id, name: c.name }))
  }
};
`;

export const generateCss = (includeChildren = true) => `
const selected = penpot.selection;

if (selected.length === 0) {
  throw new Error('No shapes selected');
}

const css = penpot.generateStyle(selected, {
  type: 'css',
  withPrelude: true,
  includeChildren: ${includeChildren}
});

return { css };
`;

export const generateHtml = () => `
const selected = penpot.selection;

if (selected.length === 0) {
  throw new Error('No shapes selected');
}

const html = penpot.generateMarkup(selected, { type: 'html' });
return { html };
`;

// ===== UTILITY =====

export const batchCreate = (items) => `
const itemsData = ${JSON.stringify(items)};
const created = itemsData.map((data, i) => {
  const shape = penpot.createRectangle();
  shape.name = data.name || \`Shape \${i}\`;
  shape.resize(data.width || 100, data.height || 100);
  shape.x = data.x || (100 + i * 120);
  shape.y = data.y || 100;
  if (data.color) shape.fills = [{ fillColor: data.color }];
  if (data.borderRadius) shape.borderRadius = data.borderRadius;
  return { id: shape.id, name: shape.name };
});

return { created: created.length, shapes: created };
`;
