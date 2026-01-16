# Azure リソース自動作成機能

## 概要

SEES登録時に、Azure上のDNSゾーンとStatic Web Appを自動的に作成する機能を実装しました。

## 実装内容

### 1. Azure SDKの統合

以下のAzure SDKパッケージを追加:
- `@azure/identity` - Azure認証
- `@azure/arm-resources` - ARMテンプレートデプロイ
- `@azure/arm-dns` - DNS管理
- `@azure/arm-appservice` - Static Web App管理

### 2. Azure操作ライブラリ (`lib/azure.ts`)

主な機能:
- `deployAzureResources()` - DNSゾーン、Static Web App、Aレコードを作成
- `registerCustomDomain()` - カスタムドメインをStatic Web Appに登録
- `deleteAzureResources()` - Azureリソースを削除
- `isAzureConfigured()` - Azure設定の有効性チェック

### 3. データベーススキーマ更新

`Sees`テーブルに以下のフィールドを追加:
- `azureStaticAppName` - 作成したStatic Web App名
- `azureDnsZoneName` - 作成したDNSゾーン名

### 4. API統合

#### SEES作成API (`/api/sees`)
1. Azure設定が有効な場合、Azureリソースをデプロイ
2. DNSゾーンのネームサーバー情報を取得してNSレコードに保存
3. Static Web AppのURLをpreviewUrlに設定
4. 30秒後にカスタムドメインを登録（バックグラウンド処理）

#### SEES削除API (`/api/sees/[id]`)
1. Azure設定が有効で、Azure情報が保存されている場合
2. Static Web AppとDNSゾーンを削除
3. データベースからSEES情報を削除

## 環境変数設定

以下の環境変数を設定してください:

```env
# Azure認証情報
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Azure設定
AZURE_RESOURCE_GROUP=sees-resources
AZURE_LOCATION=japaneast
```

### サービスプリンシパルの作成

```bash
# Azure CLIでサービスプリンシパルを作成
az ad sp create-for-rbac --name "sees-console-sp" \
  --role="Contributor" \
  --scopes="/subscriptions/{subscription-id}/resourceGroups/{resource-group}"
```

出力された情報を環境変数に設定:
- `appId` → `AZURE_CLIENT_ID`
- `password` → `AZURE_CLIENT_SECRET`
- `tenant` → `AZURE_TENANT_ID`

## デプロイフロー

### SEES作成時

```
1. ユーザーがSEES情報を入力
   ↓
2. APIがAzure設定をチェック
   ↓
3. ARMテンプレートをデプロイ
   - DNSゾーン作成
   - Static Web App作成
   - Aレコード(エイリアス)作成
   ↓
4. ネームサーバー情報とStatic Web App URLを取得
   ↓
5. データベースに保存
   ↓
6. 30秒待機後、カスタムドメインを登録
```

### SEES削除時

```
1. ユーザーがSEES削除を実行
   ↓
2. Azure情報が存在する場合
   - Static Web Appを削除
   - DNSゾーンを削除
   ↓
3. データベースからSEES情報を削除
```

## 注意事項

### カスタムドメイン登録について

ARMテンプレートでカスタムドメインを同時に作成すると失敗するため、以下の2段階アプローチを採用:

1. **第1段階**: リソース作成
   - DNSゾーン
   - Static Web App
   - Aレコード(エイリアス)

2. **第2段階**: カスタムドメイン登録
   - リソース作成完了後、30秒待機
   - バックグラウンドでカスタムドメインを登録

### コスト

- **DNSゾーン**: 約$0.50/月 + クエリ料金
- **Static Web App (Free SKU)**: 無料（帯域幅制限あり）
- **Static Web App (Standard SKU)**: 約$9/月

デフォルトはFree SKUを使用します。

## トラブルシューティング

### "Azure credentials not configured"

環境変数が正しく設定されているか確認:
```bash
docker-compose exec app printenv | grep AZURE
```

### カスタムドメイン登録失敗

カスタムドメインの登録は30秒待機後に実行されますが、それでも失敗する場合があります。
以下のコマンドで手動登録できます:

```bash
az staticwebapp hostname set \
  --name <static-app-name> \
  --hostname <custom-domain> \
  --resource-group <resource-group>
```

### デプロイタイムアウト

大量のSEESを一度に作成すると、Azureのレート制限に達する可能性があります。
少数ずつ作成することをお勧めします。

## 今後の拡張

- [ ] Static Web AppへのHTMLコンテンツアップロード機能
- [ ] デプロイステータスの監視
- [ ] カスタムドメイン登録の再試行ロジック
- [ ] Azure DevOps/GitHub Actionsとの統合
