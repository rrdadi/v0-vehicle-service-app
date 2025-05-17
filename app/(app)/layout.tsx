import type React from "react"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { createServerClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/utils/auth"
import { NotificationListener } from "@/components/notifications/notification-listener"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Get user role
  const userRole = await getUserRole()

  if (!userRole) {
    redirect("/auth/login")
  }

  // Get unread notifications count
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("is_read", false)

  return (
    <>
      <AppShell userRole={userRole} notifications={count || 0}>
        {children}
      </AppShell>
      <NotificationListener userId={session.user.id} />
    </>
  )
}
