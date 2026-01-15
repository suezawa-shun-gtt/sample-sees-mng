import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // バリデーション
    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      );
    }

    // ユーザーをDBから取得
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // パスワード検証
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // セッションUUIDを生成
    const sessionId = randomUUID();

    // Redisにユーザー情報を保存（24時間有効）
    const redis = getRedisClient();
    const sessionData = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify(sessionData),
      'EX',
      60 * 60 * 24 // 24時間
    );

    // レスポンスを作成してCookieを設定
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Cookieにセッションキーを設定（HttpOnly、Secure、SameSite）
    response.cookies.set('seesuid', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24時間
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('ログインエラー:', error);
    return NextResponse.json(
      { error: 'ログイン処理に失敗しました' },
      { status: 500 }
    );
  }
}
