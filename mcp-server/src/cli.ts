#!/usr/bin/env node

/**
 * CLI wrapper for the Penpot MCP Server
 *
 * This is the entry point when the package is installed via npm
 * and run using the `penpot-mcp` command.
 */

import { PenpotMcpServer } from "./PenpotMcpServer.js";
import { createLogger, logFilePath } from "./logger.js";

async function main(): Promise<void> {
    const logger = createLogger("cli");

    // log the file path early so it appears before any potential errors
    logger.info(`Logging to file: ${logFilePath}`);

    try {
        const args = process.argv.slice(2);
        let port = 4401; // default HTTP/SSE port
        let wsPort = 4402; // default WebSocket port
        let replPort = 4403; // default REPL port

        // parse command line arguments
        for (let i = 0; i < args.length; i++) {
            if (args[i] === "--port" || args[i] === "-p") {
                if (i + 1 < args.length) {
                    const portArg = parseInt(args[i + 1], 10);
                    if (!isNaN(portArg) && portArg > 0 && portArg <= 65535) {
                        port = portArg;
                        i++;
                    } else {
                        logger.error("Invalid port number. Using default port 4401.");
                    }
                }
            } else if (args[i] === "--ws-port") {
                if (i + 1 < args.length) {
                    const portArg = parseInt(args[i + 1], 10);
                    if (!isNaN(portArg) && portArg > 0 && portArg <= 65535) {
                        wsPort = portArg;
                        i++;
                    } else {
                        logger.error("Invalid WebSocket port number. Using default port 4402.");
                    }
                }
            } else if (args[i] === "--repl-port") {
                if (i + 1 < args.length) {
                    const portArg = parseInt(args[i + 1], 10);
                    if (!isNaN(portArg) && portArg > 0 && portArg <= 65535) {
                        replPort = portArg;
                        i++;
                    } else {
                        logger.error("Invalid REPL port number. Using default port 4403.");
                    }
                }
            } else if (args[i] === "--log-level" || args[i] === "-l") {
                if (i + 1 < args.length) {
                    process.env.LOG_LEVEL = args[i + 1];
                    i++;
                }
            } else if (args[i] === "--log-dir") {
                if (i + 1 < args.length) {
                    process.env.LOG_DIR = args[i + 1];
                    i++;
                }
            } else if (args[i] === "--help" || args[i] === "-h") {
                console.log("Penpot MCP Server - Model Context Protocol server for Penpot");
                console.log("");
                console.log("Usage: penpot-mcp [options]");
                console.log("");
                console.log("Options:");
                console.log("  --port, -p <number>      HTTP/SSE server port (default: 4401)");
                console.log("  --ws-port <number>       WebSocket server port (default: 4402)");
                console.log("  --repl-port <number>     REPL server port (default: 4403)");
                console.log("  --log-level, -l <level>  Log level: trace, debug, info, warn, error (default: info)");
                console.log("  --log-dir <path>         Directory for log files (default: ./logs)");
                console.log("  --help, -h               Show this help message");
                console.log("");
                console.log("Example:");
                console.log("  penpot-mcp --port 4401 --log-level debug");
                console.log("");
                console.log("After starting the server:");
                console.log("  1. Load the Penpot plugin at http://localhost:4400/manifest.json");
                console.log("  2. Connect your MCP client to http://localhost:4401/mcp (or /sse)");
                console.log("");
                process.exit(0);
            } else if (args[i] === "--version" || args[i] === "-v") {
                // Read version from package.json
                console.log("penpot-mcp version 1.0.0");
                process.exit(0);
            }
        }

        logger.info(`Starting Penpot MCP Server...`);
        logger.info(`  HTTP/SSE port: ${port}`);
        logger.info(`  WebSocket port: ${wsPort}`);
        logger.info(`  REPL port: ${replPort}`);

        const server = new PenpotMcpServer(port, wsPort, replPort);
        await server.start();

        logger.info("Server started successfully!");
        logger.info(`  MCP endpoint: http://localhost:${port}/mcp`);
        logger.info(`  SSE endpoint: http://localhost:${port}/sse`);
        logger.info(`  Plugin WebSocket: ws://localhost:${wsPort}`);

        // keep the process alive
        process.on("SIGINT", async () => {
            logger.info("Received SIGINT, shutting down gracefully...");
            await server.stop();
            process.exit(0);
        });

        process.on("SIGTERM", async () => {
            logger.info("Received SIGTERM, shutting down gracefully...");
            await server.stop();
            process.exit(0);
        });
    } catch (error) {
        logger.error(error, "Failed to start MCP server");
        process.exit(1);
    }
}

main().catch((error) => {
    createLogger("cli").error(error, "Unhandled error in CLI");
    process.exit(1);
});
