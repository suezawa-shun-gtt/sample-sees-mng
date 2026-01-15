# SEES Console - サービス終了サイト管理コンソール

SEES (Service End Spot) Management System のフロントエンド管理画面です。

## 概要

終了した東京都政サービスのドメイン管理、リダイレクト設定、案内HTML管理を行うための管理コンソールです。Azure DNSゾーンとStatic Web Appの自動構築機能を備えています。

## 主な機能

### SEES管理機能
- **一覧表示**: 登録済みSEES情報の表示とフィルタリング
- **新規登録**: 新しいSEESの作成
- **編集**: 既存SEESの情報更新
- **削除**: 不要なSEESの削除

### SEES情報項目
各SEESには以下の情報が含まれます：
- 対象ドメイン（例: `old-service.tokyo.lg.jp`）
- リダイレクト先URL（例: `https://new-service.tokyo.lg.jp`）
- 表示用HTML（カスタマイズ可能な案内テンプレート）
- 作成日時・更新日時

### Azure連携機能
- DNSゾーンの自動作成
- Static Web Appの自動デプロイ
- NSレコードの表示と管理
- リソースの稼働状態監視

### HTMLテンプレート機能
- デフォルトテンプレートの提供
- WYSIWYG形式でのHTML編集
- プレビュー機能
- リダイレクトタイマーの設定

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: Prisma ORM
- **認証**: 未定（今後実装予定）
- **Azure SDK**: @azure/arm-dns, @azure/arm-appservice

## セットアップ

### 前提条件

- Node.js 18以上
- npm または yarn
- PostgreSQL（またはPrismaがサポートする他のDB）
- Azureアカウント

### インストール

1. 依存関係のインストール:
```bash
npm install
```

2. 環境変数の設定:
`.env` ファイルを作成し、以下の内容を設定してください：
```env
# データベース接続
DATABASE_URL="postgresql://user:password@localhost:5432/sees_db"

# Azure認証情報
AZURE_SUBSCRIPTION_ID="your-subscription-id"
AZURE_TENANT_ID="your-tenant-id"
AZURE_CLIENT_ID="your-client-id"
AZURE_CLIENT_SECRET="your-client-secret"

# Azureリソースグループ
AZURE_RESOURCE_GROUP="sees-resources"
AZURE_LOCATION="japaneast"
```

3. データベースのマイグレーション:
```bash
npx prisma migrate dev
```

4. Prisma Clientの生成:
```bash
npx prisma generate
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## データベーススキーマ

主要なモデル：

### Sees
- `id`: 一意識別子
- `domain`: 対象ドメイン（ユニーク）
- `redirectUrl`: リダイレクト先URL
- `displayHtml`: 表示用HTML
- `nsRecords`: NSレコード（JSON配列）
- `azureDnsZoneId`: Azure DNSゾーンのリソースID
- `azureStaticWebAppId`: Azure Static Web AppのリソースID
- `status`: ステータス（active/inactive/pending）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

## プロジェクト構成

```
sees-console/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # ルートレイアウト
│   ├── page.tsx             # トップページ
│   ├── sees/                # SEES管理画面
│   │   ├── page.tsx        # 一覧ページ
│   │   ├── new/            # 新規作成
│   │   └── [id]/           # 詳細・編集
│   └── api/                 # APIルート
│       └── sees/            # SEES API
├── components/              # 再利用可能なコンポーネント
├── lib/                     # ユーティリティ・ヘルパー
│   ├── prisma.ts           # Prismaクライアント
│   └── azure.ts            # Azure SDK ラッパー
├── prisma/
│   └── schema.prisma       # データベーススキーマ
└── public/
    └── templates/          # HTMLテンプレート
```

## API エンドポイント

### SEES API
- `GET /api/sees` - SEES一覧取得
- `POST /api/sees` - SEES新規作成（Azure リソースも自動作成）
- `GET /api/sees/[id]` - SEES詳細取得
- `PUT /api/sees/[id]` - SEES更新
- `DELETE /api/sees/[id]` - SEES削除（Azure リソースも削除）

### Azure API
- `POST /api/azure/dns-zone` - DNSゾーン作成
- `GET /api/azure/dns-zone/[id]/ns-records` - NSレコード取得
- `POST /api/azure/static-web-app` - Static Web App作成

## デプロイ

### Vercelへのデプロイ

```bash
npm run build
vercel deploy
```

環境変数も忘れずに設定してください。

### Azureへのデプロイ

Azure App Service や Container Appsへのデプロイも可能です。

## 開発ガイドライン

### コーディング規約
- TypeScript strictモードを使用
- ESLintとPrettierでコードフォーマット
- コンポーネントは関数コンポーネントで実装
- Server ComponentsとClient Componentsを適切に使い分け

### Git ワークフロー
- `main` ブランチは保護
- 機能追加は feature ブランチで開発
- プルリクエストでレビュー後マージ

## トラブルシューティング

### データベース接続エラー
```bash
# Prisma Clientを再生成
npx prisma generate

# マイグレーションをリセット
npx prisma migrate reset
```

### Azure認証エラー
- 環境変数が正しく設定されているか確認
- Azureサービスプリンシパルの権限を確認

## 今後の実装予定

- [ ] ユーザー認証機能
- [ ] 権限管理（RBAC）
- [ ] 監査ログ機能
- [ ] バックアップ・リストア機能
- [ ] 一括インポート・エクスポート
- [ ] メール通知機能
- [ ] ダッシュボード（統計情報）

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Azure DNS Documentation](https://docs.microsoft.com/azure/dns/)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)

## ライセンス

東京都政サービス管理用システム
