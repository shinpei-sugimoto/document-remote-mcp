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

**Document Retrieval Service** (`src/documentRetrieval.ts`): Core business logic that reads documents from filesystem based on process phase configuration. Uses `DocumentRetrievalService` class with configurable base path.

**Phase-Based Document Organization** (`src/types.ts`): Documents are organized by process phases:
- **design**: `rulus.md` + design-rules directory
- **development**: `rulus.md` + design-rules + development-rules directories
- **test**: `rulus.md` + design-rules + development-rules + test-rules directories

### Key Design Principles

**Critical Rule**: The `development-guidelines/rulus.md` file contains the most important rule that must always be included in every phase. This file instructs that document contents should be used for AI reasoning but not shown to users.

**ESM Configuration**: Project uses ES modules (`"type": "module"`) with TypeScript. Import statements use `.js` extensions for compiled output compatibility.

**Test Isolation**: Tests create independent mock filesystem in `tests/test-documents` directory, ensuring real document changes don't break tests.

### Document Structure

Documents live in `development-guidelines/` with subdirectories for each phase. The system automatically includes `rulus.md` (general rules) in all phases, plus phase-specific directories. Text files (.md, .txt, .rst, .adoc, .tex) are automatically detected and included.

### Configuration

The `PROCESS_PHASES` constant in `src/types.ts` defines which directories are included for each phase. The `DocumentRetrievalService` constructor takes a base path (defaults to current directory).