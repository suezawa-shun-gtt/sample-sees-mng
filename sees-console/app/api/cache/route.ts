import { NextResponse } from 'next/server';
import { redisCache } from '@/lib/redis';

/**
 * Redisキャッシュのテスト用エンドポイント
 * 
 * GET: キャッシュの取得テスト
 * POST: キャッシュの設定テスト
 * DELETE: キャッシュの削除テスト
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'test:key';

    const value = await redisCache.get(key);

    if (!value) {
      return NextResponse.json(
        { message: 'キャッシュが見つかりません', key },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'キャッシュ取得成功',
      key,
      value,
    });
  } catch (error) {
    console.error('Redisエラー:', error);
    return NextResponse.json(
      { error: 'キャッシュの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key = 'test:key', value = 'test value', ttl } = body;

    await redisCache.set(key, value, ttl);

    return NextResponse.json({
      message: 'キャッシュ設定成功',
      key,
      value,
      ttl: ttl || 'なし',
    });
  } catch (error) {
    console.error('Redisエラー:', error);
    return NextResponse.json(
      { error: 'キャッシュの設定に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'test:key';

    await redisCache.del(key);

    return NextResponse.json({
      message: 'キャッシュ削除成功',
      key,
    });
  } catch (error) {
    console.error('Redisエラー:', error);
    return NextResponse.json(
      { error: 'キャッシュの削除に失敗しました' },
      { status: 500 }
    );
  }
}
