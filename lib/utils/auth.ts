import { createServerClient } from "@/lib/supabase/server"

export async function getUserRole() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null

  const { data: user } = await supabase.from("users").select("role").eq("id", session.user.id).single()

  return user?.role || null
}

export async function isManager() {
  const role = await getUserRole()
  return role === "manager"
}

export async function isTechnician() {
  const role = await getUserRole()
  return role === "technician"
}

export async function getCurrentUser() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null

  const { data: user } = await supabase.from("users").select("*").eq("id", session.user.id).single()

  return user
}
