import { NextResponse } from "next/server"
import { storeSessionData, deleteSession, getUserSessions } from "@/lib/session"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    // Store a new session
    const { userId, sessionId, data } = await request.json()

    if (!userId || !sessionId) {
      return NextResponse.json({ error: "User ID and session ID are required" }, { status: 400 })
    }

    const stored = await storeSessionData(userId, sessionId, data || {})

    if (!stored) {
      return NextResponse.json({ error: "Failed to store session data" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error storing session:", error)
    return NextResponse.json({ error: "Failed to store session" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createServerActionClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user role
    const { data: user } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    // Only managers can see all sessions
    if (user?.role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get the user ID from the query string
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get all sessions for the user
    const sessions = await getUserSessions(userId)

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Error getting sessions:", error)
    return NextResponse.json({ error: "Failed to get sessions" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createServerActionClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user ID and session ID from the query string
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")
    const sessionId = url.searchParams.get("sessionId")

    if (!userId || !sessionId) {
      return NextResponse.json({ error: "User ID and session ID are required" }, { status: 400 })
    }

    // Users can only delete their own sessions
    if (userId !== session.user.id) {
      // Get user role
      const { data: user } = await supabase.from("users").select("role").eq("id", session.user.id).single()

      // Only managers can delete other users' sessions
      if (user?.role !== "manager") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Delete the session
    const deleted = await deleteSession(userId, sessionId)

    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting session:", error)
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
  }
}
