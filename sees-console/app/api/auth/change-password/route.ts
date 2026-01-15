import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRedisClient } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json();

    // バリデーション
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '現在のパスワードと新しいパスワードは必須です' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '新しいパスワードは6文字以上で入力してください' },
        { status: 400 }
      );
    }

    // セッションからユーザー情報を取得
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

    const session = JSON.parse(sessionData);

    // ユーザーをDBから取得
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 現在のパスワードを検証
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '現在のパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // パスワードを更新
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json(
      { success: true, message: 'パスワードを変更しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('パスワード変更エラー:', error);
    return NextResponse.json(
      { error: 'パスワード変更に失敗しました' },
      { status: 500 }
    );
  }
}
