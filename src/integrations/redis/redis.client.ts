import Redis from 'ioredis'
import { config } from '../../config/index.js'

let redisInstance: Redis | null = null

export function getRedisClient(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(config.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    })

    redisInstance.on('error', (err) => {
      console.error('Redis error:', err)
    })
  }
  return redisInstance
}

export class CacheService {
  private redis: Redis

  constructor() {
    this.redis = getRedisClient()
  }

  async get<T>(key: string): Promise<T | null> {
    const val = await this.redis.get(key)
    if (!val) return null
    try {
      return JSON.parse(val) as T
    } catch {
      return val as unknown as T
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number) {
    const serialized = JSON.stringify(value)
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, serialized)
    } else {
      await this.redis.set(key, serialized)
    }
  }

  async del(key: string) {
    await this.redis.del(key)
  }

  async exists(key: string) {
    return (await this.redis.exists(key)) === 1
  }
}
