# Docker運用ガイド

このドキュメントでは、Document Remote MCPサーバーをDockerコンテナとして実行する方法を説明します。

## 🐳 概要

Dockerを使用することで以下のメリットがあります：
- 環境の一貫性（Node.js、依存関係等が自動で管理される）
- 簡単な配布とインストール
- 分離されたセキュアな実行環境
- ワンコマンドでの起動・停止

## 🚀 クイックスタート

### 前提条件
- Docker
- Docker Compose

### 基本的な使用方法

1. **リポジトリをクローン**
```bash
git clone <repository-url>
cd document-remote-mcp
```

2. **ドキュメントを準備**
```bash
# development-guidelinesディレクトリにドキュメントを配置
# 例：
# development-guidelines/
# ├── rulus.md
# ├── design-rules/
# ├── development-rules/
# └── test-rules/
```

3. **Docker Composeで起動**
```bash
docker-compose up -d
```

4. **動作確認**
```bash
# ヘルスチェック
docker-compose ps

# ログ確認
docker-compose logs -f
```

5. **アクセス**
- MCPエンドポイント: `http://localhost:8080/mcp`
- ホストのIPアドレスを使用して他のマシンからもアクセス可能

## 📋 Docker Compose設定

### デフォルト設定
```yaml
version: '3.8'
services:
  document-remote-mcp:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./development-guidelines:/app/documents/development-guidelines:ro
```

### カスタム設定例

#### 異なるポートでの起動
```yaml
services:
  document-remote-mcp:
    ports:
      - "3000:8080"  # ホストの3000番ポートでアクセス
```

#### 異なるドキュメントディレクトリ
```yaml
services:
  document-remote-mcp:
    volumes:
      - /path/to/your/docs/development-guidelines:/app/documents/development-guidelines:ro
```

## 🔧 運用コマンド

### 基本操作
```bash
# サービス起動（バックグラウンド）
docker-compose up -d

# サービス停止
docker-compose down

# ログ表示
docker-compose logs -f

# サービス状態確認
docker-compose ps
```

### 更新とメンテナンス
```bash
# イメージ再ビルド
docker-compose build --no-cache

# 設定変更後の再起動
docker-compose down && docker-compose up -d

# 完全削除（コンテナ、ネットワーク、ボリューム）
docker-compose down -v --rmi all
```

## 🌐 ネットワーク設定

### 他のマシンからのアクセス

1. **ホストマシンのIPアドレスを確認**
```bash
# Linux/macOS
ip addr show
# または
ifconfig

# Windows
ipconfig
```

2. **ファイアウォール設定**
```bash
# Ubuntu/Debian
sudo ufw allow 8080

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

3. **クライアント設定**
- エンドポイント: `http://<HOST_IP>:8080/mcp`

## 🛡️ セキュリティ考慮事項

### 本番環境での推奨設定

1. **非rootユーザーでの実行**（デフォルトで対応済み）
2. **読み取り専用マウント**（`:ro`フラグ）
3. **プライベートネットワークでの使用**
4. **ログ監視の設定**

### 追加のセキュリティ設定例
```yaml
services:
  document-remote-mcp:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
```

## 🔍 トラブルシューティング

### よくある問題

#### 1. ポートが使用中
```bash
# ポート使用状況確認
lsof -i :8080

# 別のポートを使用
# docker-compose.ymlでポート変更
```

#### 2. ドキュメントが見つからない
```bash
# マウント確認
docker-compose exec document-remote-mcp ls -la /app/documents/

# パーミッション確認
ls -la development-guidelines/
```

#### 3. コンテナが起動しない
```bash
# 詳細ログ確認
docker-compose logs

# ビルドエラー確認
docker-compose build
```

### ヘルスチェック
```bash
# MCP エンドポイントの動作確認
curl http://localhost:8080/mcp

# コンテナ内部のヘルスチェック
docker-compose exec document-remote-mcp wget --spider http://localhost:8080/mcp
```

## 📊 監視とログ

### ログ設定
```yaml
services:
  document-remote-mcp:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 監視例
```bash
# リソース使用量監視
docker stats document-remote-mcp

# ログ監視
docker-compose logs -f --tail=100
```