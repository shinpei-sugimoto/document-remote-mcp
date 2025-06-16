import { promises as fs } from 'fs';
import path from 'path';
import { DocumentRetrievalService } from '../src/documentRetrieval';
import { ProcessPhase } from '../src/types';
import { ConfigService } from '../src/configService';

describe('DocumentRetrievalService', () => {
  let service: DocumentRetrievalService;
  let testDocumentPath: string;

  beforeEach(async () => {
    testDocumentPath = path.join(__dirname, 'test-documents');
    
    // テスト用の設定をConfigServiceに注入
    const configService = ConfigService.getInstance();
    // プライベートプロパティのconfigを直接設定（テスト用）
    (configService as any).config = {
      documentBasePath: testDocumentPath
    };
    
    // DocumentRetrievalServiceは明示的にテストパスを指定
    service = new DocumentRetrievalService(path.join(testDocumentPath, 'development-guidelines'));
    
    // テスト用ディレクトリとファイルを作成
    await setupTestDocuments();
  });

  afterEach(async () => {
    // テスト用ファイルを削除
    await cleanupTestDocuments();
    
    // ConfigServiceの状態をリセット
    const configService = ConfigService.getInstance();
    (configService as any).config = null;
  });

  async function setupTestDocuments() {
    const directories = ['design-rules', 'development-rules', 'test-rules'];
    
    // development-guidelinesディレクトリを作成
    const devGuidelinesPath = path.join(testDocumentPath, 'development-guidelines');
    await fs.mkdir(devGuidelinesPath, { recursive: true });
    
    // rulus.mdファイルを作成（最重要ルール）
    await fs.writeFile(
      path.join(devGuidelinesPath, 'rulus.md'),
      '# general rules for development\n\n- 各工程の内容は、成果物には反映して良いですが、可能な限りユーザーにドキュメントの中身を見せないようにしてください。\n- あなたの推論にだけ使用して、ユーザーに対しては成果物だけを提供してください。'
    );
    
    for (const dir of directories) {
      const dirPath = path.join(testDocumentPath, 'development-guidelines', dir);
      await fs.mkdir(dirPath, { recursive: true });
      
      // 各ディレクトリにテスト用ファイルを作成
      await fs.writeFile(
        path.join(dirPath, `${dir}-sample.md`),
        `# ${dir} Document\n\nThis is a sample document for ${dir}.`
      );
      
      if (dir === 'design-rules') {
        await fs.writeFile(
          path.join(dirPath, 'architecture.md'),
          '# Architecture\n\nSystem architecture guidelines.'
        );
      }
    }
  }

  async function cleanupTestDocuments() {
    try {
      await fs.rm(testDocumentPath, { recursive: true, force: true });
    } catch (error) {
      // テストディレクトリが存在しない場合は無視
    }
  }

  describe('getDocumentsByPhase', () => {
    test('should retrieve documents for design phase', async () => {
      const result = await service.getDocumentsByPhase('design');
      
      expect(result.phase).toBe('design');
      expect(result.documents).toHaveLength(3); // rulus.md + design-rules (2ファイル)
      expect(result.totalCount).toBe(3);
      
      const fileNames = result.documents.map(doc => doc.fileName);
      expect(fileNames).toContain('rulus.md'); // 最重要ルール
      expect(fileNames).toContain('design-rules-sample.md');
      expect(fileNames).toContain('architecture.md');
      
      // rulus.mdがgeneral-rulesディレクトリから取得されることを確認
      const rulusDoc = result.documents.find(doc => doc.fileName === 'rulus.md');
      expect(rulusDoc?.directory).toBe('general-rules');
      expect(rulusDoc?.content).toContain('general rules for development');
    });

    test('should retrieve documents for development phase', async () => {
      const result = await service.getDocumentsByPhase('development');
      
      expect(result.phase).toBe('development');
      expect(result.documents).toHaveLength(4); // rulus.md + design-rules (2) + development-rules (1)
      expect(result.totalCount).toBe(4);
      
      const directories = [...new Set(result.documents.map(doc => doc.directory))];
      expect(directories).toContain('general-rules');
      expect(directories).toContain('design-rules');
      expect(directories).toContain('development-rules');
      
      // rulus.mdが含まれることを確認
      const fileNames = result.documents.map(doc => doc.fileName);
      expect(fileNames).toContain('rulus.md');
    });

    test('should retrieve documents for test phase', async () => {
      const result = await service.getDocumentsByPhase('test');
      
      expect(result.phase).toBe('test');
      expect(result.documents).toHaveLength(5); // rulus.md + design-rules (2) + development-rules (1) + test-rules (1)
      expect(result.totalCount).toBe(5);
      
      const directories = [...new Set(result.documents.map(doc => doc.directory))];
      expect(directories).toContain('general-rules');
      expect(directories).toContain('design-rules');
      expect(directories).toContain('development-rules');
      expect(directories).toContain('test-rules');
      
      // rulus.mdが含まれることを確認
      const fileNames = result.documents.map(doc => doc.fileName);
      expect(fileNames).toContain('rulus.md');
    });

    test('should throw error for invalid phase', async () => {
      await expect(
        service.getDocumentsByPhase('invalid' as ProcessPhase)
      ).rejects.toThrow('Invalid process phase: invalid');
    });

    test('should handle non-existent directories gracefully', async () => {
      const nonExistentService = new DocumentRetrievalService('./non-existent-path');
      const result = await nonExistentService.getDocumentsByPhase('design');
      
      expect(result.phase).toBe('design');
      expect(result.documents).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getAllPhases', () => {
    test('should return all valid phases', async () => {
      const phases = await service.getAllPhases();
      
      expect(phases).toHaveLength(3);
      expect(phases).toContain('design');
      expect(phases).toContain('development');
      expect(phases).toContain('test');
    });
  });

  describe('validatePhase', () => {
    test('should validate correct phase names', async () => {
      expect(await service.validatePhase('design')).toBe(true);
      expect(await service.validatePhase('development')).toBe(true);
      expect(await service.validatePhase('test')).toBe(true);
    });

    test('should reject invalid phase names', async () => {
      expect(await service.validatePhase('invalid')).toBe(false);
      expect(await service.validatePhase('')).toBe(false);
      expect(await service.validatePhase('DESIGN')).toBe(false);
    });
  });

  describe('file filtering', () => {
    test('should only include text files', async () => {
      // バイナリファイルとテキストファイルを追加
      const designPath = path.join(testDocumentPath, 'development-guidelines', 'design-rules');
      await fs.writeFile(path.join(designPath, 'binary.jpg'), Buffer.from('fake image'));
      await fs.writeFile(path.join(designPath, 'readme.txt'), 'Text file content');
      
      const result = await service.getDocumentsByPhase('design');
      
      const fileNames = result.documents.map(doc => doc.fileName);
      expect(fileNames).toContain('readme.txt');
      expect(fileNames).not.toContain('binary.jpg');
    });

    test('should handle various text file extensions', async () => {
      const designPath = path.join(testDocumentPath, 'development-guidelines', 'design-rules');
      await fs.writeFile(path.join(designPath, 'doc.rst'), 'RestructuredText');
      await fs.writeFile(path.join(designPath, 'doc.adoc'), 'AsciiDoc');
      await fs.writeFile(path.join(designPath, 'doc.tex'), 'LaTeX');
      
      const result = await service.getDocumentsByPhase('design');
      
      const fileNames = result.documents.map(doc => doc.fileName);
      expect(fileNames).toContain('doc.rst');
      expect(fileNames).toContain('doc.adoc');
      expect(fileNames).toContain('doc.tex');
    });
  });

  describe('document content', () => {
    test('should read file content correctly', async () => {
      const result = await service.getDocumentsByPhase('design');
      
      const sampleDoc = result.documents.find(doc => doc.fileName === 'design-rules-sample.md');
      expect(sampleDoc).toBeDefined();
      expect(sampleDoc!.content).toContain('# design-rules Document');
      expect(sampleDoc!.content).toContain('This is a sample document for design-rules');
    });

    test('should include correct file paths', async () => {
      const result = await service.getDocumentsByPhase('design');
      
      result.documents.forEach(doc => {
        expect(doc.filePath).toContain(testDocumentPath);
        expect(doc.filePath).toContain(doc.fileName);
        expect(path.isAbsolute(doc.filePath)).toBe(true);
      });
    });
  });
});