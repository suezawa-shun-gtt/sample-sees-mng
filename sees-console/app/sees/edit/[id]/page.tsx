'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DEFAULT_PLACEHOLDERS, validatePlaceholders } from '@/lib/template-utils';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface Sees {
  id: string;
  title: string;
  note: string | null;
  targetDomain: string;
  redirectUrl: string;
  previewUrl: string | null;
  templateVariables: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export default function SeesEditPage() {
  useRequireAuth(); // 認証チェック
  const router = useRouter();
  const params = useParams();
  const seesId = params.id as string;

  const [sees, setSees] = useState<Sees | null>(null);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [note, setNote] = useState('');
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // SEESデータを取得
  useEffect(() => {
    const fetchSees = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sees/${seesId}`);
        if (!response.ok) {
          throw new Error('SEESの取得に失敗しました');
        }
        const data = await response.json();
        setSees(data);
        setRedirectUrl(data.redirectUrl);
        setNote(data.note || '');
        setPlaceholderValues(data.templateVariables);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchSees();
  }, [seesId]);

  // プレビューURLを更新
  useEffect(() => {
    if (seesId && Object.keys(placeholderValues).length > 0) {
      const params = new URLSearchParams(placeholderValues);
      setPreviewUrl(`/api/sees/preview/${seesId}?${params.toString()}`);
    }
  }, [seesId, placeholderValues]);

  // リダイレクト先URLをプレースホルダーに反映
  useEffect(() => {
    if (redirectUrl) {
      setPlaceholderValues((prev) => ({
        ...prev,
        REDIRECT_URL: redirectUrl,
      }));
    }
  }, [redirectUrl]);

  const handlePlaceholderChange = (key: string, value: string) => {
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

  const handleUpdate = async () => {
    if (!sees) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/sees/${seesId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirectUrl,
          note: note || null,
          templateVariables: placeholderValues,
          previewUrl: null,
          nsRecords: [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '更新に失敗しました');
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

  if (error && !sees) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  if (!sees) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">SEES編集</h1>
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
              基本情報
            </h2>

            {/* タイトル（編集不可） */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タイトル
              </label>
              <input
                type="text"
                value={sees.title}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* 対象ドメイン（編集不可） */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                対象ドメイン
              </label>
              <input
                type="text"
                value={sees.targetDomain}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* リダイレクト先URL */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                リダイレクト先URL
                <span className="text-red-600 ml-1">*</span>
              </label>
              <input
                type="url"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com"
              />
            </div>

            {/* 備考 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                備考
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="備考を入力してください"
              />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4 mt-6">
              お知らせページ編集
            </h2>
            <div className="space-y-4 max-h-[calc(100vh-600px)] overflow-y-auto pr-2">
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
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
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
      {showConfirmModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              更新内容の確認
            </h2>
            
            <div className="space-y-3 mb-6">
              <div className="border-b pb-2">
                <p className="text-sm text-gray-600">タイトル</p>
                <p className="text-lg font-medium">{sees.title}</p>
              </div>
              <div className="border-b pb-2">
                <p className="text-sm text-gray-600">対象ドメイン</p>
                <p className="text-lg font-medium">{sees.targetDomain}</p>
              </div>
              <div className="border-b pb-2">
                <p className="text-sm text-gray-600">リダイレクト先URL</p>
                <p className="text-lg font-medium break-all">{redirectUrl}</p>
              </div>
              {note && (
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-600">備考</p>
                  <p className="text-base">{note}</p>
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
                onClick={handleUpdate}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '更新中...' : '更新'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
