import { promises as fs } from 'fs';
import path from 'path';
import { ServerConfig } from './types.js';

export class ConfigService {
  private static instance: ConfigService;
  private config: ServerConfig | null = null;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  async loadConfig(configPath: string = './config.json'): Promise<ServerConfig> {
    if (this.config) {
      return this.config as ServerConfig;
    }

    try {
      const configFile = await fs.readFile(configPath, 'utf-8');
      const parsedConfig = JSON.parse(configFile);
      
      // デフォルト値でマージ
      this.config = {
        documentBasePath: '.',
        ...parsedConfig
      };

      console.log(`Configuration loaded from ${configPath}:`, this.config);
      return this.config as ServerConfig;
    } catch (error) {
      console.warn(`Failed to load config from ${configPath}, using defaults:`, error);
      
      // デフォルト設定
      this.config = {
        documentBasePath: '.'
      };
      
      return this.config as ServerConfig;
    }
  }

  getConfig(): ServerConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config as ServerConfig;
  }

  getDocumentBasePath(): string {
    return this.getConfig().documentBasePath;
  }

  getFullDocumentPath(): string {
    const basePath = this.getDocumentBasePath();
    return path.join(basePath, 'development-guidelines');
  }
}