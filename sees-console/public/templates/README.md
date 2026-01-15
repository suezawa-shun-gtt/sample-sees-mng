# テンプレートファイル

サービス終了サイト用のHTMLテンプレートとその設定ファイルです。

## ファイル構成

- **default-template.html** - デフォルトHTMLテンプレート
- **template-config.json** - プレースホルダー設定とサンプル
- **css/** - スタイルシート
- **images/** - 画像ファイル

## プレースホルダー一覧

テンプレートHTMLには以下のプレースホルダーが含まれています：

### 必須項目

| プレースホルダー | 説明 | 例 |
|---|---|---|
| `{{SERVICE_NAME}}` | サービス名 | 東京都新型コロナウイルスワクチン大規模接種予約システム |
| `{{SERVICE_TITLE}}` | サービスタイトル | 大規模接種予約システム |
| `{{END_DATE}}` | サービス終了日 | 令和6年3月31日（日曜日） |
| `{{REDIRECT_URL}}` | リダイレクト先URL | https://www.metro.tokyo.lg.jp/ |

### オプション項目

| プレースホルダー | 説明 | デフォルト値 |
|---|---|---|
| `{{SERVICE_CATEGORY}}` | サービスカテゴリー | 東京都サービス |
| `{{META_KEYWORDS}}` | SEO用キーワード | 東京都, サービス終了 |
| `{{META_DESCRIPTION}}` | SEO用説明文 | このサービスは終了しました |
| `{{LAST_UPDATED_DATE}}` | 最終更新日 | 令和X年X月X日 |
| `{{REDIRECT_LINK_TEXT}}` | リダイレクト先リンク文字列 | 東京都ホームページ |
| `{{REDIRECT_SECONDS}}` | リダイレクトまでの秒数 | 5 |
| `{{CURRENT_YEAR}}` | 著作権表示の年 | 2024（自動取得） |

## 使用方法

### 1. テンプレートエンジンを使用

```typescript
import {
  loadTemplate,
  loadTemplateConfig,
  renderTemplate,
  validatePlaceholders,
} from '@/lib/template-engine';

// テンプレートと設定を読み込み
const template = await loadTemplate();
const config = await loadTemplateConfig();

// プレースホルダーの値を設定
const placeholders = {
  SERVICE_NAME: '東京都○○サービス',
  SERVICE_TITLE: '○○サービス',
  END_DATE: '令和6年12月31日',
  REDIRECT_URL: 'https://www.metro.tokyo.lg.jp/',
  REDIRECT_SECONDS: 5,
  CURRENT_YEAR: new Date().getFullYear(),
};

// バリデーション
const validation = validatePlaceholders(placeholders, config);
if (!validation.valid) {
  console.error(validation.errors);
  return;
}

// HTMLをレンダリング
const html = renderTemplate(template, placeholders);
```

### 2. データベースに保存

レンダリングされたHTMLは、各SEES（Service End Spot）レコードの`displayHtml`フィールドに保存されます。

```typescript
// Prismaを使用してSEESを作成
const sees = await prisma.sees.create({
  data: {
    domain: 'old-service.tokyo.lg.jp',
    redirectUrl: 'https://www.metro.tokyo.lg.jp/',
    displayHtml: html, // レンダリング済みHTML
    // ...
  },
});
```

### 3. Static Web Appにデプロイ

保存されたHTMLは、Azure Static Web Appに自動的にデプロイされます。

## カスタマイズ

### CSS/画像のカスタマイズ

各SEESごとにCSS や画像をカスタマイズする場合は、`/workspaces/sample-sees-mng/sees-console/app/default-index/`配下のファイルをコピーして編集してください。

### テンプレートのカスタマイズ

1. `default-template.html`を編集
2. 新しいプレースホルダーを追加する場合は、`template-config.json`も更新
3. `lib/template-engine.ts`の型定義（`TemplatePlaceholders`）も更新

## サンプル

### 新型コロナワクチン予約サイトの例

```json
{
  "SERVICE_NAME": "東京都新型コロナウイルスワクチン大規模接種予約システム",
  "SERVICE_CATEGORY": "東京都新型コロナウイルスワクチン",
  "SERVICE_TITLE": "大規模接種予約システム",
  "META_KEYWORDS": "東京都, 新型コロナウイルス, ワクチン, 大規模接種, 予約システム",
  "META_DESCRIPTION": "東京都は新型コロナウイルスワクチンの大規模接種会場の運営は終了しました",
  "END_DATE": "令和6年3月31日（日曜日）",
  "LAST_UPDATED_DATE": "令和6年4月12日",
  "REDIRECT_URL": "https://www.hokeniryo.metro.tokyo.lg.jp/kansen/coronavaccine/index.html",
  "REDIRECT_LINK_TEXT": "東京都保健医療局 新型コロナワクチン",
  "REDIRECT_SECONDS": 5,
  "CURRENT_YEAR": 2024
}
```

詳細は`template-config.json`の`examples`セクションを参照してください。

## プレビュー機能

管理画面では、プレースホルダーの値を入力しながらリアルタイムでプレビューを確認できます。

## 注意事項

- プレースホルダーは`{{PLACEHOLDER_NAME}}`の形式で記述してください
- 必須項目は必ず設定してください
- URLは`https://`または`http://`で始まる必要があります
- リダイレクト秒数は3〜30秒の範囲で設定してください
