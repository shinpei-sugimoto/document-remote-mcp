import { promises as fs } from 'fs';
import path from 'path';
import { ConfigService } from '../src/configService';

describe('ConfigService', () => {
  let testConfigPath: string;
  let configService: ConfigService;

  beforeEach(() => {
    testConfigPath = path.join(__dirname, 'test-config.json');
    configService = ConfigService.getInstance();
    // 設定をリセット
    (configService as any).config = null;
  });

  afterEach(async () => {
    // テスト用設定ファイルを削除
    try {
      await fs.unlink(testConfigPath);
    } catch (error) {
      // ファイルが存在しない場合は無視
    }
    
    // 設定をリセット
    (configService as any).config = null;
  });

  describe('loadConfig', () => {
    test('should load config from file', async () => {
      const testConfig = {
        documentBasePath: '/custom/path/to/docs'
      };
      
      await fs.writeFile(testConfigPath, JSON.stringify(testConfig));
      
      const config = await configService.loadConfig(testConfigPath);
      
      expect(config.documentBasePath).toBe('/custom/path/to/docs');
    });

    test('should use default config when file does not exist', async () => {
      const config = await configService.loadConfig('./non-existent-config.json');
      
      expect(config.documentBasePath).toBe('.');
    });

    test('should merge with default values', async () => {
      const testConfig = {
        documentBasePath: '/custom/path'
      };
      
      await fs.writeFile(testConfigPath, JSON.stringify(testConfig));
      
      const config = await configService.loadConfig(testConfigPath);
      
      expect(config.documentBasePath).toBe('/custom/path');
    });

    test('should return cached config on subsequent calls', async () => {
      const testConfig = {
        documentBasePath: '/custom/path'
      };
      
      await fs.writeFile(testConfigPath, JSON.stringify(testConfig));
      
      const config1 = await configService.loadConfig(testConfigPath);
      const config2 = await configService.loadConfig(testConfigPath);
      
      expect(config1).toBe(config2); // 同じインスタンスを返すかテスト
    });
  });

  describe('getFullDocumentPath', () => {
    test('should return correct full path', async () => {
      const testConfig = {
        documentBasePath: '/custom/base/path'
      };
      
      await fs.writeFile(testConfigPath, JSON.stringify(testConfig));
      await configService.loadConfig(testConfigPath);
      
      const fullPath = configService.getFullDocumentPath();
      
      expect(fullPath).toBe('/custom/base/path/development-guidelines');
    });

    test('should handle relative paths', async () => {
      const testConfig = {
        documentBasePath: './docs'
      };
      
      await fs.writeFile(testConfigPath, JSON.stringify(testConfig));
      await configService.loadConfig(testConfigPath);
      
      const fullPath = configService.getFullDocumentPath();
      
      expect(fullPath).toBe('docs/development-guidelines');
    });
  });

  describe('error handling', () => {
    test('should throw error when accessing config before loading', () => {
      expect(() => {
        configService.getConfig();
      }).toThrow('Configuration not loaded. Call loadConfig() first.');
    });
  });
});