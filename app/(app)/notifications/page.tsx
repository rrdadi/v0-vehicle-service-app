import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/utils/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NotificationList } from "@/components/notifications/notification-list"

export default async function NotificationsPage() {
  const supabase = createServerClient()
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return null
  }

  // Fetch notifications for current user
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
          <CardDescription>Stay updated with important information</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationList notifications={notifications || []} />
        </CardContent>
      </Card>
    </div>
  )
}
