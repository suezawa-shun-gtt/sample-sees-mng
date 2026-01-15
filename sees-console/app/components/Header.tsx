'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  userId: string;
  name: string;
  email: string;
  role: number;
}

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('ユーザー情報の取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* システム名 */}
          <Link href="/" className="text-xl font-light text-gray-900 hover:text-gray-700">
            SEES管理システム
          </Link>

          {/* 右側：ユーザー情報とメニュー */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="text-sm text-gray-500">読み込み中...</div>
            ) : user ? (
              <>
                {/* ユーザー名 */}
                <div className="text-sm text-gray-700">
                  {user.name}
                </div>

                {/* メニューバー */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="メニュー"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>

                  {/* ドロップダウンメニュー */}
                  {showMenu && (
                    <>
                      {/* 背景クリックで閉じる */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />

                      {/* メニュー本体 */}
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <Link
                          href="/users/new"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowMenu(false)}
                        >
                          新規ユーザー登録
                        </Link>
                        <Link
                          href="/users"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowMenu(false)}
                        >
                          ユーザー一覧
                        </Link>
                        <hr className="my-1 border-gray-200" />
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            handleLogout();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          ログアウト
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
