import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('seesuid')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      );
    }

    const redis = getRedisClient();
    const sessionData = await redis.get(`session:${sessionId}`);

    if (!sessionData) {
      return NextResponse.json(
        { error: 'セッションが無効です' },
        { status: 401 }
      );
    }

    const user = JSON.parse(sessionData);

    return NextResponse.json({
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('認証確認エラー:', error);
    return NextResponse.json(
      { error: '認証確認に失敗しました' },
      { status: 500 }
    );
  }
}
