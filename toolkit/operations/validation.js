/**
 * Validation Operations
 * Functions for validating designs and finding issues
 */

export const validateDesignSystem = (rules) => `
const validationRules = ${JSON.stringify(rules)};
const selected = penpot.selection;
const issues = [];

selected.forEach(shape => {
  // Check touch target size
  if (shape.type === 'rectangle' || shape.type === 'ellipse') {
    const minSize = validationRules.minTouchTarget || 44;
    if (shape.width < minSize || shape.height < minSize) {
      issues.push({
        shape: shape.name,
        issue: 'Too small for touch target',
        size: { w: shape.width, h: shape.height },
        min: minSize
      });
    }
  }

  // Check colors
  if (validationRules.allowedColors) {
    shape.fills?.forEach(fill => {
      if (fill.fillColor && !validationRules.allowedColors.includes(fill.fillColor)) {
        issues.push({
          shape: shape.name,
          issue: 'Color not in design system',
          color: fill.fillColor
        });
      }
    });
  }

  // Check text size
  if (shape.type === 'text' && validationRules.minTextSize && validationRules.maxTextSize) {
    const size = parseInt(shape.fontSize);
    if (size < validationRules.minTextSize || size > validationRules.maxTextSize) {
      issues.push({
        shape: shape.name,
        issue: 'Font size out of range',
        fontSize: size,
        allowed: \`\${validationRules.minTextSize}-\${validationRules.maxTextSize}\`
      });
    }
  }
});

return {
  validated: selected.length,
  issuesFound: issues.length,
  issues
};
`;

export const findUnusedColors = () => `
const lib = penpot.library.local;
const allShapes = penpot.currentPage.findShapes();
const usedColors = new Set();

// Collect all colors used in shapes
allShapes.forEach(shape => {
  shape.fills?.forEach(fill => {
    if (fill.fillColor) usedColors.add(fill.fillColor);
  });
  shape.strokes?.forEach(stroke => {
    if (stroke.strokeColor) usedColors.add(stroke.strokeColor);
  });
});

// Find library colors not in use
const unused = lib.colors.filter(c => !usedColors.has(c.color));

return {
  totalLibraryColors: lib.colors.length,
  usedColors: usedColors.size,
  unusedColors: unused.length,
  unused: unused.map(c => ({ name: c.name, color: c.color }))
};
`;

export const findInconsistentSpacing = () => `
const selected = penpot.selection;

if (selected.length < 2) {
  throw new Error('Select at least 2 shapes');
}

// Sort by x position
const sorted = selected.slice().sort((a, b) => a.x - b.x);
const spacings = [];

for (let i = 0; i < sorted.length - 1; i++) {
  const current = sorted[i];
  const next = sorted[i + 1];
  const gap = next.x - (current.x + current.width);
  spacings.push({
    between: \`\${current.name} → \${next.name}\`,
    gap: Math.round(gap)
  });
}

// Find inconsistent spacings
const uniqueGaps = [...new Set(spacings.map(s => s.gap))];
const isConsistent = uniqueGaps.length === 1;

return {
  isConsistent,
  spacings,
  uniqueGaps,
  recommendation: isConsistent ? 'Spacing is consistent' : 'Consider using consistent spacing'
};
`;

export const auditAccessibility = () => `
const selected = penpot.selection;
const issues = [];

selected.forEach(shape => {
  // Check contrast (simplified)
  if (shape.type === 'text') {
    issues.push({
      shape: shape.name,
      type: 'contrast',
      note: 'Verify text contrast ratio meets WCAG standards',
      textColor: shape.fills?.[0]?.fillColor
    });
  }

  // Check interactive element sizes
  if (shape.name.toLowerCase().includes('button') ||
      shape.name.toLowerCase().includes('link')) {
    if (shape.width < 44 || shape.height < 44) {
      issues.push({
        shape: shape.name,
        type: 'touch-target',
        issue: 'Interactive element smaller than 44x44px',
        size: { w: shape.width, h: shape.height }
      });
    }
  }

  // Check for missing labels
  if (shape.children?.length > 0 && !shape.name.trim()) {
    issues.push({
      shape: 'Unnamed group',
      type: 'missing-label',
      issue: 'Group or component should have a descriptive name'
    });
  }
});

return {
  audited: selected.length,
  issuesFound: issues.length,
  issues
};
`;
