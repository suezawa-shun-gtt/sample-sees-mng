import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRedisClient } from '@/lib/redis';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('seesuid')?.value;

    if (sessionId) {
      // Redisからセッションを削除
      const redis = getRedisClient();
      await redis.del(`session:${sessionId}`);
    }

    // レスポンスを作成してCookieを削除
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    response.cookies.delete('seesuid');

    return response;
  } catch (error) {
    console.error('ログアウトエラー:', error);
    return NextResponse.json(
      { error: 'ログアウト処理に失敗しました' },
      { status: 500 }
    );
  }
}
