"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface NotificationListenerProps {
  userId: string
}

export function NotificationListener({ userId }: NotificationListenerProps) {
  const { toast } = useToast()
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // In a real implementation, you would connect to a WebSocket server
    // For this example, we'll simulate real-time notifications with polling

    const checkForNewNotifications = async () => {
      try {
        // Get the latest notification
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(1)

        if (data && data.length > 0) {
          const notification = data[0]

          // Show a toast notification
          toast({
            title: notification.title,
            description: notification.message,
          })
        }
      } catch (error) {
        console.error("Error checking for notifications:", error)
      }
    }

    // Check for notifications immediately
    checkForNewNotifications()

    // Set up polling interval (every 30 seconds)
    const interval = setInterval(checkForNewNotifications, 30000)

    // Clean up on unmount
    return () => {
      clearInterval(interval)
    }
  }, [userId, toast, supabase])

  return null // This component doesn't render anything
}
