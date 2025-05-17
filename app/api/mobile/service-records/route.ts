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

    // Get service records
    let query = supabase
      .from("service_records")
      .select(`
        id,
        mileage,
        customer_concerns,
        technician_observations,
        status,
        created_at,
        updated_at,
        vehicles (
          plate_number,
          make,
          model,
          year,
          customers (
            name,
            email,
            phone
          )
        ),
        tasks (
          id,
          description,
          status,
          task_assignments (
            id,
            technician_id,
            start_time,
            end_time,
            users (
              full_name
            )
          )
        )
      `)
      .order("created_at", { ascending: false })

    // If technician, only show service records with tasks assigned to them
    if (user?.role === "technician") {
      query = query.contains("tasks.task_assignments.technician_id", [session.user.id])
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching service records:", error)
    return NextResponse.json({ error: "Failed to fetch service records" }, { status: 500 })
  }
}
