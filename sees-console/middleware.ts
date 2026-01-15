import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 認証不要なパス
const publicPaths = ['/login', '/signup', '/reset-password', '/unauthorized'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 認証不要なパスの場合はスルー
  if (publicPaths.includes(pathname) || pathname.startsWith('/reset-password/')) {
    return NextResponse.next();
  }

  // 認証不要なAPIパスの場合はスルー
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Cookieからセッションキーを取得
  const sessionId = request.cookies.get('seesuid')?.value;

  if (!sessionId) {
    // セッションキーがない場合はログイン画面にリダイレクト
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Cookieは存在するので次へ（詳細な検証は各ページで実施）
  return NextResponse.next();
}

// middlewareを適用するパスを指定
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
