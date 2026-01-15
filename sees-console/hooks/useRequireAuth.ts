'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useRequireAuth() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          // 認証されていない場合はログイン画面へ
          router.push('/login');
        }
      } catch (error) {
        console.error('認証確認エラー:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);
}
