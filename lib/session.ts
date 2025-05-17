import { redis } from "./redis"

// Session TTL in seconds (24 hours)
const SESSION_TTL = 86400

// Generate a session key
export function getSessionKey(userId: string, sessionId: string) {
  return `session:${userId}:${sessionId}`
}

// Store session data
export async function storeSessionData(userId: string, sessionId: string, data: any) {
  const key = getSessionKey(userId, sessionId)
  try {
    await redis.set(key, JSON.stringify(data), { ex: SESSION_TTL })
    return true
  } catch (error) {
    console.error(`Error storing session data for ${key}:`, error)
    return false
  }
}

// Get session data
export async function getSessionData(userId: string, sessionId: string) {
  const key = getSessionKey(userId, sessionId)
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data as string) : null
  } catch (error) {
    console.error(`Error getting session data for ${key}:`, error)
    return null
  }
}

// Update session TTL (keep session alive)
export async function refreshSession(userId: string, sessionId: string) {
  const key = getSessionKey(userId, sessionId)
  try {
    await redis.expire(key, SESSION_TTL)
    return true
  } catch (error) {
    console.error(`Error refreshing session for ${key}:`, error)
    return false
  }
}

// Delete session
export async function deleteSession(userId: string, sessionId: string) {
  const key = getSessionKey(userId, sessionId)
  try {
    await redis.del(key)
    return true
  } catch (error) {
    console.error(`Error deleting session for ${key}:`, error)
    return false
  }
}

// Get all active sessions for a user
export async function getUserSessions(userId: string) {
  try {
    const keys = await redis.keys(`session:${userId}:*`)
    if (!keys || keys.length === 0) return []

    const sessions = await Promise.all(
      keys.map(async (key) => {
        const data = await redis.get(key)
        return data ? JSON.parse(data as string) : null
      }),
    )

    return sessions.filter(Boolean)
  } catch (error) {
    console.error(`Error getting sessions for user ${userId}:`, error)
    return []
  }
}

// Delete all sessions for a user
export async function deleteUserSessions(userId: string) {
  try {
    const keys = await redis.keys(`session:${userId}:*`)
    if (!keys || keys.length === 0) return true

    await redis.del(...keys)
    return true
  } catch (error) {
    console.error(`Error deleting sessions for user ${userId}:`, error)
    return false
  }
}
