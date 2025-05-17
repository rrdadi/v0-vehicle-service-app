import { NextResponse } from "next/server"
import { publishNotification } from "@/lib/redis"
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

    // Get the notification data from the request
    const { channel, message } = await request.json()

    if (!channel || !message) {
      return NextResponse.json({ error: "Channel and message are required" }, { status: 400 })
    }

    // Publish the notification
    const published = await publishNotification(channel, message)

    if (!published) {
      return NextResponse.json({ error: "Failed to publish notification" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error publishing notification:", error)
    return NextResponse.json({ error: "Failed to publish notification" }, { status: 500 })
  }
}
