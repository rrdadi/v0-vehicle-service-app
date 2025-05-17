import { Redis } from "@upstash/redis"

// Create a Redis client using environment variables
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Notification channels
export const NOTIFICATION_CHANNELS = {
  TASK_COMPLETED: "task-completed",
  TASK_ASSIGNED: "task-assigned",
  SERVICE_COMPLETED: "service-completed",
  DAILY_REMINDER: "daily-reminder",
}

// Helper function to publish a notification
export async function publishNotification(channel: string, message: any) {
  try {
    await redis.publish(channel, JSON.stringify(message))
    return true
  } catch (error) {
    console.error("Error publishing notification:", error)
    return false
  }
}
