import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { taskId, name, quantity } = await request.json()

    if (!taskId || !name || !quantity) {
      return NextResponse.json({ error: "Task ID, part name, and quantity are required" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is assigned to this task or is a manager
    const { data: user } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    if (user?.role !== "manager") {
      const { data: assignment } = await supabase
        .from("task_assignments")
        .select("*")
        .eq("task_id", taskId)
        .eq("technician_id", session.user.id)
        .single()

      if (!assignment) {
        return NextResponse.json({ error: "You are not assigned to this task" }, { status: 403 })
      }
    }

    // Add part
    const { error } = await supabase.from("parts_used").insert({
      task_id: taskId,
      name,
      quantity: Number.parseInt(quantity),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding part:", error)
    return NextResponse.json({ error: "Failed to add part" }, { status: 500 })
  }
}
