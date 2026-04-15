import { Redis } from '@upstash/redis'

// إنشاء قناة اتصال مؤمنة وسريعة جداً (Edge-compatible) مع سيرفرات Upstash
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})