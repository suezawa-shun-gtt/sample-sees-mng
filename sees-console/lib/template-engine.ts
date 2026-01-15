/**
 * HTMLテンプレートエンジン
 * プレースホルダーを実際の値に置き換える
 */

export interface TemplatePlaceholders {
  SERVICE_NAME: string;
  SERVICE_CATEGORY?: string;
  SERVICE_TITLE: string;
  META_KEYWORDS?: string;
  META_DESCRIPTION?: string;
  END_DATE: string;
  LAST_UPDATED_DATE?: string;
  REDIRECT_URL: string;
  REDIRECT_LINK_TEXT?: string;
  REDIRECT_SECONDS?: number;
  CURRENT_YEAR?: number;
}

export interface TemplateConfig {
  version: string;
  description: string;
  placeholders: {
    [key: string]: {
      type: string;
      description: string;
      default: string | number;
      required: boolean;
      maxLength?: number;
      min?: number;
      max?: number;
      validation?: string;
      auto?: boolean;
    };
  };
  examples: Array<{
    name: string;
    values: TemplatePlaceholders;
  }>;
}

/**
 * テンプレートHTMLを読み込む
 */
export async function loadTemplate(): Promise<string> {
  const response = await fetch('/templates/default-template.html');
  if (!response.ok) {
    throw new Error('テンプレートの読み込みに失敗しました');
  }
  return response.text();
}

/**
 * テンプレート設定を読み込む
 */
export async function loadTemplateConfig(): Promise<TemplateConfig> {
  const response = await fetch('/templates/template-config.json');
  if (!response.ok) {
    throw new Error('テンプレート設定の読み込みに失敗しました');
  }
  return response.json();
}

/**
 * デフォルト値を取得
 */
export function getDefaultPlaceholders(config: TemplateConfig): TemplatePlaceholders {
  const defaults: any = {};
  
  Object.entries(config.placeholders).forEach(([key, placeholder]) => {
    if (placeholder.auto && key === 'CURRENT_YEAR') {
      defaults[key] = new Date().getFullYear();
    } else {
      defaults[key] = placeholder.default;
    }
  });
  
  return defaults as TemplatePlaceholders;
}

/**
 * プレースホルダーの検証
 */
export function validatePlaceholders(
  placeholders: TemplatePlaceholders,
  config: TemplateConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  Object.entries(config.placeholders).forEach(([key, placeholder]) => {
    const value = placeholders[key as keyof TemplatePlaceholders];
    
    // 必須チェック
    if (placeholder.required && !value) {
      errors.push(`${key}は必須項目です`);
      return;
    }
    
    if (!value) return;
    
    // 型チェック
    if (placeholder.type === 'number' && typeof value !== 'number') {
      errors.push(`${key}は数値である必要があります`);
      return;
    }
    
    if (placeholder.type === 'string' && typeof value !== 'string') {
      errors.push(`${key}は文字列である必要があります`);
      return;
    }
    
    // 文字列の長さチェック
    if (placeholder.type === 'string' && placeholder.maxLength) {
      if (typeof value === 'string' && value.length > placeholder.maxLength) {
        errors.push(`${key}は${placeholder.maxLength}文字以内である必要があります`);
      }
    }
    
    // 数値の範囲チェック
    if (placeholder.type === 'number') {
      if (placeholder.min !== undefined && typeof value === 'number' && value < placeholder.min) {
        errors.push(`${key}は${placeholder.min}以上である必要があります`);
      }
      if (placeholder.max !== undefined && typeof value === 'number' && value > placeholder.max) {
        errors.push(`${key}は${placeholder.max}以下である必要があります`);
      }
    }
    
    // URLバリデーション
    if (placeholder.type === 'url' && placeholder.validation) {
      const regex = new RegExp(placeholder.validation);
      if (typeof value === 'string' && !regex.test(value)) {
        errors.push(`${key}は有効なURLである必要があります`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * テンプレートをレンダリング
 */
export function renderTemplate(
  template: string,
  placeholders: TemplatePlaceholders
): string {
  let rendered = template;
  
  // プレースホルダーを実際の値に置き換え
  Object.entries(placeholders).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    rendered = rendered.replace(regex, String(value ?? ''));
  });
  
  return rendered;
}

/**
 * HTMLから既存のプレースホルダー値を抽出（編集時用）
 */
export function extractPlaceholders(html: string): Partial<TemplatePlaceholders> {
  const placeholders: Partial<TemplatePlaceholders> = {};
  
  // タイトルタグから抽出
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  if (titleMatch) {
    placeholders.SERVICE_NAME = titleMatch[1];
  }
  
  // メタタグから抽出
  const keywordsMatch = html.match(/<meta name="keywords" content="(.*?)"/);
  if (keywordsMatch) {
    placeholders.META_KEYWORDS = keywordsMatch[1];
  }
  
  const descriptionMatch = html.match(/<meta name="description" content="(.*?)"/);
  if (descriptionMatch) {
    placeholders.META_DESCRIPTION = descriptionMatch[1];
  }
  
  // リダイレクトURLを抽出
  const redirectMatch = html.match(/window\.location\.href = '(.*?)'/);
  if (redirectMatch) {
    placeholders.REDIRECT_URL = redirectMatch[1];
  }
  
  // リダイレクト秒数を抽出
  const secondsMatch = html.match(/setTimeout\(function\(\) \{[^}]*\}, (\d+)\*1000\)/);
  if (secondsMatch) {
    placeholders.REDIRECT_SECONDS = parseInt(secondsMatch[1], 10);
  }
  
  return placeholders;
}

/**
 * テンプレートプレビュー用のサンプルデータを生成
 */
export function generateSamplePlaceholders(): TemplatePlaceholders {
  return {
    SERVICE_NAME: '東京都サンプルサービス',
    SERVICE_CATEGORY: '東京都',
    SERVICE_TITLE: 'サンプルサービス',
    META_KEYWORDS: '東京都, サンプル, サービス終了',
    META_DESCRIPTION: 'このサービスは終了しました',
    END_DATE: '令和6年12月31日（日曜日）',
    LAST_UPDATED_DATE: '令和7年1月1日',
    REDIRECT_URL: 'https://www.metro.tokyo.lg.jp/',
    REDIRECT_LINK_TEXT: '東京都ホームページ',
    REDIRECT_SECONDS: 5,
    CURRENT_YEAR: new Date().getFullYear(),
  };
}
