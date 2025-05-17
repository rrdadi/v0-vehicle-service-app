import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get all service records with tasks
    const { data: serviceRecords } = await supabase
      .from("service_records")
      .select(`
        id,
        status,
        vehicles (
          plate_number,
          make,
          model
        ),
        tasks:tasks (
          id,
          status
        )
      `)
      .eq("status", "in_progress")

    if (!serviceRecords || serviceRecords.length === 0) {
      return NextResponse.json({ message: "No in-progress service records found" })
    }

    // Get all managers
    const { data: managers } = await supabase.from("users").select("id").eq("role", "manager")

    if (!managers || managers.length === 0) {
      return NextResponse.json({ error: "No managers found" }, { status: 404 })
    }

    const notifications = []
    const serviceRecordsToUpdate = []

    // Check each service record
    for (const record of serviceRecords) {
      // Skip if no tasks
      if (!record.tasks || record.tasks.length === 0) continue

      // Check if all tasks are completed
      const allTasksCompleted = record.tasks.every((task: any) => task.status === "completed")

      if (allTasksCompleted) {
        // Add service record to update list
        serviceRecordsToUpdate.push(record.id)

        // Create notifications for managers
        for (const manager of managers) {
          notifications.push({
            user_id: manager.id,
            title: "Service Completed",
            message: `All tasks for vehicle ${record.vehicles.plate_number} (${record.vehicles.make} ${record.vehicles.model}) have been completed.`,
          })
        }
      }
    }

    // Update service records status
    if (serviceRecordsToUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from("service_records")
        .update({ status: "completed" })
        .in("id", serviceRecordsToUpdate)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error: notificationError } = await supabase.from("notifications").insert(notifications)

      if (notificationError) {
        return NextResponse.json({ error: notificationError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      message: "Task completion check completed",
      completedServices: serviceRecordsToUpdate.length,
      notificationsSent: notifications.length,
    })
  } catch (error) {
    console.error("Error checking task completion:", error)
    return NextResponse.json({ error: "Failed to check task completion" }, { status: 500 })
  }
}
