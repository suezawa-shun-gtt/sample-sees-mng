'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DEFAULT_PLACEHOLDERS, validatePlaceholders } from '@/lib/template-utils';

interface DraftData {
  title: string;
  targetDomain: string;
  redirectUrl: string;
  note: string | null;
}

export default function SeesTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const draftId = params.uuid as string;

  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const [templateHtml, setTemplateHtml] = useState('');
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ドラフトデータとテンプレートHTMLを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // ドラフトデータの取得
        const draftResponse = await fetch(`/api/sees/draft/${draftId}`);
        if (!draftResponse.ok) {
          throw new Error('ドラフトデータの取得に失敗しました');
        }
        const draft = await draftResponse.json();
        setDraftData(draft);

        // テンプレートHTMLの取得
        const templateResponse = await fetch('/templates/default-template.html');
        if (!templateResponse.ok) {
          throw new Error('テンプレートの取得に失敗しました');
        }
        const html = await templateResponse.text();
        setTemplateHtml(html);

        // プレースホルダーのデフォルト値を設定
        const initialValues: Record<string, string> = {};
        DEFAULT_PLACEHOLDERS.forEach((placeholder) => {
          if (placeholder.key === 'REDIRECT_URL') {
            initialValues[placeholder.key] = draft.redirectUrl;
          } else if (placeholder.defaultValue) {
            // デフォルト値がある場合はそれを使用
            initialValues[placeholder.key] = placeholder.defaultValue;
          } else {
            // デフォルト値がない場合はプレースホルダー名を表示
            initialValues[placeholder.key] = `{{${placeholder.key}}}`;
          }
        });
        setPlaceholderValues(initialValues);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [draftId]);

  // プレビューURLを更新
  useEffect(() => {
    if (draftId) {
      const params = new URLSearchParams(placeholderValues);
      setPreviewUrl(`/api/sees/preview/${draftId}?${params.toString()}`);
    }
  }, [draftId, placeholderValues]);

  const handlePlaceholderChange = (key: string, value: string) => {
    // 値が空の場合はプレースホルダー名を設定
    setPlaceholderValues((prev) => ({
      ...prev,
      [key]: value || `{{${key}}}`,
    }));
  };

  const handleConfirm = () => {
    setError(null);
    const validation = validatePlaceholders(placeholderValues);
    if (!validation.valid) {
      setError(validation.errors.join('\n'));
      return;
    }
    setShowConfirmModal(true);
  };

  const handleCreate = async () => {
    if (!draftData) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/sees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draftId,
          title: draftData.title,
          targetDomain: draftData.targetDomain,
          redirectUrl: draftData.redirectUrl,
          note: draftData.note,
          templateVariables: placeholderValues,
          previewUrl: null, // 後で設定する場合
          nsRecords: [], // 後で設定する場合
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '作成に失敗しました');
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setShowConfirmModal(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">読み込み中...</p>
      </div>
    );
  }

  if (error && !draftData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/sees/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            最初から入力する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">SEES新規登録</h1>
          <p className="mt-2 text-sm text-gray-600">
            ステップ 2/2: テンプレート設定
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded whitespace-pre-line">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側: 設定エリア */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              プレースホルダー設定
            </h2>
            <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
              {DEFAULT_PLACEHOLDERS.map((placeholder) => (
                <div key={placeholder.key}>
                  <label className="block text-sm font-medium text-gray-700">
                    {placeholder.label}
                    {placeholder.required && (
                      <span className="text-red-600 ml-1">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={
                      placeholderValues[placeholder.key] === `{{${placeholder.key}}}`
                        ? ''
                        : placeholderValues[placeholder.key] || ''
                    }
                    onChange={(e) =>
                      handlePlaceholderChange(placeholder.key, e.target.value)
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder={(() => {
                      const examples: Record<string, string> = {
                        SERVICE_NAME: '東京都新型コロナウイルスワクチン 大規模接種予約システム',
                        SERVICE_CATEGORY: '大規模接種予約システム',
                        SERVICE_TITLE: '大規模接種会場の運営終了のお知らせ',
                        END_DATE: '令和6年3月31日',
                        LAST_UPDATED_DATE: '令和6年4月12日',
                        REDIRECT_URL: 'https://www.hokeniryo.metro.tokyo.lg.jp/kansen/coronavaccine/index.html',
                        REDIRECT_LINK_TEXT: '東京都保健医療局 新型コロナワクチン',
                        CURRENT_YEAR: '2024',
                      };
                      return examples[placeholder.key] || `{{${placeholder.key}}}`;
                    })()}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    プレースホルダー: {`{{${placeholder.key}}}`}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => router.push('/sees/new')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                戻る
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                確認
              </button>
            </div>
          </div>

          {/* 右側: プレビューエリア */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              プレビュー
            </h2>
            <div className="border border-gray-300 rounded-lg overflow-hidden max-h-[calc(100vh-250px)] overflow-y-auto">
              <iframe
                key={previewUrl}
                src={previewUrl}
                className="w-full h-[800px]"
                title="テンプレートプレビュー"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 確認モーダル */}
      {showConfirmModal && draftData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              登録内容の確認
            </h2>
            
            <div className="space-y-3 mb-6">
              <div className="border-b pb-2">
                <p className="text-sm text-gray-600">タイトル</p>
                <p className="text-lg font-medium">{draftData.title}</p>
              </div>
              <div className="border-b pb-2">
                <p className="text-sm text-gray-600">対象ドメイン</p>
                <p className="text-lg font-medium">{draftData.targetDomain}</p>
              </div>
              <div className="border-b pb-2">
                <p className="text-sm text-gray-600">リダイレクト先URL</p>
                <p className="text-lg font-medium break-all">{draftData.redirectUrl}</p>
              </div>
              {draftData.note && (
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-600">備考</p>
                  <p className="text-base">{draftData.note}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '作成中...' : '作成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
