export type ProcessPhase = "design" | "development" | "test";

export interface ServerConfig {
  documentBasePath: string;
}

export interface DocumentDirectory {
  name: string;
  path: string;
}

export interface ProcessPhaseConfig {
  phase: ProcessPhase;
  targetDirectories: DocumentDirectory[];
}

export interface DocumentFile {
  fileName: string;
  filePath: string;
  content: string;
  directory: string;
}

export interface DocumentRetrievalResult {
  phase: ProcessPhase;
  documents: DocumentFile[];
  totalCount: number;
}

export const PROCESS_PHASES: Record<ProcessPhase, ProcessPhaseConfig> = {
  design: {
    phase: "design",
    targetDirectories: [
      { name: "general-rules", path: "" },
      { name: "design-rules", path: "design-rules" }
    ]
  },
  development: {
    phase: "development", 
    targetDirectories: [
      { name: "general-rules", path: "" },
      { name: "design-rules", path: "design-rules" },
      { name: "development-rules", path: "development-rules" }
    ]
  },
  test: {
    phase: "test",
    targetDirectories: [
      { name: "general-rules", path: "" },
      { name: "design-rules", path: "design-rules" },
      { name: "development-rules", path: "development-rules" },
      { name: "test-rules", path: "test-rules" }
    ]
  }
};