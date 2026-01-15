import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 権限チェック（管理者のみ）
    const user = await getSession();
    if (!user || user.role !== 2) {
      return NextResponse.json(
        { error: 'この操作を行う権限がありません' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { role } = await request.json();

    // バリデーション
    if (role === undefined || role === null) {
      return NextResponse.json(
        { error: '権限は必須です' },
        { status: 400 }
      );
    }

    if (![0, 1, 2].includes(role)) {
      return NextResponse.json(
        { error: '権限の値が不正です' },
        { status: 400 }
      );
    }

    // ユーザーの存在確認
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 権限を更新
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('ユーザー更新エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー更新に失敗しました' },
      { status: 500 }
    );
  }
}
