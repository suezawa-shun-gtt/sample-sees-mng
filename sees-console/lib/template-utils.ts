/**
 * テンプレートファイルからプレースホルダーを抽出するユーティリティ
 */

export interface PlaceholderInfo {
  key: string;
  label: string;
  defaultValue: string;
  required: boolean;
}

/**
 * デフォルトテンプレートのプレースホルダー定義
 */
export const DEFAULT_PLACEHOLDERS: PlaceholderInfo[] = [
  // 画面表示要素
  {
    key: 'SERVICE_NAME',
    label: 'サービス名',
    defaultValue: '',
    required: true,
  },
  {
    key: 'SERVICE_CATEGORY',
    label: 'サービスカテゴリ',
    defaultValue: '',
    required: true,
  },
  {
    key: 'SERVICE_TITLE',
    label: 'サービスタイトル',
    defaultValue: '',
    required: true,
  },
  {
    key: 'END_DATE',
    label: '終了日',
    defaultValue: '',
    required: true,
  },
  {
    key: 'LAST_UPDATED_DATE',
    label: '最終更新日',
    defaultValue: new Date().toLocaleDateString('ja-JP'),
    required: true,
  },
  {
    key: 'REDIRECT_URL',
    label: 'リダイレクト先URL',
    defaultValue: '',
    required: true,
  },
  {
    key: 'REDIRECT_LINK_TEXT',
    label: 'リダイレクトリンクテキスト',
    defaultValue: 'こちら',
    required: true,
  },
  {
    key: 'CURRENT_YEAR',
    label: '現在の年',
    defaultValue: new Date().getFullYear().toString(),
    required: true,
  },
];

/**
 * HTMLテンプレートにプレースホルダーの値を適用
 */
export function applyPlaceholders(
  template: string,
  values: Record<string, string>
): string {
  let result = template;
  
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    // 値が空でない場合のみ置換、空の場合は元のプレースホルダーを保持
    if (value && value !== `{{${key}}}`) {
      result = result.replace(regex, value);
    }
  });
  
  return result;
}

/**
 * プレースホルダー値の検証
 */
export function validatePlaceholders(
  values: Record<string, string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  DEFAULT_PLACEHOLDERS.forEach((placeholder) => {
    const value = values[placeholder.key];
    // プレースホルダー名自体（{{KEY}}）は未入力とみなす
    const isEmpty = !value || value === `{{${placeholder.key}}}`;
    
    if (placeholder.required && isEmpty) {
      errors.push(`${placeholder.label}は必須項目です`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
