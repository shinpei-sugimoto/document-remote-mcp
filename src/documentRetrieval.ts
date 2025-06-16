import { promises as fs } from 'fs';
import path from 'path';
import { 
  ProcessPhase, 
  DocumentFile, 
  DocumentRetrievalResult, 
  PROCESS_PHASES 
} from './types.js';

export class DocumentRetrievalService {
  private baseDocumentPath: string;

  constructor(baseDocumentPath: string = './documents') {
    this.baseDocumentPath = baseDocumentPath;
  }

  async getDocumentsByPhase(phase: ProcessPhase): Promise<DocumentRetrievalResult> {
    const phaseConfig = PROCESS_PHASES[phase];
    if (!phaseConfig) {
      throw new Error(`Invalid process phase: ${phase}`);
    }

    const documents: DocumentFile[] = [];

    for (const directory of phaseConfig.targetDirectories) {
      const directoryPath = path.join(this.baseDocumentPath, directory.path);
      
      try {
        const filesInDirectory = await this.getDocumentsFromDirectory(
          directoryPath, 
          directory.name
        );
        documents.push(...filesInDirectory);
      } catch (error) {
        console.warn(`Failed to read directory ${directoryPath}:`, error);
      }
    }

    return {
      phase,
      documents,
      totalCount: documents.length
    };
  }

  private async getDocumentsFromDirectory(
    directoryPath: string, 
    directoryName: string
  ): Promise<DocumentFile[]> {
    const documents: DocumentFile[] = [];

    try {
      const files = await fs.readdir(directoryPath);
      
      for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isFile() && this.isTextFile(file)) {
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            documents.push({
              fileName: file,
              filePath,
              content,
              directory: directoryName
            });
          } catch (error) {
            console.warn(`Failed to read file ${filePath}:`, error);
          }
        }
      }
    } catch (error) {
      throw new Error(`Directory not found or not accessible: ${directoryPath}`);
    }

    return documents;
  }

  private isTextFile(fileName: string): boolean {
    const textExtensions = ['.md', '.txt', '.rst', '.adoc', '.tex'];
    const extension = path.extname(fileName).toLowerCase();
    return textExtensions.includes(extension);
  }

  async getAllPhases(): Promise<ProcessPhase[]> {
    return Object.keys(PROCESS_PHASES) as ProcessPhase[];
  }

  async validatePhase(phase: string): Promise<boolean> {
    const validPhases = await this.getAllPhases();
    return validPhases.includes(phase as ProcessPhase);
  }
}