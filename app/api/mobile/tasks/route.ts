import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user role
    const { data: user } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    // Get tasks
    let query = supabase
      .from("tasks")
      .select(`
        id,
        description,
        status,
        created_at,
        service_record_id,
        service_records (
          vehicles (
            plate_number,
            make,
            model
          )
        ),
        task_assignments (
          id,
          technician_id,
          start_time,
          end_time,
          users (
            full_name
          )
        ),
        parts_used (
          id,
          name,
          quantity
        )
      `)
      .order("created_at", { ascending: false })

    // If technician, only show tasks assigned to them
    if (user?.role === "technician") {
      query = query.contains("task_assignments.technician_id", [session.user.id])
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { taskId, assignmentId, action } = await request.json()

    if (!taskId || !assignmentId || !action) {
      return NextResponse.json({ error: "Task ID, assignment ID, and action are required" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is assigned to this task
    const { data: assignment } = await supabase
      .from("task_assignments")
      .select("*")
      .eq("id", assignmentId)
      .eq("technician_id", session.user.id)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: "You are not assigned to this task" }, { status: 403 })
    }

    if (action === "start") {
      // Start task
      const { error: updateError } = await supabase
        .from("task_assignments")
        .update({
          start_time: new Date().toISOString(),
        })
        .eq("id", assignmentId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Update task status
      await supabase
        .from("tasks")
        .update({
          status: "in_progress",
        })
        .eq("id", taskId)
    } else if (action === "complete") {
      // Complete task
      const { error: updateError } = await supabase
        .from("task_assignments")
        .update({
          end_time: new Date().toISOString(),
        })
        .eq("id", assignmentId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Update task status
      await supabase
        .from("tasks")
        .update({
          status: "completed",
        })
        .eq("id", taskId)
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}
