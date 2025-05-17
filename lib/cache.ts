import { redis } from "./redis"

// Cache TTLs in seconds
const CACHE_TTL = {
  VEHICLES: 3600, // 1 hour
  CUSTOMERS: 3600, // 1 hour
  SERVICE_RECORDS: 300, // 5 minutes
  TASKS: 60, // 1 minute
}

// Cache keys
export const CACHE_KEYS = {
  VEHICLES: "vehicles",
  CUSTOMERS: "customers",
  SERVICE_RECORD: (id: string) => `service_record:${id}`,
  VEHICLE_SERVICE_RECORDS: (id: string) => `vehicle:${id}:service_records`,
  CUSTOMER_VEHICLES: (id: string) => `customer:${id}:vehicles`,
  USER_TASKS: (id: string) => `user:${id}:tasks`,
}

// Cache data with expiration
export async function cacheData(key: string, data: any, ttl = 3600) {
  try {
    await redis.set(key, JSON.stringify(data), { ex: ttl })
    return true
  } catch (error) {
    console.error(`Error caching data for key ${key}:`, error)
    return false
  }
}

// Get cached data
export async function getCachedData(key: string) {
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data as string) : null
  } catch (error) {
    console.error(`Error getting cached data for key ${key}:`, error)
    return null
  }
}

// Invalidate cache
export async function invalidateCache(key: string) {
  try {
    await redis.del(key)
    return true
  } catch (error) {
    console.error(`Error invalidating cache for key ${key}:`, error)
    return false
  }
}

// Invalidate multiple cache keys
export async function invalidateCaches(keys: string[]) {
  try {
    if (keys.length === 0) return true
    await redis.del(...keys)
    return true
  } catch (error) {
    console.error(`Error invalidating multiple cache keys:`, error)
    return false
  }
}
