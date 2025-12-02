/**
 * Design Token Operations
 * Functions for managing design tokens (colors, typography, etc.)
 */

/**
 * Extract all design tokens from the library
 * @returns {string} Code to execute
 */
export const extractTokens = () => `
const lib = penpot.library.local;

return {
  colors: lib.colors.map(c => ({
    name: c.name,
    color: c.color,
    opacity: c.opacity,
    id: c.id
  })),
  typography: lib.typographies.map(t => ({
    name: t.name,
    fontFamily: t.fontFamily,
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    fontStyle: t.fontStyle,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
    id: t.id
  })),
  components: lib.components.map(c => ({
    name: c.name,
    id: c.id,
    path: c.path
  }))
};
`;

/**
 * Create a color token in the library
 * @param {string} name - Color token name
 * @param {string} color - Hex color value (e.g., '#3B82F6')
 * @param {number} [opacity=1] - Opacity (0-1)
 * @returns {string} Code to execute
 */
export const createColorToken = (name, color, opacity = 1) => `
const lib = penpot.library.local;

// Check if color already exists
const existing = lib.colors.find(c => c.name === ${JSON.stringify(name)});
if (existing) {
  throw new Error('Color token already exists: ${name}');
}

const colorToken = lib.createColor(${JSON.stringify(name)}, ${JSON.stringify(color)});
if (${opacity} !== 1) {
  colorToken.opacity = ${opacity};
}

return {
  id: colorToken.id,
  name: colorToken.name,
  color: colorToken.color,
  opacity: colorToken.opacity || 1
};
`;

/**
 * Create a typography token in the library
 * @param {string} name - Typography token name
 * @param {object} style - Typography style properties
 * @returns {string} Code to execute
 */
export const createTypographyToken = (name, style) => `
const lib = penpot.library.local;

// Check if typography already exists
const existing = lib.typographies.find(t => t.name === ${JSON.stringify(name)});
if (existing) {
  throw new Error('Typography token already exists: ${name}');
}

const typo = lib.createTypography(${JSON.stringify(name)}, ${JSON.stringify(style)});

return {
  id: typo.id,
  name: typo.name,
  fontFamily: typo.fontFamily,
  fontSize: typo.fontSize,
  fontWeight: typo.fontWeight,
  lineHeight: typo.lineHeight
};
`;

/**
 * Update an existing color token
 * @param {string} tokenId - Color token ID
 * @param {object} updates - Properties to update
 * @returns {string} Code to execute
 */
export const updateColorToken = (tokenId, updates) => `
const lib = penpot.library.local;
const token = lib.colors.find(c => c.id === ${JSON.stringify(tokenId)});

if (!token) {
  throw new Error('Color token not found: ${tokenId}');
}

const oldValues = {
  name: token.name,
  color: token.color,
  opacity: token.opacity
};

// Apply updates
const updates = ${JSON.stringify(updates)};
Object.keys(updates).forEach(key => {
  if (key in token) {
    token[key] = updates[key];
  }
});

return {
  id: token.id,
  oldValues,
  newValues: {
    name: token.name,
    color: token.color,
    opacity: token.opacity
  }
};
`;

/**
 * Delete a color token from the library
 * @param {string} tokenId - Color token ID to delete
 * @returns {string} Code to execute
 */
export const deleteColorToken = (tokenId) => `
const lib = penpot.library.local;
const token = lib.colors.find(c => c.id === ${JSON.stringify(tokenId)});

if (!token) {
  throw new Error('Color token not found: ${tokenId}');
}

const tokenName = token.name;
lib.deleteColor(${JSON.stringify(tokenId)});

return {
  deleted: tokenName,
  id: ${JSON.stringify(tokenId)}
};
`;

/**
 * Delete a typography token from the library
 * @param {string} tokenId - Typography token ID to delete
 * @returns {string} Code to execute
 */
export const deleteTypographyToken = (tokenId) => `
const lib = penpot.library.local;
const token = lib.typographies.find(t => t.id === ${JSON.stringify(tokenId)});

if (!token) {
  throw new Error('Typography token not found: ${tokenId}');
}

const tokenName = token.name;
lib.deleteTypography(${JSON.stringify(tokenId)});

return {
  deleted: tokenName,
  id: ${JSON.stringify(tokenId)}
};
`;

/**
 * Apply a color token to shapes
 * @param {string[]} shapeIds - Array of shape IDs
 * @param {string} tokenName - Color token name to apply
 * @returns {string} Code to execute
 */
export const applyColorToken = (shapeIds, tokenName) => `
const lib = penpot.library.local;
const colorToken = lib.colors.find(c => c.name === ${JSON.stringify(tokenName)});

if (!colorToken) {
  throw new Error('Color token not found: ${tokenName}');
}

const shapes = ${JSON.stringify(shapeIds)}
  .map(id => penpot.currentPage.findShapeById(id))
  .filter(Boolean);

if (shapes.length === 0) {
  throw new Error('No valid shapes found');
}

let applied = 0;
shapes.forEach(shape => {
  if (shape.fills) {
    shape.fills = [{ fillColor: colorToken.color, fillOpacity: colorToken.opacity || 1 }];
    applied++;
  }
});

return {
  tokenName: ${JSON.stringify(tokenName)},
  color: colorToken.color,
  shapesApplied: applied
};
`;

/**
 * Apply a typography token to text shapes
 * @param {string[]} shapeIds - Array of text shape IDs
 * @param {string} tokenName - Typography token name to apply
 * @returns {string} Code to execute
 */
export const applyTypographyToken = (shapeIds, tokenName) => `
const lib = penpot.library.local;
const typoToken = lib.typographies.find(t => t.name === ${JSON.stringify(tokenName)});

if (!typoToken) {
  throw new Error('Typography token not found: ${tokenName}');
}

const shapes = ${JSON.stringify(shapeIds)}
  .map(id => penpot.currentPage.findShapeById(id))
  .filter(Boolean);

if (shapes.length === 0) {
  throw new Error('No valid shapes found');
}

let applied = 0;
shapes.forEach(shape => {
  if (shape.type === 'text') {
    shape.fontFamily = typoToken.fontFamily;
    shape.fontSize = typoToken.fontSize;
    shape.fontWeight = typoToken.fontWeight;
    shape.fontStyle = typoToken.fontStyle;
    shape.lineHeight = typoToken.lineHeight;
    shape.letterSpacing = typoToken.letterSpacing;
    applied++;
  }
});

return {
  tokenName: ${JSON.stringify(tokenName)},
  shapesApplied: applied,
  fontFamily: typoToken.fontFamily
};
`;

/**
 * Get color palette from shapes in current page
 * @returns {string} Code to execute
 */
export const getColorPalette = () => `
const shapes = penpot.currentPage.findShapes();
const colors = new Set();

shapes.forEach(shape => {
  shape.fills?.forEach(fill => {
    if (fill.fillColor) colors.add(fill.fillColor);
  });
  shape.strokes?.forEach(stroke => {
    if (stroke.strokeColor) colors.add(stroke.strokeColor);
  });
});

return {
  uniqueColors: Array.from(colors).sort(),
  totalShapes: shapes.length,
  colorCount: colors.size
};
`;

/**
 * Export design tokens as JSON
 * @param {string} [format='json'] - Export format (json, css, scss)
 * @returns {string} Code to execute
 */
export const exportTokens = (format = 'json') => `
const lib = penpot.library.local;

const tokens = {
  colors: lib.colors.map(c => ({
    name: c.name,
    value: c.color,
    opacity: c.opacity || 1,
    id: c.id
  })),
  typography: lib.typographies.map(t => ({
    name: t.name,
    fontFamily: t.fontFamily,
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    fontStyle: t.fontStyle,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
    id: t.id
  }))
};

// Convert to requested format
const format = ${JSON.stringify(format)};

if (format === 'css') {
  const css = [':root {'];
  tokens.colors.forEach(c => {
    const varName = '--' + c.name.toLowerCase().replace(/\\s+/g, '-');
    css.push(\`  \${varName}: \${c.value};\`);
  });
  tokens.typography.forEach(t => {
    const varName = '--font-' + t.name.toLowerCase().replace(/\\s+/g, '-');
    css.push(\`  \${varName}-family: \${t.fontFamily};\`);
    css.push(\`  \${varName}-size: \${t.fontSize}px;\`);
    css.push(\`  \${varName}-weight: \${t.fontWeight};\`);
  });
  css.push('}');
  return { format: 'css', output: css.join('\\n') };
}

if (format === 'scss') {
  const scss = [];
  tokens.colors.forEach(c => {
    const varName = '$' + c.name.toLowerCase().replace(/\\s+/g, '-');
    scss.push(\`\${varName}: \${c.value};\`);
  });
  scss.push('');
  tokens.typography.forEach(t => {
    const varName = '$font-' + t.name.toLowerCase().replace(/\\s+/g, '-');
    scss.push(\`\${varName}-family: \${t.fontFamily};\`);
    scss.push(\`\${varName}-size: \${t.fontSize}px;\`);
    scss.push(\`\${varName}-weight: \${t.fontWeight};\`);
  });
  return { format: 'scss', output: scss.join('\\n') };
}

// Default: JSON
return { format: 'json', output: JSON.stringify(tokens, null, 2) };
`;

/**
 * Import design tokens from JSON
 * @param {object} tokens - Tokens object with colors and typography
 * @returns {string} Code to execute
 */
export const importTokens = (tokens) => `
const lib = penpot.library.local;
const tokensData = ${JSON.stringify(tokens)};
const results = { colors: [], typography: [], errors: [] };

// Import colors
if (tokensData.colors) {
  tokensData.colors.forEach(colorData => {
    try {
      // Check if already exists
      const existing = lib.colors.find(c => c.name === colorData.name);
      if (existing) {
        results.errors.push(\`Color '\${colorData.name}' already exists\`);
        return;
      }

      const color = lib.createColor(colorData.name, colorData.value || colorData.color);
      if (colorData.opacity && colorData.opacity !== 1) {
        color.opacity = colorData.opacity;
      }
      results.colors.push({ name: color.name, id: color.id });
    } catch (err) {
      results.errors.push(\`Failed to import color '\${colorData.name}': \${err.message}\`);
    }
  });
}

// Import typography
if (tokensData.typography) {
  tokensData.typography.forEach(typoData => {
    try {
      // Check if already exists
      const existing = lib.typographies.find(t => t.name === typoData.name);
      if (existing) {
        results.errors.push(\`Typography '\${typoData.name}' already exists\`);
        return;
      }

      const typo = lib.createTypography(typoData.name, {
        fontFamily: typoData.fontFamily,
        fontSize: typoData.fontSize,
        fontWeight: typoData.fontWeight,
        fontStyle: typoData.fontStyle,
        lineHeight: typoData.lineHeight,
        letterSpacing: typoData.letterSpacing
      });
      results.typography.push({ name: typo.name, id: typo.id });
    } catch (err) {
      results.errors.push(\`Failed to import typography '\${typoData.name}': \${err.message}\`);
    }
  });
}

return {
  imported: {
    colors: results.colors.length,
    typography: results.typography.length
  },
  details: results,
  hasErrors: results.errors.length > 0
};
`;

/**
 * Store design tokens in persistent storage
 * @returns {string} Code to execute
 */
export const storeTokens = () => `
const lib = penpot.library.local;

storage.designTokens = {
  colors: Object.fromEntries(
    lib.colors.map(c => [
      c.name.replace(/\\s+/g, '-').toLowerCase(),
      c.color
    ])
  ),
  typography: Object.fromEntries(
    lib.typographies.map(t => [
      t.name.replace(/\\s+/g, '-').toLowerCase(),
      {
        fontFamily: t.fontFamily,
        fontSize: t.fontSize,
        fontWeight: t.fontWeight,
        lineHeight: t.lineHeight
      }
    ])
  ),
  timestamp: new Date().toISOString()
};

return {
  stored: true,
  colorCount: lib.colors.length,
  typographyCount: lib.typographies.length,
  tokens: storage.designTokens
};
`;
