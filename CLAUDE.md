# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server on port 8080 with hot reload
- `npm run watch` - Start server with file watching
- `npm run build` - Build TypeScript to dist/ directory
- `npm start` - Run compiled application

### Testing
- `npm test` - Run all Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Architecture

This is a Document Remote MCP (Model Context Protocol) server that provides phase-based document retrieval for development workflows. The system serves development guidelines through MCP tools while hiding document contents from end users.

### Core Architecture

**MCP Server**: Built with FastMCP framework, runs on port 8080 and exposes three main tools:
- `get_phase_documents` - Retrieve all documents for a specific phase
- `get_document_content` - Get specific document by filename and directory  
- `list_available_phases` - List available process phases

**Document Retrieval Service** (`src/documentRetrieval.ts`): Core business logic that reads documents from filesystem based on process phase configuration. Uses `DocumentRetrievalService` class with configurable document base path.

**Configuration Service** (`src/configService.ts`): Singleton service that manages server configuration via `config.json`. Handles document base path configuration with fallback to defaults. The service automatically appends `development-guidelines` to the configured base path.

**Phase-Based Document Organization** (`src/types.ts`): Documents are organized by process phases with relative paths within the `development-guidelines` directory:
- **design**: `rulus.md` + design-rules directory
- **development**: `rulus.md` + design-rules + development-rules directories
- **test**: `rulus.md` + design-rules + development-rules + test-rules directories

### Key Design Principles

**Critical Rule**: The `development-guidelines/rulus.md` file contains the most important rule that must always be included in every phase. This file instructs that document contents should be used for AI reasoning but not shown to users.

**Configurable Document Location**: The system uses `config.json` to specify where documents are located via `documentBasePath`. This allows deployment on different machines with documents in various locations while keeping the `development-guidelines` folder name fixed.

**ESM Configuration**: Project uses ES modules (`"type": "module"`) with TypeScript. Import statements use `.js` extensions for compiled output compatibility.

**Test Isolation**: Tests create independent mock filesystem in `tests/test-documents` directory, ensuring real document changes don't break tests. ConfigService state is reset between tests to prevent interference.

### Document Structure

Documents live in a `development-guidelines/` directory at the configured base path. The system automatically includes `rulus.md` (general rules) in all phases, plus phase-specific directories. Text files (.md, .txt, .rst, .adoc, .tex) are automatically detected and included.

### Configuration

**config.json**: Contains `documentBasePath` setting that specifies where to find the `development-guidelines` directory. Defaults to current directory if file doesn't exist or fails to load.

**PROCESS_PHASES**: Constant in `src/types.ts` defines directory structure within `development-guidelines` using relative paths. The ConfigService resolves these to absolute paths at runtime.