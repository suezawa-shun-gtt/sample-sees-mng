import { NextResponse } from 'next/server';
import { redisCache } from '@/lib/redis';
import { randomUUID } from 'crypto';

/**
 * SEES新規登録のドラフト保存API
 * 1ページ目の入力内容をRedisに一時保存
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, targetDomain, redirectUrl, note } = body;

    // バリデーション
    if (!title || !targetDomain || !redirectUrl) {
      return NextResponse.json(
        { error: 'タイトル、対象ドメイン、リダイレクト先URLは必須です' },
        { status: 400 }
      );
    }

    // UUIDを生成
    const draftId = randomUUID();

    // Redisに保存（有効期限: 1時間）
    const draftData = {
      title,
      targetDomain,
      redirectUrl,
      note: note || null,
      createdAt: new Date().toISOString(),
    };

    await redisCache.set(`sees:draft:${draftId}`, draftData, 3600);

    return NextResponse.json({
      draftId,
      message: 'ドラフトを保存しました',
    });
  } catch (error) {
    console.error('ドラフト保存エラー:', error);
    return NextResponse.json(
      { error: 'ドラフトの保存に失敗しました' },
      { status: 500 }
    );
  }
}
