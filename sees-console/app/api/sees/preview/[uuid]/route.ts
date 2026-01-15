import { NextResponse } from 'next/server';
import { redisCache } from '@/lib/redis';
import { applyPlaceholders } from '@/lib/template-utils';
import fs from 'fs/promises';
import path from 'path';

/**
 * SEES新規登録のプレビュー用API
 * テンプレートHTMLにプレースホルダーを適用してレンダリング
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const { searchParams } = new URL(request.url);

    // クエリパラメータからプレースホルダー値を取得
    const placeholderValues: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      placeholderValues[key] = value;
    });

    // テンプレートHTMLを読み込み
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'default-template.html');
    let templateHtml = await fs.readFile(templatePath, 'utf-8');

    // 相対パスを絶対パスに変換（開発環境用）
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    templateHtml = templateHtml
      .replace(/href="css\//g, `href="${baseUrl}/templates/css/`)
      .replace(/src="images\//g, `src="${baseUrl}/templates/images/`)
      .replace(/href="images\//g, `href="${baseUrl}/templates/images/`);

    // プレビュー用：リダイレクトスクリプトを削除
    templateHtml = templateHtml.replace(/<script>[\s\S]*?setTimeout[\s\S]*?<\/script>/g, '');

    // プレースホルダーを適用
    const renderedHtml = applyPlaceholders(templateHtml, placeholderValues);

    return new NextResponse(renderedHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('プレビュー生成エラー:', error);
    return new NextResponse(
      '<html><body><h1>プレビューの生成に失敗しました</h1></body></html>',
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    );
  }
}
