import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { publishNotification, NOTIFICATION_CHANNELS } from "@/lib/redis"

export async function GET() {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get all incomplete tasks from the previous day
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: incompleteTasks } = await supabase
      .from("tasks")
      .select(`
        id,
        description,
        service_record_id,
        service_records (
          vehicles (
            plate_number
          )
        ),
        task_assignments (
          technician_id
        )
      `)
      .eq("status", "in_progress")
      .lt("created_at", today.toISOString())
      .gte("created_at", yesterday.toISOString())

    if (!incompleteTasks || incompleteTasks.length === 0) {
      return NextResponse.json({ message: "No incomplete tasks found" })
    }

    // Get all users
    const { data: users } = await supabase.from("users").select("id, role")

    if (!users) {
      return NextResponse.json({ error: "No users found" }, { status: 404 })
    }

    // Create notifications for managers and assigned technicians
    const managers = users.filter((user) => user.role === "manager")
    const notifications = []

    // For each incomplete task, create notifications
    for (const task of incompleteTasks) {
      const vehiclePlate = task.service_records.vehicles.plate_number

      // Notify managers
      for (const manager of managers) {
        notifications.push({
          user_id: manager.id,
          title: "Incomplete Task",
          message: `Task "${task.description}" for vehicle ${vehiclePlate} is still incomplete.`,
        })
      }

      // Notify assigned technicians
      for (const assignment of task.task_assignments) {
        notifications.push({
          user_id: assignment.technician_id,
          title: "Incomplete Task",
          message: `Your assigned task "${task.description}" for vehicle ${vehiclePlate} is still incomplete.`,
        })
      }
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error } = await supabase.from("notifications").insert(notifications)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Publish real-time notification
      await publishNotification(NOTIFICATION_CHANNELS.DAILY_REMINDER, {
        tasks: incompleteTasks.map((task) => ({
          id: task.id,
          description: task.description,
          vehicle: task.service_records.vehicles.plate_number,
        })),
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      message: "Daily notifications sent",
      count: notifications.length,
    })
  } catch (error) {
    console.error("Error sending daily notifications:", error)
    return NextResponse.json({ error: "Failed to send daily notifications" }, { status: 500 })
  }
}
