import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // バリデーション
    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスは必須です' },
        { status: 400 }
      );
    }

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // セキュリティのため、ユーザーが存在しない場合でも同じレスポンスを返す
    // （メールアドレスの存在を推測されないようにする）
    if (!user) {
      // ダミーのトークンを返す（実際には使えない）
      const dummyToken = randomUUID();
      return NextResponse.json(
        { 
          success: true,
          token: dummyToken,
          message: 'リセット用のトークンを発行しました'
        },
        { status: 200 }
      );
    }

    // リセットトークンを生成
    const resetToken = randomUUID();

    // Redisにトークンとユーザー情報を保存（30分有効）
    const redis = getRedisClient();
    await redis.set(
      `reset:${resetToken}`,
      JSON.stringify({
        userId: user.id,
        email: user.email,
      }),
      'EX',
      60 * 30 // 30分
    );

    // 本来はここでメール送信を行う
    // 今回は開発環境なのでトークンを直接返す
    return NextResponse.json(
      { 
        success: true,
        token: resetToken,
        message: 'リセット用のトークンを発行しました'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('パスワードリセット申請エラー:', error);
    return NextResponse.json(
      { error: 'パスワードリセット申請に失敗しました' },
      { status: 500 }
    );
  }
}
