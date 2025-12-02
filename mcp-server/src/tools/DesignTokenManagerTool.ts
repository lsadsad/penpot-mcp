import { z } from "zod";
import { Tool } from "../Tool";
import { TextResponse, ToolResponse } from "../ToolResponse";
import "reflect-metadata";
import { PenpotMcpServer } from "../PenpotMcpServer";
import { ExecuteCodePluginTask } from "../tasks/ExecuteCodePluginTask";

/**
 * Arguments schema for DesignTokenManagerTool
 */
export class DesignTokenManagerArgs {
    static schema = {
        operation: z
            .enum([
                "list",
                "extract",
                "create_color",
                "create_typography",
                "update_color",
                "delete_color",
                "delete_typography",
                "apply_color",
                "apply_typography",
                "export",
                "import",
                "get_palette",
            ])
            .describe(
                "Operation to perform: " +
                    "'list' - List all tokens, " +
                    "'extract' - Extract all design tokens, " +
                    "'create_color' - Create color token, " +
                    "'create_typography' - Create typography token, " +
                    "'update_color' - Update color token, " +
                    "'delete_color' - Delete color token, " +
                    "'delete_typography' - Delete typography token, " +
                    "'apply_color' - Apply color token to shapes, " +
                    "'apply_typography' - Apply typography to text shapes, " +
                    "'export' - Export tokens to format, " +
                    "'import' - Import tokens from JSON, " +
                    "'get_palette' - Get color palette from current page"
            ),

        // Token creation/update parameters
        tokenName: z.string().optional().describe("Name for the token (for create/update/apply operations)"),
        tokenId: z.string().optional().describe("Token ID (for update/delete operations)"),

        // Color token parameters
        color: z
            .string()
            .optional()
            .describe("Hex color value (e.g., '#3B82F6') for color tokens"),
        opacity: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .describe("Opacity value between 0 and 1 (default: 1)"),

        // Typography token parameters
        fontFamily: z.string().optional().describe("Font family name"),
        fontSize: z.number().optional().describe("Font size in pixels"),
        fontWeight: z.string().optional().describe("Font weight (e.g., '400', '600', '700')"),
        fontStyle: z.string().optional().describe("Font style (e.g., 'normal', 'italic')"),
        lineHeight: z.number().optional().describe("Line height value"),
        letterSpacing: z.number().optional().describe("Letter spacing value"),

        // Application parameters
        shapeIds: z
            .array(z.string())
            .optional()
            .describe("Array of shape IDs to apply token to"),

        // Export/import parameters
        format: z
            .enum(["json", "css", "scss"])
            .optional()
            .describe("Export format: 'json' (default), 'css', or 'scss'"),
        tokens: z
            .record(z.any())
            .optional()
            .describe("Token data for import (object with colors and typography arrays)"),

        // Update parameters
        updates: z
            .record(z.any())
            .optional()
            .describe("Properties to update for color token (e.g., {color: '#FF0000', opacity: 0.8})"),
    };

    operation!:
        | "list"
        | "extract"
        | "create_color"
        | "create_typography"
        | "update_color"
        | "delete_color"
        | "delete_typography"
        | "apply_color"
        | "apply_typography"
        | "export"
        | "import"
        | "get_palette";
    tokenName?: string;
    tokenId?: string;
    color?: string;
    opacity?: number;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    lineHeight?: number;
    letterSpacing?: number;
    shapeIds?: string[];
    format?: "json" | "css" | "scss";
    tokens?: Record<string, any>;
    updates?: Record<string, any>;
}

/**
 * Tool for managing design tokens (colors, typography, etc.)
 * Provides comprehensive design token management for design systems
 */
export class DesignTokenManagerTool extends Tool<DesignTokenManagerArgs> {
    constructor(mcpServer: PenpotMcpServer) {
        super(mcpServer, DesignTokenManagerArgs.schema);
    }

    public getToolName(): string {
        return "design_token_manager";
    }

    public getToolDescription(): string {
        return (
            "Manage design tokens (colors, typography) for design systems. " +
            "Create, update, delete, list, and apply design tokens. " +
            "Export tokens to CSS/SCSS/JSON or import from JSON. " +
            "Extract color palettes from designs. Essential for maintaining consistent design systems."
        );
    }

    protected async executeCore(args: DesignTokenManagerArgs): Promise<ToolResponse> {
        let code: string;

        switch (args.operation) {
            case "list":
                code = this.generateListCode();
                break;

            case "extract":
                code = this.generateExtractCode();
                break;

            case "create_color":
                code = this.generateCreateColorCode(args);
                break;

            case "create_typography":
                code = this.generateCreateTypographyCode(args);
                break;

            case "update_color":
                code = this.generateUpdateColorCode(args);
                break;

            case "delete_color":
                code = this.generateDeleteColorCode(args);
                break;

            case "delete_typography":
                code = this.generateDeleteTypographyCode(args);
                break;

            case "apply_color":
                code = this.generateApplyColorCode(args);
                break;

            case "apply_typography":
                code = this.generateApplyTypographyCode(args);
                break;

            case "export":
                code = this.generateExportCode(args);
                break;

            case "import":
                code = this.generateImportCode(args);
                break;

            case "get_palette":
                code = this.generateGetPaletteCode();
                break;

            default:
                throw new Error(`Unknown operation: ${args.operation}`);
        }

        const task = new ExecuteCodePluginTask(code);
        const result = await this.mcpServer.pluginBridge.executeTask(task);

        return new TextResponse(JSON.stringify(result, null, 2));
    }

    private generateListCode(): string {
        return `
const lib = penpot.library.local;

return {
    colors: lib.colors.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
        opacity: c.opacity || 1
    })),
    typography: lib.typographies.map(t => ({
        id: t.id,
        name: t.name,
        fontFamily: t.fontFamily,
        fontSize: t.fontSize,
        fontWeight: t.fontWeight,
        fontStyle: t.fontStyle,
        lineHeight: t.lineHeight,
        letterSpacing: t.letterSpacing
    })),
    summary: {
        colorCount: lib.colors.length,
        typographyCount: lib.typographies.length
    }
};
        `;
    }

    private generateExtractCode(): string {
        return `
const lib = penpot.library.local;

return {
    colors: lib.colors.map(c => ({
        name: c.name,
        color: c.color,
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
    })),
    components: lib.components.map(c => ({
        name: c.name,
        id: c.id,
        path: c.path
    }))
};
        `;
    }

    private generateCreateColorCode(args: DesignTokenManagerArgs): string {
        if (!args.tokenName || !args.color) {
            throw new Error("tokenName and color are required for create_color operation");
        }

        return `
const lib = penpot.library.local;

// Check if color already exists
const existing = lib.colors.find(c => c.name === ${JSON.stringify(args.tokenName)});
if (existing) {
    throw new Error('Color token already exists: ${args.tokenName}');
}

const colorToken = lib.createColor(${JSON.stringify(args.tokenName)}, ${JSON.stringify(args.color)});
${args.opacity !== undefined ? `colorToken.opacity = ${args.opacity};` : ""}

return {
    id: colorToken.id,
    name: colorToken.name,
    color: colorToken.color,
    opacity: colorToken.opacity || 1,
    message: 'Color token created successfully'
};
        `;
    }

    private generateCreateTypographyCode(args: DesignTokenManagerArgs): string {
        if (!args.tokenName || !args.fontFamily) {
            throw new Error("tokenName and fontFamily are required for create_typography operation");
        }

        const style: any = {
            fontFamily: args.fontFamily,
        };
        if (args.fontSize !== undefined) style.fontSize = args.fontSize;
        if (args.fontWeight !== undefined) style.fontWeight = args.fontWeight;
        if (args.fontStyle !== undefined) style.fontStyle = args.fontStyle;
        if (args.lineHeight !== undefined) style.lineHeight = args.lineHeight;
        if (args.letterSpacing !== undefined) style.letterSpacing = args.letterSpacing;

        return `
const lib = penpot.library.local;

// Check if typography already exists
const existing = lib.typographies.find(t => t.name === ${JSON.stringify(args.tokenName)});
if (existing) {
    throw new Error('Typography token already exists: ${args.tokenName}');
}

const typo = lib.createTypography(${JSON.stringify(args.tokenName)}, ${JSON.stringify(style)});

return {
    id: typo.id,
    name: typo.name,
    fontFamily: typo.fontFamily,
    fontSize: typo.fontSize,
    fontWeight: typo.fontWeight,
    lineHeight: typo.lineHeight,
    message: 'Typography token created successfully'
};
        `;
    }

    private generateUpdateColorCode(args: DesignTokenManagerArgs): string {
        if (!args.tokenId && !args.tokenName) {
            throw new Error("Either tokenId or tokenName is required for update_color operation");
        }
        if (!args.updates) {
            throw new Error("updates parameter is required for update_color operation");
        }

        const findExpression = args.tokenId
            ? `c.id === ${JSON.stringify(args.tokenId)}`
            : `c.name === ${JSON.stringify(args.tokenName)}`;

        return `
const lib = penpot.library.local;
const token = lib.colors.find(c => ${findExpression});

if (!token) {
    throw new Error('Color token not found: ${args.tokenId || args.tokenName}');
}

const oldValues = {
    name: token.name,
    color: token.color,
    opacity: token.opacity
};

// Apply updates
const updates = ${JSON.stringify(args.updates)};
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
    },
    message: 'Color token updated successfully'
};
        `;
    }

    private generateDeleteColorCode(args: DesignTokenManagerArgs): string {
        if (!args.tokenId && !args.tokenName) {
            throw new Error("Either tokenId or tokenName is required for delete_color operation");
        }

        const findExpression = args.tokenId
            ? `c.id === ${JSON.stringify(args.tokenId)}`
            : `c.name === ${JSON.stringify(args.tokenName)}`;

        return `
const lib = penpot.library.local;
const token = lib.colors.find(c => ${findExpression});

if (!token) {
    throw new Error('Color token not found: ${args.tokenId || args.tokenName}');
}

const tokenName = token.name;
const tokenId = token.id;
lib.deleteColor(tokenId);

return {
    deleted: tokenName,
    id: tokenId,
    message: 'Color token deleted successfully'
};
        `;
    }

    private generateDeleteTypographyCode(args: DesignTokenManagerArgs): string {
        if (!args.tokenId && !args.tokenName) {
            throw new Error("Either tokenId or tokenName is required for delete_typography operation");
        }

        const findExpression = args.tokenId
            ? `t.id === ${JSON.stringify(args.tokenId)}`
            : `t.name === ${JSON.stringify(args.tokenName)}`;

        return `
const lib = penpot.library.local;
const token = lib.typographies.find(t => ${findExpression});

if (!token) {
    throw new Error('Typography token not found: ${args.tokenId || args.tokenName}');
}

const tokenName = token.name;
const tokenId = token.id;
lib.deleteTypography(tokenId);

return {
    deleted: tokenName,
    id: tokenId,
    message: 'Typography token deleted successfully'
};
        `;
    }

    private generateApplyColorCode(args: DesignTokenManagerArgs): string {
        if (!args.tokenName) {
            throw new Error("tokenName is required for apply_color operation");
        }
        if (!args.shapeIds || args.shapeIds.length === 0) {
            throw new Error("shapeIds array is required for apply_color operation");
        }

        return `
const lib = penpot.library.local;
const colorToken = lib.colors.find(c => c.name === ${JSON.stringify(args.tokenName)});

if (!colorToken) {
    throw new Error('Color token not found: ${args.tokenName}');
}

const shapes = ${JSON.stringify(args.shapeIds)}
    .map(id => penpot.currentPage.findShapeById(id))
    .filter(Boolean);

if (shapes.length === 0) {
    throw new Error('No valid shapes found');
}

let applied = 0;
shapes.forEach(shape => {
    if (shape.fills) {
        shape.fills = [{
            fillColor: colorToken.color,
            fillOpacity: colorToken.opacity || 1
        }];
        applied++;
    }
});

return {
    tokenName: ${JSON.stringify(args.tokenName)},
    color: colorToken.color,
    shapesApplied: applied,
    totalShapes: shapes.length,
    message: \`Applied color token to \${applied} shape(s)\`
};
        `;
    }

    private generateApplyTypographyCode(args: DesignTokenManagerArgs): string {
        if (!args.tokenName) {
            throw new Error("tokenName is required for apply_typography operation");
        }
        if (!args.shapeIds || args.shapeIds.length === 0) {
            throw new Error("shapeIds array is required for apply_typography operation");
        }

        return `
const lib = penpot.library.local;
const typoToken = lib.typographies.find(t => t.name === ${JSON.stringify(args.tokenName)});

if (!typoToken) {
    throw new Error('Typography token not found: ${args.tokenName}');
}

const shapes = ${JSON.stringify(args.shapeIds)}
    .map(id => penpot.currentPage.findShapeById(id))
    .filter(Boolean);

if (shapes.length === 0) {
    throw new Error('No valid shapes found');
}

let applied = 0;
shapes.forEach(shape => {
    if (shape.type === 'text') {
        if (typoToken.fontFamily) shape.fontFamily = typoToken.fontFamily;
        if (typoToken.fontSize) shape.fontSize = typoToken.fontSize;
        if (typoToken.fontWeight) shape.fontWeight = typoToken.fontWeight;
        if (typoToken.fontStyle) shape.fontStyle = typoToken.fontStyle;
        if (typoToken.lineHeight) shape.lineHeight = typoToken.lineHeight;
        if (typoToken.letterSpacing) shape.letterSpacing = typoToken.letterSpacing;
        applied++;
    }
});

return {
    tokenName: ${JSON.stringify(args.tokenName)},
    shapesApplied: applied,
    totalShapes: shapes.length,
    fontFamily: typoToken.fontFamily,
    message: \`Applied typography token to \${applied} text shape(s)\`
};
        `;
    }

    private generateExportCode(args: DesignTokenManagerArgs): string {
        const format = args.format || "json";

        return `
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
return {
    format: 'json',
    output: JSON.stringify(tokens, null, 2),
    tokens
};
        `;
    }

    private generateImportCode(args: DesignTokenManagerArgs): string {
        if (!args.tokens) {
            throw new Error("tokens parameter is required for import operation");
        }

        return `
const lib = penpot.library.local;
const tokensData = ${JSON.stringify(args.tokens)};
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
    hasErrors: results.errors.length > 0,
    message: \`Imported \${results.colors.length} color(s) and \${results.typography.length} typography token(s)\`
};
        `;
    }

    private generateGetPaletteCode(): string {
        return `
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
    colorCount: colors.size,
    message: \`Found \${colors.size} unique color(s) in \${shapes.length} shape(s)\`
};
        `;
    }
}
