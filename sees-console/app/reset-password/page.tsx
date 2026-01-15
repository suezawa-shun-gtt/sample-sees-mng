'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetToken(null);

    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'パスワードリセットの申請に失敗しました');
      }

      const data = await response.json();
      setResetToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">パスワードリセット</h1>
          <p className="text-gray-600">登録されているメールアドレスを入力してください</p>
        </div>

        {/* フォーム */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {resetToken ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <p className="font-medium mb-2">リセットトークンを発行しました</p>
                <p className="text-sm mb-4">
                  以下のリンクをクリックして新しいパスワードを設定してください。<br />
                  （トークンは30分間有効です）
                </p>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">リセットURL:</p>
                <Link
                  href={`/reset-password/${resetToken}`}
                  className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {typeof window !== 'undefined' && `${window.location.origin}/reset-password/${resetToken}`}
                </Link>
              </div>

              <div className="flex justify-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  ログイン画面に戻る
                </Link>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* メールアドレス */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="example@govtechtokyo.or.jp"
                      disabled={loading}
                    />
                  </div>

                  {/* ボタン */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? '送信中...' : 'リセットトークンを発行'}
                  </button>
                </div>
              </form>

              {/* リンク */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  ログイン画面に戻る
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
