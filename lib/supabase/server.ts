import { createServerComponentClient, createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

// Create a server component client
export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

// Create a server action client
export const createActionClient = () => {
  return createServerActionClient<Database>({ cookies })
}
