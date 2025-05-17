import { NextResponse } from "next/server"
import { invalidateCaches } from "@/lib/cache"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const supabase = createServerActionClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the keys to invalidate from the request
    const { keys } = await request.json()

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: "Keys array is required" }, { status: 400 })
    }

    // Invalidate the caches
    const invalidated = await invalidateCaches(keys)

    if (!invalidated) {
      return NextResponse.json({ error: "Failed to invalidate caches" }, { status: 500 })
    }

    return NextResponse.json({ success: true, invalidatedKeys: keys })
  } catch (error) {
    console.error("Error invalidating caches:", error)
    return NextResponse.json({ error: "Failed to invalidate caches" }, { status: 500 })
  }
}
