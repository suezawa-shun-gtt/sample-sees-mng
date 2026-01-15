import Redis from 'ioredis';

// Redis接続の設定
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Redisクライアントのシングルトンインスタンス
let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        return targetErrors.some((targetError) => err.message.includes(targetError));
      },
    });

    redis.on('error', (err) => {
      console.error('Redis接続エラー:', err);
    });

    redis.on('connect', () => {
      console.log('Redis接続成功');
    });

    redis.on('ready', () => {
      console.log('Redis準備完了');
    });

    redis.on('close', () => {
      console.log('Redis接続クローズ');
    });

    redis.on('reconnecting', () => {
      console.log('Redis再接続中...');
    });
  }

  return redis;
}

// キャッシュヘルパー関数
export const redisCache = {
  /**
   * キャッシュから値を取得
   */
  async get<T = any>(key: string): Promise<T | null> {
    const client = getRedisClient();
    const value = await client.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  /**
   * キャッシュに値を設定
   * @param key キャッシュキー
   * @param value 保存する値
   * @param ttl 有効期限（秒）
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const client = getRedisClient();
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttl) {
      await client.setex(key, ttl, serialized);
    } else {
      await client.set(key, serialized);
    }
  },

  /**
   * キャッシュから値を削除
   */
  async del(key: string): Promise<void> {
    const client = getRedisClient();
    await client.del(key);
  },

  /**
   * パターンにマッチする全てのキーを削除
   */
  async delPattern(pattern: string): Promise<void> {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  },

  /**
   * キーの有効期限を設定
   */
  async expire(key: string, ttl: number): Promise<void> {
    const client = getRedisClient();
    await client.expire(key, ttl);
  },

  /**
   * キーが存在するか確認
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  },
};

// アプリケーション終了時のクリーンアップ
if (typeof window === 'undefined') {
  process.on('SIGINT', async () => {
    if (redis) {
      await redis.quit();
      console.log('Redis接続を正常にクローズしました');
    }
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    if (redis) {
      await redis.quit();
      console.log('Redis接続を正常にクローズしました');
    }
    process.exit(0);
  });
}

export default getRedisClient;
