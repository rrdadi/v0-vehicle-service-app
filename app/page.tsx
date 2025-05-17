import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = createServerClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  } else {
    redirect("/auth/login")
  }

  return null
}
