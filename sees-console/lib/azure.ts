import { ClientSecretCredential } from '@azure/identity';
import { DnsManagementClient } from '@azure/arm-dns';
import { WebSiteManagementClient } from '@azure/arm-appservice';

// Azure認証情報
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || '';
const tenantId = process.env.AZURE_TENANT_ID || '';
const clientId = process.env.AZURE_CLIENT_ID || '';
const clientSecret = process.env.AZURE_CLIENT_SECRET || '';
const resourceGroup = process.env.AZURE_RESOURCE_GROUP || '';
const location = process.env.AZURE_LOCATION || 'japaneast';
const environment = process.env.AZURE_ENVIRONMENT || 'dev'; // 'dev' or 'prd'

// 認証クライアント
const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

// Azure クライアント
let dnsClient: DnsManagementClient;
let webClient: WebSiteManagementClient;

// クライアントの遅延初期化
function getDnsClient() {
  if (!dnsClient) {
    dnsClient = new DnsManagementClient(credential, subscriptionId);
  }
  return dnsClient;
}

function getWebClient() {
  if (!webClient) {
    webClient = new WebSiteManagementClient(credential, subscriptionId);
  }
  return webClient;
}

/**
 * ランダムなサフィックスを生成（5文字の英数字）
 */
function generateRandomSuffix(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Static Web App名を生成
 */
function generateStaticAppName(projectName: string, environment: string = 'prod'): string {
  const randomSuffix = generateRandomSuffix();
  return `stapp-${projectName}-${environment}-je-001-${randomSuffix}`;
}

/**
 * DNSゾーンとStatic Web Appを個別に作成
 * environmentとskuNameはグローバル環境変数から自動設定される
 */
export async function deployAzureResources(
  dnsZoneName: string,
  projectName: string
): Promise<{
  dnsZoneName: string;
  staticAppName: string;
  staticAppUrl: string;
  nameServers: string[];
}> {
  try {
    console.log(`Azureリソースのデプロイを開始: ${dnsZoneName}`);

    // 環境に応じたSKUを設定
    const env = environment === 'prd' ? 'prd' : 'dev';
    const skuName = env === 'prd' ? 'Standard' : 'Free';
    
    const randomSuffix = generateRandomSuffix();
    const staticAppName = `stapp-${projectName}-${env}-je-001-${randomSuffix}`;
    
    console.log(`環境: ${env}, SKU: ${skuName}`);

    // 1. DNSゾーンを作成
    console.log('DNSゾーンを作成中...');
    const dnsZone = await getDnsClient().zones.createOrUpdate(
      resourceGroup,
      dnsZoneName,
      {
        location: 'global',
        zoneType: 'Public',
      }
    );
    console.log('DNSゾーン作成完了');

    // 2. Static Web Appを作成
    console.log('Static Web Appを作成中...');
    const staticSite = await getWebClient().staticSites.beginCreateOrUpdateStaticSiteAndWait(
      resourceGroup,
      staticAppName,
      {
        location: location,
        sku: {
          name: skuName,
          tier: skuName,
        },
        provider: 'None',
        stagingEnvironmentPolicy: 'Enabled',
        allowConfigFileUpdates: true,
        enterpriseGradeCdnStatus: 'Disabled',
      }
    );
    console.log('Static Web App作成完了');

    const staticAppUrl = staticSite.defaultHostname || '';
    const nameServers = dnsZone.nameServers || [];

    console.log('Azureリソースのデプロイ完了');

    return {
      dnsZoneName,
      staticAppName,
      staticAppUrl,
      nameServers,
    };
  } catch (error) {
    console.error('Azureリソースのデプロイエラー:', error);
    throw new Error(`Azureリソースのデプロイに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * カスタムドメインをStatic Web Appに登録
 * リソース作成後、少し待ってから実行する必要がある
 */
export async function registerCustomDomain(
  staticAppName: string,
  customDomain: string
): Promise<void> {
  try {
    console.log(`カスタムドメインを登録中: ${customDomain} -> ${staticAppName}`);

    const result = await getWebClient().staticSites.beginCreateOrUpdateStaticSiteCustomDomain(
      resourceGroup,
      staticAppName,
      customDomain,
      {}
    );
    await result.pollUntilDone();

    console.log('カスタムドメイン登録完了');
  } catch (error) {
    console.error('カスタムドメイン登録エラー:', error);
    throw new Error(`カスタムドメインの登録に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Static Web AppにHTMLコンテンツをアップロード
 */
export async function uploadStaticContent(
  staticAppName: string,
  htmlContent: string
): Promise<void> {
  try {
    console.log(`Static Web Appにコンテンツをアップロード: ${staticAppName}`);

    // デプロイトークンを取得
    const secrets = await getWebClient().staticSites.listStaticSiteSecrets(
      resourceGroup,
      staticAppName
    );

    const deploymentToken = secrets.properties?.apiKey;

    if (!deploymentToken) {
      throw new Error('デプロイトークンの取得に失敗しました');
    }

    // 実際のアップロードは別途実装が必要
    // Azure Static Web Appsは通常、GitHubアクションやAzure CLIでデプロイされる
    // ここでは、REST APIを使用したアップロードを実装する必要がある
    // または、Azure Storage経由でアップロードする方法も検討可能

    console.log('コンテンツアップロード完了（実装予定）');
  } catch (error) {
    console.error('コンテンツアップロードエラー:', error);
    throw new Error(`コンテンツのアップロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * DNSゾーンとStatic Web Appを削除
 */
export async function deleteAzureResources(
  dnsZoneName: string,
  staticAppName: string
): Promise<void> {
  try {
    console.log(`Azureリソースを削除中: ${dnsZoneName}, ${staticAppName}`);

    // Static Web Appを削除
    await getWebClient().staticSites.beginDeleteStaticSiteAndWait(resourceGroup, staticAppName);
    console.log('Static Web App削除完了');

    // DNSゾーンを削除
    await getDnsClient().zones.beginDeleteAndWait(resourceGroup, dnsZoneName);
    console.log('DNSゾーン削除完了');

    console.log('Azureリソースの削除完了');
  } catch (error) {
    console.error('Azureリソースの削除エラー:', error);
    throw new Error(`Azureリソースの削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Azure設定が有効かチェック
 */
export function isAzureConfigured(): boolean {
  return !!(
    subscriptionId &&
    tenantId &&
    clientId &&
    clientSecret &&
    resourceGroup
  );
}
