"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Bell, CheckCircle } from "lucide-react"

interface NotificationListProps {
  notifications: any[]
}

export function NotificationList({ notifications }: NotificationListProps) {
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()
  const supabase = createClient()

  const handleMarkAsRead = async (id: string) => {
    setIsLoading(true)

    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

      if (error) throw error

      toast({
        title: "Notification marked as read",
      })

      // Refresh the page
      window.location.reload()
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("is_read", false)

      if (error) throw error

      toast({
        title: "All notifications marked as read",
      })

      // Refresh the page
      window.location.reload()
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Bell className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">No notifications</p>
        <p className="text-muted-foreground">You don't have any notifications at the moment</p>
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={isLoading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start justify-between rounded-lg border p-4 ${
              !notification.is_read ? "bg-muted" : ""
            }`}
          >
            <div>
              <h3 className="font-medium">{notification.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p>
            </div>

            {!notification.is_read && (
              <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)} disabled={isLoading}>
                <CheckCircle className="h-4 w-4" />
                <span className="sr-only">Mark as read</span>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
