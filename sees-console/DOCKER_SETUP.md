# Docker開発環境セットアップガイド

## 前提条件

- Docker Desktop がインストールされていること
- Docker Compose V2 がインストールされていること

## セットアップ手順

### 1. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成します：

```bash
cp .env.example .env
```

`.env` ファイルを編集し、Azure認証情報を設定してください：

```env
DATABASE_URL="postgresql://sees_user:sees_password@localhost:5432/sees_db"

AZURE_SUBSCRIPTION_ID="your-actual-subscription-id"
AZURE_TENANT_ID="your-actual-tenant-id"
AZURE_CLIENT_ID="your-actual-client-id"
AZURE_CLIENT_SECRET="your-actual-client-secret"
AZURE_RESOURCE_GROUP="sees-resources"
AZURE_LOCATION="japaneast"
```

### 2. Dockerコンテナの起動

```bash
docker-compose up -d
```

初回起動時は、イメージのビルドと依存関係のインストールに時間がかかります。

### 3. データベースマイグレーション

コンテナ起動時に自動的にマイグレーションが実行されますが、手動で実行する場合：

```bash
docker-compose exec app npx prisma migrate dev
```

### 4. アプリケーションへのアクセス

- **アプリケーション**: http://localhost:3000
- **Prisma Studio** (optional): http://localhost:5555

Prisma Studioを起動する場合：

```bash
docker-compose --profile tools up -d prisma-studio
```

## よく使うコマンド

### コンテナの状態確認

```bash
docker-compose ps
```

### ログの確認

```bash
# 全サービスのログ
docker-compose logs -f

# 特定のサービスのログ
docker-compose logs -f app
docker-compose logs -f db
```

### コンテナに入る

```bash
# アプリケーションコンテナ
docker-compose exec app sh

# データベースコンテナ
docker-compose exec db psql -U sees_user -d sees_db
```

### データベース操作

```bash
# Prisma Studio起動
docker-compose --profile tools up -d prisma-studio

# マイグレーション作成
docker-compose exec app npx prisma migrate dev --name <migration_name>

# Prisma Client再生成
docker-compose exec app npx prisma generate

# データベースリセット
docker-compose exec app npx prisma migrate reset
```

### 依存関係の更新

```bash
# package.jsonを更新後
docker-compose exec app npm install

# または、コンテナを再ビルド
docker-compose up -d --build app
```

### コンテナの停止・削除

```bash
# 停止
docker-compose stop

# 停止して削除
docker-compose down

# ボリュームも含めて削除（データベースデータも削除されます）
docker-compose down -v
```

### コンテナの再起動

```bash
# 全サービス再起動
docker-compose restart

# 特定のサービスのみ再起動
docker-compose restart app
```

## トラブルシューティング

### ポートが既に使用されている

他のサービスがポート3000または5432を使用している場合、`docker-compose.yml`のポートマッピングを変更してください：

```yaml
services:
  app:
    ports:
      - "3001:3000"  # 3001に変更
  
  db:
    ports:
      - "5433:5432"  # 5433に変更
```

その場合、`.env`の`DATABASE_URL`も更新が必要です：

```env
DATABASE_URL="postgresql://sees_user:sees_password@localhost:5433/sees_db"
```

### データベース接続エラー

1. データベースコンテナが正常に起動しているか確認：

```bash
docker-compose ps db
```

2. ヘルスチェックの状態を確認：

```bash
docker-compose exec db pg_isready -U sees_user -d sees_db
```

3. データベースに直接接続できるか確認：

```bash
docker-compose exec db psql -U sees_user -d sees_db
```

### Next.jsのホットリロードが動作しない

Dockerのボリュームマウントの問題の可能性があります。以下を試してください：

1. `next.config.ts`に以下を追加：

```typescript
const config = {
  // ... existing config
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};
```

2. コンテナを再起動：

```bash
docker-compose restart app
```

### キャッシュのクリア

```bash
# Next.jsキャッシュのクリア
docker-compose exec app rm -rf .next

# node_modulesの再インストール
docker-compose exec app rm -rf node_modules
docker-compose exec app npm install

# または、完全に再ビルド
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### データベースのバックアップとリストア

#### バックアップ

```bash
docker-compose exec db pg_dump -U sees_user sees_db > backup.sql
```

#### リストア

```bash
cat backup.sql | docker-compose exec -T db psql -U sees_user sees_db
```

## 開発ワークフロー

### 通常の開発フロー

1. コンテナ起動

```bash
docker-compose up -d
```

2. コードを編集（ホストマシン上で）

3. ブラウザで確認（自動リロード）

4. 必要に応じてログ確認

```bash
docker-compose logs -f app
```

### データベーススキーマ変更時

1. `prisma/schema.prisma`を編集

2. マイグレーション作成

```bash
docker-compose exec app npx prisma migrate dev --name <変更内容>
```

3. Prisma Clientが自動的に再生成される

### 新しいnpmパッケージ追加時

1. `package.json`を編集、またはホストでインストール

```bash
npm install <package-name>
```

2. コンテナ内で再インストール

```bash
docker-compose exec app npm install
```

または

```bash
docker-compose restart app
```

## 本番環境との違い

この開発環境は以下の点で本番環境と異なります：

- ホットリロードが有効
- ソースコードがボリュームマウントされている
- データベースがコンテナ内で動作
- デバッグモードが有効
- Azure接続は開発用の認証情報を使用

本番環境へのデプロイについては、メインの[README.md](README.md)を参照してください。
