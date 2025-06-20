# Document Remote MCP

**注意**: このドキュメントはAIによって作成されています。

**Cautious**: This document is generated by AI.

開発プロセスの各工程に応じたドキュメントをMCP (Model Context Prot１ocol) 経由でリモート取得するためのサーバーです。AI開発支援において、適切なドキュメントを段階的に提供し、ユーザーには成果物のみを表示する仕組みを提供します。

## 🎯 概要

このシステムは、開発の各工程（設計・開発・テスト）に応じて必要なドキュメントを自動的に取得し、AIの推論に活用します。重要な点として、**ドキュメントの内容はユーザーに直接表示せず、AIの内部処理でのみ使用**することで、適切なガイダンスを提供しながらユーザーエクスペリエンスを保護します。

**リモートアクセス対応**: 1台のPC上でサーバーを起動し、チーム内の他のメンバーがMCPクライアント経由でドキュメントにアクセスできます。ドキュメントの配置場所は`config.json`で柔軟に設定可能で、個人のPC環境に合わせてカスタマイズできます。

## 🚀 クイックスタート

### 前提条件
- Node.js (v21.7.3以上推奨)
- npm

### インストール・起動
```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（ポート8080）
npm run dev
```

### MCPサーバー接続
サーバーが起動すると、以下のエンドポイントでMCPサーバーにアクセスできます：
```
http://localhost:8080/mcp
```

## 👥 使用方法

### 🖥️ サーバー起動者（管理者）

#### 1. 環境準備
```bash
# リポジトリをクローン
git clone <repository-url>
cd document-remote-mcp

# 依存関係をインストール
npm install
```

#### 2. ドキュメント配置
- `development-guidelines/`ディレクトリにルール文書を配置
- 必要に応じて`config.json`でドキュメントパスを設定
```json
{
  "documentBasePath": "/path/to/your/documents"
}
```

#### 3. サーバー起動
```bash
# 開発モード（推奨）
npm run dev

# または本番モード
npm run build
npm start
```

#### 4. アクセス情報の共有
利用者に以下の情報を伝える：
- **IPアドレス**: サーバーのIPアドレス（例：`192.168.1.100`）
- **ポート**: `8080`（デフォルト）
- **MCPエンドポイント**: `http://<IP>:8080/mcp`

### 👤 利用者（クライアント側）

#### 1. MCPエンドポイントの設定
管理者から受け取った情報をMCPクライアントに設定：

**Claude Desktop の場合:**
`~/.claude_desktop_config.json`に追加：
```json
{
  "mcpServers": {
    "document-remote": {
      "command": "node",
      "args": ["-e", "console.log('MCP_TRANSPORT_HTTP'); process.exit(0);"],
      "env": {
        "MCP_TRANSPORT_HTTP": "http://<SERVER_IP>:8080/mcp"
      }
    }
  }
}
```

**その他のMCPクライアント:**
- エンドポイントURL: `http://<SERVER_IP>:8080/mcp`
- トランスポート: HTTP Stream

#### 2. 利用可能なツール
接続後、以下のツールが利用可能：

- `get_phase_documents` - 工程別ドキュメント取得
- `get_document_content` - 特定ドキュメント取得
- `list_available_phases` - 工程一覧取得

#### 3. 使用例
```bash
# 設計工程のドキュメントを取得
get_phase_documents(phase: "design")

# 開発工程のドキュメントを取得  
get_phase_documents(phase: "development")

# 特定ファイルの内容を取得
get_document_content(phase: "development", fileName: "dev_rules.md")
```

### 🌐 ネットワーク設定

#### ファイアウォール設定
サーバー側で8080ポートを開放：
```bash
# Ubuntu/Debian
sudo ufw allow 8080

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

#### プライベートネットワーク利用推奨
- 社内LAN等のプライベートネットワークでの利用を推奨
- インターネット公開は避ける（セキュリティ上の理由）

## 📋 提供機能

### MCPツール

#### 1. `get_phase_documents`
指定された工程の全ドキュメントを取得
```json
{
  "phase": "design" | "development" | "test"
}
```

#### 2. `get_document_content`  
特定のドキュメント内容を取得
```json
{
  "phase": "design" | "development" | "test",
  "fileName": "example.md",
  "directory": "design-rules" // オプション
}
```

#### 3. `list_available_phases`
利用可能な工程一覧を取得

### 工程別ドキュメント構成

| 工程       | 取得されるドキュメント                              |
| ---------- | --------------------------------------------------- |
| **設計**   | 一般ルール + 設計ルール                             |
| **開発**   | 一般ルール + 設計ルール + 開発ルール                |
| **テスト** | 一般ルール + 設計ルール + 開発ルール + テストルール |

## 📁 ディレクトリ構造

```
development-guidelines/
├── rulus.md                    # 一般ルール（全工程で必須）
├── design-rules/               # 設計ルール
│   └── design_rules.md
├── development-rules/          # 開発ルール  
│   └── dev_rules.md
└── test-rules/                 # テストルール
    └── unit_test_rules.md
```

## 🛠️ 開発

### 利用可能なコマンド

```bash
# 開発サーバー起動（ホットリロード）
npm run dev

# ファイル監視モード
npm run watch

# プロダクションビルド
npm run build

# ビルド済みアプリケーション実行
npm start

# テスト実行
npm test

# テスト監視モード
npm run test:watch

# テストカバレッジ取得
npm run test:coverage
```

### アーキテクチャ

- **MCP Server**: FastMCPフレームワークによるHTTP Streamサーバー
- **Document Retrieval Service**: ファイルシステムからの段階的ドキュメント読み込み
- **Type-Safe Configuration**: TypeScriptによる型安全な工程設定

### テストについて

テストは独立した環境で実行されるため、実際のドキュメントファイルの追加・変更・削除がテスト結果に影響することはありません。

## ⚠️ 重要な注意事項

### セキュリティポリシー
- **ドキュメント内容の非開示**: `rulus.md`で定義された通り、取得したドキュメント内容はAIの推論にのみ使用し、ユーザーには表示しません
- **成果物中心のアプローチ**: ユーザーには最終的な成果物のみを提供

### ドキュメント管理
- 新しいドキュメントは適切なディレクトリ（`design-rules/`, `development-rules/`, `test-rules/`）に配置
- サポートされるファイル形式: `.md`, `.txt`, `.rst`, `.adoc`, `.tex`
- `rulus.md`は全工程で自動的に含まれる最重要ルール