import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getRedisClient } from './redis';

export interface SessionUser {
  userId: string;
  name: string;
  email: string;
  role: number;
}

/**
 * サーバーコンポーネントで使用するセッション検証関数
 * 認証されていない場合は/loginにリダイレクトする
 */
export async function requireAuth(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('seesuid')?.value;

  if (!sessionId) {
    redirect('/login');
  }

  try {
    const redis = getRedisClient();
    const sessionData = await redis.get(`session:${sessionId}`);

    if (!sessionData) {
      // セッションが無効な場合はログインページへ
      redirect('/login');
    }

    return JSON.parse(sessionData) as SessionUser;
  } catch (error) {
    console.error('セッション検証エラー:', error);
    redirect('/login');
  }
}

/**
 * セッション情報を取得する（リダイレクトしない）
 * 認証されていない場合はnullを返す
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('seesuid')?.value;

  if (!sessionId) {
    return null;
  }

  try {
    const redis = getRedisClient();
    const sessionData = await redis.get(`session:${sessionId}`);

    if (!sessionData) {
      return null;
    }

    return JSON.parse(sessionData) as SessionUser;
  } catch (error) {
    console.error('セッション取得エラー:', error);
    return null;
  }
}

/**
 * 管理者権限が必要なページ用のチェック関数
 * 管理者以外は /unauthorized にリダイレクト
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  
  if (user.role !== 2) {
    redirect('/unauthorized');
  }
  
  return user;
}

/**
 * 編集者以上の権限が必要なページ用のチェック関数
 * 閲覧者は /unauthorized にリダイレクト
 */
export async function requireEditor(): Promise<SessionUser> {
  const user = await requireAuth();
  
  if (user.role < 1) {
    redirect('/unauthorized');
  }
  
  return user;
}
