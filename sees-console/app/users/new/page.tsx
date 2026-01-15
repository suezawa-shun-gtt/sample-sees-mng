'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function UserNewPage() {
  useRequireAuth(); // 認証チェック
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!name || !email || !password) {
      setError('すべての項目を入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ユーザー登録に失敗しました');
      }

      // 登録成功後、ユーザー一覧画面へ遷移
      router.push('/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/users"
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
          >
            ← ユーザー一覧に戻る
          </Link>
          <h1 className="text-3xl font-light text-gray-900">新規ユーザー登録</h1>
        </div>

        {/* フォーム */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* ユーザー名 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  ユーザー名 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="山田 太郎"
                  disabled={loading}
                />
              </div>

              {/* メールアドレス */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-600">*</span>
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
                  パスワード <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="6文字以上"
                  disabled={loading}
                />
              </div>

              {/* パスワード（確認） */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード（確認） <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="パスワードを再入力"
                  disabled={loading}
                />
              </div>

              {/* 権限 */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  権限
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  disabled={loading}
                >
                  <option value={0}>閲覧者</option>
                  <option value={1}>編集者</option>
                  <option value={2}>管理者</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  閲覧者：閲覧のみ / 編集者：編集可能 / 管理者：全権限
                </p>
              </div>

              {/* ボタン */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/users')}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? '登録中...' : '登録'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
