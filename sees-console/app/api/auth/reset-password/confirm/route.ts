import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    // バリデーション
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'トークンと新しいパスワードは必須です' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '新しいパスワードは6文字以上で入力してください' },
        { status: 400 }
      );
    }

    // Redisからトークン情報を取得
    const redis = getRedisClient();
    const tokenData = await redis.get(`reset:${token}`);

    if (!tokenData) {
      return NextResponse.json(
        { error: 'トークンが無効または期限切れです' },
        { status: 400 }
      );
    }

    const resetInfo = JSON.parse(tokenData);

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { id: resetInfo.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // パスワードを更新
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 使用済みトークンを削除
    await redis.del(`reset:${token}`);

    return NextResponse.json(
      { success: true, message: 'パスワードをリセットしました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('パスワードリセット確認エラー:', error);
    return NextResponse.json(
      { error: 'パスワードリセットに失敗しました' },
      { status: 500 }
    );
  }
}
