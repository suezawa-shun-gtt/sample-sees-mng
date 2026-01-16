import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { deleteAzureResources, isAzureConfigured } from '@/lib/azure';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;

    if (!idString) {
      return NextResponse.json(
        { error: '無効なIDです' },
        { status: 400 }
      );
    }

    const id = parseInt(idString, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '無効なID形式です' },
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
    // 権限チェック（編集者以上）
    const user = await getSession();
    if (!user || user.role < 1) {
      return NextResponse.json(
        { error: 'この操作を行う権限がありません' },
        { status: 403 }
      );
    }

    const { id: idString } = await params;
    const body = await request.json();
    const { redirectUrl, note, templateVariables, previewUrl, nsRecords } = body;

    if (!idString) {
      return NextResponse.json(
        { error: '無効なIDです' },
        { status: 400 }
      );
    }

    const id = parseInt(idString, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '無効なID形式です' },
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
    // 権限チェック（編集者以上）
    const user = await getSession();
    if (!user || user.role < 1) {
      return NextResponse.json(
        { error: 'この操作を行う権限がありません' },
        { status: 403 }
      );
    }

    const { id: idString } = await params;

    if (!idString) {
      return NextResponse.json(
        { error: '無効なIDです' },
        { status: 400 }
      );
    }

    const id = parseInt(idString, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '無効なID形式です' },
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

    // Azureリソースを削除（設定されている場合）
    if (isAzureConfigured() && sees.azureStaticAppName && sees.azureDnsZoneName) {
      try {
        console.log('Azureリソースを削除中...');
        await deleteAzureResources(sees.azureDnsZoneName, sees.azureStaticAppName);
        console.log('Azureリソース削除完了');
      } catch (error) {
        console.error('Azureリソース削除エラー:', error);
        // エラーが発生してもデータベースからは削除する
      }
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
