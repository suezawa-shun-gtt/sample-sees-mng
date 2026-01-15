'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ログインに失敗しました');
      }

      // ログイン成功後、SEES一覧画面へ遷移
      router.push('/');
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
          <h1 className="text-3xl font-light text-gray-900 mb-2">SEES管理システム</h1>
          <p className="text-gray-600">ログイン</p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

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

              {/* パスワード */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="パスワードを入力"
                  disabled={loading}
                />
              </div>

              {/* ログインボタン */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>
          </form>

          {/* リンク */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-3 text-sm text-center">
              <div>
                <Link
                  href="/signup"
                  className="text-gray-700 hover:text-gray-900 underline"
                >
                  新規ユーザー登録
                </Link>
              </div>
              <div>
                <Link
                  href="/reset-password"
                  className="text-gray-700 hover:text-gray-900 underline"
                >
                  パスワードを忘れた方
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
