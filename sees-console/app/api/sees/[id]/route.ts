import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: '無効なIDです' },
        { status: 400 }
      );
    }

    const sees = await prisma.sees.findUnique({
      where: { id },
      include: {
        nsRecords: true,
      },
    });

    if (!sees) {
      return NextResponse.json(
        { error: '指定されたSEESが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(sees, { status: 200 });
  } catch (error) {
    console.error('SEES取得エラー:', error);
    return NextResponse.json(
      { error: 'SEESの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { redirectUrl, note, templateVariables, previewUrl, nsRecords } = body;

    if (!id) {
      return NextResponse.json(
        { error: '無効なIDです' },
        { status: 400 }
      );
    }

    // バリデーション
    if (!redirectUrl || !templateVariables) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      );
    }

    // SEESが存在するか確認
    const existingSees = await prisma.sees.findUnique({
      where: { id },
    });

    if (!existingSees) {
      return NextResponse.json(
        { error: '指定されたSEESが見つかりません' },
        { status: 404 }
      );
    }

    // SEESを更新
    const updatedSees = await prisma.sees.update({
      where: { id },
      data: {
        redirectUrl,
        note,
        previewUrl,
        templateVariables,
      },
      include: {
        nsRecords: true,
      },
    });

    return NextResponse.json(updatedSees, { status: 200 });
  } catch (error) {
    console.error('SEES更新エラー:', error);
    return NextResponse.json(
      { error: 'SEESの更新に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: '無効なIDです' },
        { status: 400 }
      );
    }

    // SEESが存在するか確認
    const sees = await prisma.sees.findUnique({
      where: { id },
    });

    if (!sees) {
      return NextResponse.json(
        { error: '指定されたSEESが見つかりません' },
        { status: 404 }
      );
    }

    // SEESを削除（NSレコードはカスケード削除される）
    await prisma.sees.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'SEESを削除しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('SEES削除エラー:', error);
    return NextResponse.json(
      { error: 'SEESの削除に失敗しました' },
      { status: 500 }
    );
  }
}
