import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redisCache } from '@/lib/redis';
import { getSession } from '@/lib/auth';
import { deployAzureResources, registerCustomDomain, isAzureConfigured } from '@/lib/azure';
import { formatSeesId } from '@/lib/format-id';

export async function GET() {
  try {
    const seesList = await prisma.sees.findMany({
      include: {
        nsRecords: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(seesList);
  } catch (error) {
    console.error('SEES一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'SEES一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 権限チェック（編集者以上）
    const user = await getSession();
    if (!user || user.role < 1) {
      return NextResponse.json(
        { error: 'この操作を行う権限がありません' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      draftId,
      title,
      targetDomain,
      redirectUrl,
      note,
      templateVariables,
      previewUrl,
      nsRecords,
    } = body;

    // バリデーション
    if (!title || !targetDomain || !redirectUrl || !templateVariables) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      );
    }

    // Azure設定チェック
    const azureConfigured = isAzureConfigured();

    // まずSEESをデータベースに登録（IDを確定するため）
    let sees = await prisma.sees.create({
      data: {
        title,
        targetDomain,
        redirectUrl,
        note,
        previewUrl,
        templateVariables,
        nsRecords: nsRecords
          ? {
              create: nsRecords.map((ns: string) => ({
                nameServer: ns,
              })),
            }
          : undefined,
      },
      include: {
        nsRecords: true,
      },
    });

    // Azureリソースをデプロイ（設定されている場合）
    if (azureConfigured) {
      try {
        console.log('Azureリソースのデプロイを開始...');
        
        // プロジェクト名はsees-{id}の形式（例: sees-0001）
        const projectName = `sees-${formatSeesId(sees.id)}`;
        
        const azureDeploymentResult = await deployAzureResources(
          targetDomain,
          projectName
        );

        console.log('Azureリソースのデプロイ完了:', azureDeploymentResult);

        // SEESをAzure情報で更新
        sees = await prisma.sees.update({
          where: { id: sees.id },
          data: {
            previewUrl: `https://${azureDeploymentResult.staticAppUrl}`,
            azureStaticAppName: azureDeploymentResult.staticAppName,
            azureDnsZoneName: azureDeploymentResult.dnsZoneName,
            nsRecords: {
              deleteMany: {},
              create: azureDeploymentResult.nameServers.map((ns: string) => ({
                nameServer: ns,
              })),
            },
          },
          include: {
            nsRecords: true,
          },
        });

        // カスタムドメインを登録（バックグラウンドで実行）
        setTimeout(async () => {
          try {
            await registerCustomDomain(
              azureDeploymentResult.staticAppName,
              targetDomain
            );
            console.log('カスタムドメイン登録完了');
          } catch (error) {
            console.error('カスタムドメイン登録エラー（バックグラウンド）:', error);
          }
        }, 30000); // 30秒待機
      } catch (error) {
        console.error('Azureデプロイエラー:', error);
        // Azureデプロイに失敗してもSEESは作成済みなので、エラーログだけ残す
        // 必要に応じて、後で手動デプロイできるようにする
      }
    }

    // ドラフトをRedisから削除
    if (draftId) {
      await redisCache.del(`sees:draft:${draftId}`);
    }

    return NextResponse.json(sees, { status: 201 });
  } catch (error) {
    console.error('SEES作成エラー:', error);
    
    // ユニーク制約違反のエラーハンドリング
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'この対象ドメインは既に登録されています' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'SEESの作成に失敗しました' },
      { status: 500 }
    );
  }
}
