import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser, isManager } from "@/lib/utils/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Car, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = createServerClient()
  const currentUser = await getCurrentUser()
  const manager = await isManager()

  // Get counts for dashboard stats
  const { count: totalVehicles } = await supabase.from("vehicles").select("*", { count: "exact", head: true })

  const { count: inProgressServices } = await supabase
    .from("service_records")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_progress")

  const { count: completedServices } = await supabase
    .from("service_records")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")

  // Get recent service records
  const { data: recentServices } = await supabase
    .from("service_records")
    .select(`
      id,
      status,
      created_at,
      vehicles (
        plate_number,
        make,
        model
      )
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  // Get tasks assigned to technician (if applicable)
  let assignedTasks = []
  if (!manager && currentUser) {
    const { data: tasks } = await supabase
      .from("task_assignments")
      .select(`
        id,
        start_time,
        end_time,
        tasks (
          id,
          description,
          status,
          service_record_id,
          service_records (
            vehicles (
              plate_number,
              make,
              model
            )
          )
        )
      `)
      .eq("technician_id", currentUser.id)
      .is("end_time", null)
      .order("created_at", { ascending: false })

    assignedTasks = tasks || []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {currentUser?.full_name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVehicles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressServices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedServices}</div>
          </CardContent>
        </Card>
      </div>

      {!manager && assignedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Assigned Tasks</CardTitle>
            <CardDescription>Tasks that have been assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignedTasks.map((assignment: any) => (
                <div key={assignment.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{assignment.tasks.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.tasks.service_records.vehicles.plate_number} -{" "}
                      {assignment.tasks.service_records.vehicles.make} {assignment.tasks.service_records.vehicles.model}
                    </p>
                  </div>
                  <Link href={`/service-records/${assignment.tasks.service_record_id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Service Records</CardTitle>
          <CardDescription>Recently created service records</CardDescription>
        </CardHeader>
        <CardContent>
          {recentServices && recentServices.length > 0 ? (
            <div className="space-y-4">
              {recentServices.map((service: any) => (
                <div key={service.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {service.vehicles.plate_number} - {service.vehicles.make} {service.vehicles.model}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </p>
                  </div>
                  <Link href={`/service-records/${service.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No recent service records</AlertTitle>
              <AlertDescription>No service records have been created yet.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
