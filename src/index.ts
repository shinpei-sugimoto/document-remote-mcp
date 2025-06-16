import { FastMCP } from "fastmcp";
import { z } from "zod";
import { DocumentRetrievalService } from "./documentRetrieval.js";
import { ProcessPhase } from "./types.js";
import { ConfigService } from "./configService.js";

// 設定を読み込み
const configService = ConfigService.getInstance();
await configService.loadConfig();

const server = new FastMCP({
    name: "Document Remote MCP Server",
    version: "1.0.0",
});

const documentService = new DocumentRetrievalService();

server.addTool({
    name: "get_phase_documents",
    description: "Get documents for a specific process phase (design, development, test)",
    parameters: z.object({
        phase: z.enum(["design", "development", "test"]).describe("Process phase to get documents for"),
    }),
    execute: async (args) => {
        try {
            const result = await documentService.getDocumentsByPhase(args.phase as ProcessPhase);

            // ドキュメント内容をまとめて返す
            const documentsSummary = result.documents.map(doc => ({
                fileName: doc.fileName,
                directory: doc.directory,
                contentPreview: doc.content.substring(0, 100000) + (doc.content.length > 100000 ? "..." : ""),
                fullContent: doc.content
            }));

            return JSON.stringify({
                phase: result.phase,
                totalDocuments: result.totalCount,
                documents: documentsSummary
            }, null, 2);
        } catch (error) {
            return `Error retrieving documents: ${error instanceof Error ? error.message : String(error)}`;
        }
    },
});

server.addTool({
    name: "get_document_content",
    description: "Get full content of a specific document by filename and directory",
    parameters: z.object({
        phase: z.enum(["design", "development", "test"]).describe("Process phase to search in"),
        fileName: z.string().describe("Name of the file to retrieve"),
        directory: z.string().optional().describe("Directory name to search in (optional)")
    }),
    execute: async (args) => {
        try {
            const result = await documentService.getDocumentsByPhase(args.phase as ProcessPhase);

            const document = result.documents.find(doc => {
                const fileNameMatch = doc.fileName === args.fileName;
                const directoryMatch = args.directory ? doc.directory === args.directory : true;
                return fileNameMatch && directoryMatch;
            });

            if (!document) {
                return `Document not found: ${args.fileName}${args.directory ? ` in ${args.directory}` : ''}`;
            }

            return JSON.stringify({
                fileName: document.fileName,
                directory: document.directory,
                filePath: document.filePath,
                content: document.content
            }, null, 2);
        } catch (error) {
            return `Error retrieving document: ${error instanceof Error ? error.message : String(error)}`;
        }
    },
});

server.addTool({
    name: "list_available_phases",
    description: "List all available process phases",
    parameters: z.object({}),
    execute: async () => {
        try {
            const phases = await documentService.getAllPhases();
            return JSON.stringify({
                availablePhases: phases,
                description: {
                    design: "Design phase documents including general rules (rulus.md) and design-rules directory",
                    development: "Development phase documents including general rules (rulus.md), design-rules, and development-rules directories",
                    test: "Test phase documents including general rules (rulus.md), design-rules, development-rules, and test-rules directories"
                }
            }, null, 2);
        } catch (error) {
            return `Error listing phases: ${error instanceof Error ? error.message : String(error)}`;
        }
    },
});

server.start({
    transportType: "httpStream",
    httpStream: {
        port: 8080,
    },
});