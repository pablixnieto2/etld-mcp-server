#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Configuration from environment or defaults
const OPENAPI_PATH = process.env.OPENAPI_PATH || path.join(__dirname, "../../openapi.json");
const BASE_URL = process.env.ETLD_API_URL || "https://api.etl-d.net";
const OPENAPI_URL = process.env.OPENAPI_URL || `${BASE_URL}/openapi.json`;
class EtldMcpServer {
    server;
    openapi = null;
    constructor() {
        this.server = new Server({
            name: "etld-mcp-server",
            version: "1.0.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupHandlers();
    }
    async fetchOpenApi() {
        // Try local file first
        try {
            const data = await fs.readFile(OPENAPI_PATH, "utf-8");
            console.error(`Loaded OpenAPI from local file: ${OPENAPI_PATH}`);
            return JSON.parse(data);
        }
        catch (fileError) {
            console.error(`Could not read local OpenAPI file: ${fileError}. Trying URL...`);
            try {
                const response = await fetch(OPENAPI_URL);
                if (!response.ok) {
                    throw new Error(`Failed to fetch OpenAPI from ${OPENAPI_URL}: ${response.statusText}`);
                }
                console.error(`Loaded OpenAPI from URL: ${OPENAPI_URL}`);
                return (await response.json());
            }
            catch (urlError) {
                console.error(`Error fetching OpenAPI from URL: ${urlError}`);
                throw new Error("Failed to load OpenAPI spec from both local file and URL.");
            }
        }
    }
    /**
     * Resolves $ref in the schema using the provided OpenAPI components.
     */
    resolveSchema(schema, components) {
        if (!schema)
            return schema;
        if (schema.$ref) {
            const refPath = schema.$ref.split("/");
            const schemaName = refPath[refPath.length - 1];
            const resolved = components?.schemas?.[schemaName];
            if (resolved) {
                // Recursively resolve if the resolved schema also has refs
                return this.resolveSchema(resolved, components);
            }
        }
        if (schema.type === "object" && schema.properties) {
            const newProperties = {};
            for (const [key, value] of Object.entries(schema.properties)) {
                newProperties[key] = this.resolveSchema(value, components);
            }
            return { ...schema, properties: newProperties };
        }
        if (schema.type === "array" && schema.items) {
            return { ...schema, items: this.resolveSchema(schema.items, components) };
        }
        if (schema.anyOf) {
            return { ...schema, anyOf: schema.anyOf.map((s) => this.resolveSchema(s, components)) };
        }
        if (schema.allOf) {
            return { ...schema, allOf: schema.allOf.map((s) => this.resolveSchema(s, components)) };
        }
        if (schema.oneOf) {
            return { ...schema, oneOf: schema.oneOf.map((s) => this.resolveSchema(s, components)) };
        }
        return schema;
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            this.openapi = await this.fetchOpenApi();
            const tools = [];
            for (const [pathStr, methods] of Object.entries(this.openapi.paths)) {
                // Focus on POST endpoints for tools
                if (methods.post) {
                    const op = methods.post;
                    const name = op.operationId || pathStr.replace(/\//g, "_").replace(/^_/, "");
                    // Skip internal or system endpoints if needed
                    if (pathStr.startsWith("/health") || pathStr.startsWith("/v1/auth"))
                        continue;
                    let inputSchema = op.requestBody?.content["application/json"]?.schema || { type: "object", properties: {} };
                    // Resolve refs to make it a standalone schema for the AI
                    inputSchema = this.resolveSchema(inputSchema, this.openapi.components);
                    tools.push({
                        name: name,
                        description: op.description || op.summary || `Call ${pathStr}`,
                        inputSchema: {
                            type: "object",
                            properties: inputSchema.properties || {},
                            required: inputSchema.required || [],
                        },
                    });
                }
            }
            return { tools };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (!this.openapi) {
                this.openapi = await this.fetchOpenApi();
            }
            const { name, arguments: args } = request.params;
            // Find the path for this operationId or generated name
            let targetPath = null;
            for (const [pathStr, methods] of Object.entries(this.openapi.paths)) {
                const opId = methods.post?.operationId;
                const generatedName = pathStr.replace(/\//g, "_").replace(/^_/, "");
                if (opId === name || generatedName === name) {
                    targetPath = pathStr;
                    break;
                }
            }
            if (!targetPath) {
                throw new Error(`Tool not found: ${name}`);
            }
            const apiKey = process.env.ETLD_API_KEY || "local_dev_key";
            try {
                const url = `${BASE_URL}${targetPath}`;
                console.error(`Calling API: POST ${url}`);
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-API-KEY": apiKey,
                    },
                    body: JSON.stringify(args),
                });
                const data = await response.json();
                if (!response.ok) {
                    return {
                        isError: true,
                        content: [
                            {
                                type: "text",
                                text: `API Error (${response.status}): ${JSON.stringify(data, null, 2)}`,
                            }
                        ]
                    };
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                console.error(`Error calling API: ${error.message}`);
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: `Error calling API: ${error.message}`,
                        },
                    ],
                };
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("ETLD MCP Server running on stdio");
    }
}
const server = new EtldMcpServer();
server.run().catch(console.error);
