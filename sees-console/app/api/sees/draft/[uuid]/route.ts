import { NextResponse } from 'next/server';
import { redisCache } from '@/lib/redis';

/**
 * SEES新規登録のドラフト取得API
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    const draftData = await redisCache.get(`sees:draft:${uuid}`);

    if (!draftData) {
      return NextResponse.json(
        { error: 'ドラフトが見つかりません。有効期限が切れている可能性があります。' },
        { status: 404 }
      );
    }

    return NextResponse.json(draftData);
  } catch (error) {
    console.error('ドラフト取得エラー:', error);
    return NextResponse.json(
      { error: 'ドラフトの取得に失敗しました' },
      { status: 500 }
    );
  }
}
