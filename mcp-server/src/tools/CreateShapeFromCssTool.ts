import { z } from "zod";
import { Tool } from "../Tool";
import { TextResponse, ToolResponse } from "../ToolResponse";
import "reflect-metadata";
import { PenpotMcpServer } from "../PenpotMcpServer";
import { ExecuteCodePluginTask } from "../tasks/ExecuteCodePluginTask";

/**
 * Arguments class for CreateShapeFromCssTool
 */
export class CreateShapeFromCssArgs {
    static schema = {
        css: z
            .string()
            .min(1, "CSS cannot be empty")
            .describe(
                "CSS properties to create a shape from. Can be a CSS rule string (e.g., 'width: 100px; height: 50px; background-color: #ff0000;') " +
                    "or a CSS selector with properties. Common properties supported: width, height, background-color, " +
                    "border-radius, border, border-width, border-color, border-style, opacity, box-shadow, etc."
            ),
        shapeType: z
            .enum(["rectangle", "ellipse"])
            .default("rectangle")
            .describe("The type of shape to create. Defaults to 'rectangle'. Use 'ellipse' for circular/oval shapes."),
        x: z
            .number()
            .optional()
            .describe("Optional X coordinate for the shape's position. If not provided, defaults to 0."),
        y: z
            .number()
            .optional()
            .describe("Optional Y coordinate for the shape's position. If not provided, defaults to 0."),
        name: z
            .string()
            .optional()
            .describe("Optional name for the created shape. If not provided, a default name will be used."),
    };

    css!: string;
    shapeType: "rectangle" | "ellipse" = "rectangle";
    x?: number;
    y?: number;
    name?: string;
}

/**
 * Tool for creating Penpot shapes from CSS properties
 */
export class CreateShapeFromCssTool extends Tool<CreateShapeFromCssArgs> {
    /**
     * Creates a new CreateShapeFromCss tool instance.
     *
     * @param mcpServer - The MCP server instance
     */
    constructor(mcpServer: PenpotMcpServer) {
        super(mcpServer, CreateShapeFromCssArgs.schema);
    }

    public getToolName(): string {
        return "create_shape_from_css";
    }

    public getToolDescription(): string {
        return (
            "Creates a Penpot shape (rectangle or ellipse) from CSS properties. " +
            "Parses CSS properties and maps them to Penpot shape properties. " +
            "Supports common CSS properties like width, height, background-color, border-radius, " +
            "border, opacity, box-shadow, and more. Returns the created shape's ID and properties."
        );
    }

    /**
     * Parses CSS string and extracts properties
     */
    private parseCss(css: string): Record<string, string> {
        const properties: Record<string, string> = {};

        // Remove CSS selector if present (e.g., ".class { ... }" or "#id { ... }")
        let cssContent = css.trim();
        const selectorMatch = cssContent.match(/^[^{]*\{([^}]+)\}/);
        if (selectorMatch) {
            cssContent = selectorMatch[1];
        }

        // Split by semicolons and parse properties
        const declarations = cssContent.split(";").map((d) => d.trim()).filter((d) => d.length > 0);

        for (const declaration of declarations) {
            const colonIndex = declaration.indexOf(":");
            if (colonIndex === -1) continue;

            const property = declaration.substring(0, colonIndex).trim();
            const value = declaration.substring(colonIndex + 1).trim();

            properties[property.toLowerCase()] = value;
        }

        return properties;
    }

    /**
     * Converts CSS value to number (handles px, em, rem, etc.)
     */
    private parseSize(value: string): number {
        if (!value) return 0;
        const numStr = value.replace(/px|em|rem|pt|%/gi, "").trim();
        const num = parseFloat(numStr);
        return isNaN(num) ? 0 : num;
    }

    /**
     * Converts CSS color to hex format
     */
    private parseColor(color: string): string {
        if (!color) return "#000000";

        color = color.trim();

        // Already hex
        if (color.startsWith("#")) {
            return color.length === 4 ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color;
        }

        // RGB/RGBA
        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        }

        // Named colors (basic set)
        const namedColors: Record<string, string> = {
            black: "#000000",
            white: "#ffffff",
            red: "#ff0000",
            green: "#008000",
            blue: "#0000ff",
            yellow: "#ffff00",
            cyan: "#00ffff",
            magenta: "#ff00ff",
            gray: "#808080",
            grey: "#808080",
            transparent: "transparent",
        };

        return namedColors[color.toLowerCase()] || "#000000";
    }

    /**
     * Generates JavaScript code to create a shape from CSS properties
     */
    private generateShapeCode(args: CreateShapeFromCssArgs, cssProps: Record<string, string>): string {
        const shapeType = args.shapeType === "ellipse" ? "createEllipse" : "createRectangle";
        const shapeVar = args.shapeType === "ellipse" ? "ellipse" : "rect";

        let code = `const ${shapeVar} = penpot.${shapeType}();\n`;

        // Set name
        if (args.name) {
            code += `${shapeVar}.name = ${JSON.stringify(args.name)};\n`;
        } else {
            code += `${shapeVar}.name = "Shape from CSS";\n`;
        }

        // Parse dimensions
        const width = cssProps.width ? this.parseSize(cssProps.width) : cssProps["min-width"] ? this.parseSize(cssProps["min-width"]) : 100;
        const height = cssProps.height ? this.parseSize(cssProps.height) : cssProps["min-height"] ? this.parseSize(cssProps["min-height"]) : 100;

        code += `${shapeVar}.resize(${width}, ${height});\n`;

        // Set position
        const x = args.x !== undefined ? args.x : cssProps.left ? this.parseSize(cssProps.left) : 0;
        const y = args.y !== undefined ? args.y : cssProps.top ? this.parseSize(cssProps.top) : 0;
        code += `${shapeVar}.x = ${x};\n`;
        code += `${shapeVar}.y = ${y};\n`;

        // Parse background-color
        const bgColor = cssProps["background-color"] || cssProps.background;
        if (bgColor && bgColor !== "transparent" && !bgColor.includes("gradient") && !bgColor.includes("url")) {
            const color = this.parseColor(bgColor);
            code += `${shapeVar}.fills = [{ fillColor: ${JSON.stringify(color)} }];\n`;
        } else if (!bgColor || bgColor === "transparent") {
            // No fill or transparent
            code += `${shapeVar}.fills = [];\n`;
        }

        // Parse border-radius
        const borderRadius = cssProps["border-radius"];
        if (borderRadius) {
            const radius = this.parseSize(borderRadius);
            code += `${shapeVar}.borderRadius = ${radius};\n`;
        }

        // Parse border
        let borderWidth = cssProps["border-width"];
        let borderColor = cssProps["border-color"];
        let borderStyle = cssProps["border-style"];

        // If border shorthand is used, try to parse it
        if (cssProps.border && cssProps.border !== "none" && cssProps.border !== "0") {
            const borderParts = cssProps.border.split(/\s+/);
            for (const part of borderParts) {
                if (part.match(/^\d+px?$|^\d+\.\d+px?$/)) {
                    borderWidth = borderWidth || part;
                } else if (part.match(/^(solid|dashed|dotted|double|groove|ridge|inset|outset)$/i)) {
                    borderStyle = borderStyle || part;
                } else if (part.match(/^#|^rgb|^rgba|^[a-z]+$/i)) {
                    borderColor = borderColor || part;
                }
            }
        }

        if (borderWidth && this.parseSize(borderWidth) > 0) {
            const width = this.parseSize(borderWidth);
            const color = borderColor ? this.parseColor(borderColor) : "#000000";
            const style = borderStyle === "dashed" ? "dashed" : borderStyle === "dotted" ? "dotted" : "solid";

            code += `${shapeVar}.strokes = [{\n`;
            code += `  strokeColor: ${JSON.stringify(color)},\n`;
            code += `  strokeWidth: ${width},\n`;
            code += `  strokeStyle: ${JSON.stringify(style)},\n`;
            code += `  strokeAlignment: "center"\n`;
            code += `}];\n`;
        }

        // Parse opacity
        const opacity = cssProps.opacity;
        if (opacity !== undefined) {
            const opacityValue = parseFloat(opacity);
            if (!isNaN(opacityValue)) {
                code += `${shapeVar}.opacity = ${opacityValue};\n`;
            }
        }

        // Parse box-shadow (basic support - creates a shadow)
        const boxShadow = cssProps["box-shadow"];
        if (boxShadow && boxShadow !== "none") {
            // Parse basic box-shadow: offset-x offset-y blur-radius spread-radius color
            const shadowMatch = boxShadow.match(/([\d.-]+)px\s+([\d.-]+)px\s+([\d.-]+)px(?:\s+([\d.-]+)px)?\s+(.+)/);
            if (shadowMatch) {
                const offsetX = parseFloat(shadowMatch[1]) || 0;
                const offsetY = parseFloat(shadowMatch[2]) || 0;
                const blur = parseFloat(shadowMatch[3]) || 0;
                const color = this.parseColor(shadowMatch[5] || "#000000");

                code += `${shapeVar}.shadows = [{\n`;
                code += `  color: ${JSON.stringify(color)},\n`;
                code += `  offsetX: ${offsetX},\n`;
                code += `  offsetY: ${offsetY},\n`;
                code += `  blur: ${blur},\n`;
                code += `  spread: ${shadowMatch[4] ? parseFloat(shadowMatch[4]) : 0}\n`;
                code += `}];\n`;
            }
        }

        code += `return { shapeId: ${shapeVar}.id, name: ${shapeVar}.name, type: ${shapeVar}.type, x: ${shapeVar}.x, y: ${shapeVar}.y, width: ${shapeVar}.width, height: ${shapeVar}.height };\n`;

        return code;
    }

    protected async executeCore(args: CreateShapeFromCssArgs): Promise<ToolResponse> {
        // Parse CSS properties
        const cssProps = this.parseCss(args.css);

        // Generate JavaScript code to create the shape
        const code = this.generateShapeCode(args, cssProps);

        // Execute the code
        const task = new ExecuteCodePluginTask({ code: code });
        const result = await this.mcpServer.pluginBridge.executePluginTask(task);

        if (result.data?.result) {
            return new TextResponse(JSON.stringify(result.data.result, null, 2));
        } else {
            return new TextResponse("Shape created successfully, but no result was returned.");
        }
    }
}

