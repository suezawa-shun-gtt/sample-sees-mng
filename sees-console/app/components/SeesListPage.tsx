'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Header } from './Header';

interface NsRecord {
  id: string;
  seesId: string;
  nameServer: string;
  createdAt: string;
}

interface Sees {
  id: string;
  title: string;
  note: string | null;
  targetDomain: string;
  redirectUrl: string;
  previewUrl: string | null;
  templateVariables: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  nsRecords: NsRecord[];
}

export function SeesListPage() {
  useRequireAuth(); // 認証チェック
  const router = useRouter();
  const [seesList, setSeesList] = useState<Sees[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSees, setSelectedSees] = useState<Sees | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [userRole, setUserRole] = useState<number>(0);

  useEffect(() => {
    fetchUserRole();
    fetchSeesList();
  }, []);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.user.role);
      }
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
    }
  };

  const fetchSeesList = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sees');
      if (!response.ok) {
        throw new Error('SEES一覧の取得に失敗しました');
      }
      const data = await response.json();
      setSeesList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (sees: Sees) => {
    setSelectedSees(sees);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedSees) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/sees/${selectedSees.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '削除に失敗しました');
      }

      // 削除成功後、リストを再取得
      await fetchSeesList();
      setShowDeleteModal(false);
      setSelectedSees(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-light text-gray-900">
              SEES一覧
            </h1>
            {userRole >= 1 && (
              <button
                onClick={() => router.push('/sees/new')}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                + 新規作成
              </button>
            )}
          </div>

        {seesList.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">登録されているSEES情報はありません</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    対象ドメイン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    備考
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    リダイレクト先URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    プレビューURL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NSレコード
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {seesList.map((sees) => (
                  <tr key={sees.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sees.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {sees.targetDomain}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {sees.note ? (
                        <div className="text-sm text-gray-600 max-w-xs truncate" title={sees.note}>
                          {sees.note}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-blue-600 hover:underline">
                        <a href={sees.redirectUrl} target="_blank" rel="noopener noreferrer">
                          {sees.redirectUrl}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sees.previewUrl ? (
                        <div className="text-sm text-blue-600 hover:underline">
                          <a href={sees.previewUrl} target="_blank" rel="noopener noreferrer">
                            確認
                          </a>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">未設定</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sees.nsRecords.length > 0 ? (
                        <div className="text-sm text-gray-900">
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:underline">
                              {sees.nsRecords.length}件
                            </summary>
                            <ul className="mt-2 space-y-1 text-xs">
                              {sees.nsRecords.map((ns) => (
                                <li key={ns.id} className="text-gray-600">
                                  {ns.nameServer}
                                </li>
                              ))}
                            </ul>
                          </details>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">未設定</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(sees.createdAt).toLocaleDateString('ja-JP')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {userRole >= 1 ? (
                        <>
                          <button
                            onClick={() => router.push(`/sees/edit/${sees.id}`)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDeleteClick(sees)}
                            className="text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 削除確認モーダル */}
      {showDeleteModal && selectedSees && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              削除の確認
            </h2>
            
            <p className="text-gray-700 mb-6">
              以下のSEES情報を削除してもよろしいですか？この操作は取り消せません。
            </p>
            
            <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-md">
              <div className="border-b pb-2">
                <p className="text-sm text-gray-600">タイトル</p>
                <p className="text-lg font-medium">{selectedSees.title}</p>
              </div>
              <div className="border-b pb-2">
                <p className="text-sm text-gray-600">対象ドメイン</p>
                <p className="text-lg font-medium">{selectedSees.targetDomain}</p>
              </div>
              <div className="border-b pb-2">
                <p className="text-sm text-gray-600">リダイレクト先URL</p>
                <p className="text-lg font-medium break-all">{selectedSees.redirectUrl}</p>
              </div>
              {selectedSees.note && (
                <div className="pb-2">
                  <p className="text-sm text-gray-600">備考</p>
                  <p className="text-base">{selectedSees.note}</p>
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
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedSees(null);
                  setError(null);
                }}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? '削除中...' : '削除'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
