# SEES Console - セットアップ手順

## 必要な環境

- Docker Desktop
- Docker Compose V2

または

- Node.js 20以上
- PostgreSQL

## Docker環境でのセットアップ（推奨）

### 1. 環境変数の確認

`.env`ファイルが既に存在しますが、必要に応じて編集してください：

```bash
# .env ファイルの内容
DATABASE_URL="postgresql://sees_user:sees_password@localhost:5432/sees_db"

# Azure認証情報（実際の値に置き換えてください）
AZURE_SUBSCRIPTION_ID="your-subscription-id"
AZURE_TENANT_ID="your-tenant-id"
AZURE_CLIENT_ID="your-client-id"
AZURE_CLIENT_SECRET="your-client-secret"
AZURE_RESOURCE_GROUP="sees-resources"
AZURE_LOCATION="japaneast"
```

### 2. Dockerコンテナの起動

```bash
cd sees-console
docker-compose up -d
```

### 3. ログの確認

```bash
docker-compose logs -f app
```

### 4. アプリケーションへのアクセス

ブラウザで http://localhost:3000 にアクセスしてください。

### 5. コンテナの停止

```bash
docker-compose down
```

### よく使うコマンド

```bash
# コンテナの状態確認
docker-compose ps

# データベースコンテナに接続
docker-compose exec db psql -U sees_user -d sees_db

# アプリケーションコンテナに接続
docker-compose exec app sh

# Prisma Studioを起動（データベースGUI）
docker-compose --profile tools up -d prisma-studio
# http://localhost:5555 でアクセス

# マイグレーション作成
docker-compose exec app npx prisma migrate dev --name <migration_name>

# データベースリセット
docker-compose exec app npx prisma migrate reset
```

---

## ローカル環境でのセットアップ（Docker不使用）

### 1. 依存パッケージのインストール

```bash
cd sees-console
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成し、データベース接続情報を設定してください：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/sees_db?schema=public"
```

### 3. データベースのマイグレーション

```bash
npx prisma migrate dev --name init
```

### 4. Prisma Clientの生成

```bash
npx prisma generate
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスしてください。

## データベーススキーマ

### Seesテーブル

SEES（サービス終了サイト）の基本情報を管理します。

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| targetDomain | String | 対象ドメイン（ユニーク） |
| redirectUrl | String | リダイレクト先URL |
| templateVariables | Json | テンプレートのプレースホルダー値 |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |

#### templateVariablesの構造例

```json
{
  "SERVICE_NAME": "サービス名",
  "SERVICE_CATEGORY": "カテゴリ",
  "SERVICE_TITLE": "タイトル",
  "META_KEYWORDS": "キーワード",
  "META_DESCRIPTION": "説明",
  "LAST_UPDATED_DATE": "2026年1月15日",
  "END_DATE": "2025年12月31日",
  "REDIRECT_SECONDS": "10",
  "REDIRECT_URL": "https://example.com",
  "REDIRECT_LINK_TEXT": "新しいサイト",
  "CURRENT_YEAR": "2026"
}
```

### NsRecordテーブル

各SEESに紐づくDNSのNSレコード情報を管理します。

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー |
| seesId | UUID | 外部キー（Seesテーブル） |
| nameServer | String | ネームサーバーのFQDN |
| createdAt | DateTime | 作成日時 |

## API エンドポイント

### SEES一覧取得

```
GET /api/sees
```

レスポンス例：

```json
[
  {
    "id": "uuid",
    "targetDomain": "example.com",
    "redirectUrl": "https://new-example.com",
    "templateVariables": { ... },
    "createdAt": "2026-01-15T00:00:00.000Z",
    "updatedAt": "2026-01-15T00:00:00.000Z",
    "nsRecords": [
      {
        "id": "uuid",
        "seesId": "uuid",
        "nameServer": "ns1.azure-dns.com",
        "createdAt": "2026-01-15T00:00:00.000Z"
      }
    ]
  }
]
```

## 今後の実装予定

- SEES新規作成機能
- SEES編集機能
- SEES削除機能
- Azure自動構築機能
  - DNSゾーン作成
  - Static Web App作成・デプロイ
  - ドメインルーティング設定
