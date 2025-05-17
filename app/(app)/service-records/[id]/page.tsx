import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser, isManager } from "@/lib/utils/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TaskList } from "@/components/service/task-list"
import { AddTaskForm } from "@/components/forms/add-task-form"
import { AddPartsForm } from "@/components/forms/add-parts-form"

export default async function ServiceRecordPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerClient()
  const manager = await isManager()
  const currentUser = await getCurrentUser()

  if (!params.id || !currentUser) {
    notFound()
  }

  // Fetch service record with related data
  const { data: serviceRecord } = await supabase
    .from("service_records")
    .select(`
      *,
      vehicles (
        *,
        customers (*)
      )
    `)
    .eq("id", params.id)
    .single()

  if (!serviceRecord) {
    notFound()
  }

  // Fetch tasks for this service record
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      task_assignments (
        id,
        technician_id,
        start_time,
        end_time,
        users (
          full_name
        )
      ),
      parts_used (*)
    `)
    .eq("service_record_id", params.id)
    .order("created_at")

  // Check if current user is assigned to any tasks
  const userAssignedTasks =
    tasks?.filter((task) =>
      task.task_assignments.some((assignment: any) => assignment.technician_id === currentUser.id),
    ) || []

  // Determine if user can edit tasks (managers can edit all, technicians only their assigned tasks)
  const canEditTasks = manager || userAssignedTasks.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Record</h1>
          <p className="text-muted-foreground">
            {serviceRecord.vehicles.plate_number} - {serviceRecord.vehicles.make} {serviceRecord.vehicles.model}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              serviceRecord.status === "completed"
                ? "success"
                : serviceRecord.status === "in_progress"
                  ? "warning"
                  : "default"
            }
          >
            {serviceRecord.status.charAt(0).toUpperCase() + serviceRecord.status.slice(1).replace("_", " ")}
          </Badge>

          {manager && (
            <Link href={`/service-records/${params.id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Plate Number</dt>
                <dd>{serviceRecord.vehicles.plate_number}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Make & Model</dt>
                <dd>
                  {serviceRecord.vehicles.make} {serviceRecord.vehicles.model}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Year</dt>
                <dd>{serviceRecord.vehicles.year}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Mileage</dt>
                <dd>{serviceRecord.mileage} km</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                <dd>{serviceRecord.vehicles.customers.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Contact</dt>
                <dd>{serviceRecord.vehicles.customers.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd>{serviceRecord.vehicles.customers.email || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                <dd>{serviceRecord.vehicles.customers.address}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Customer Concerns</h3>
            <p className="mt-1">{serviceRecord.customer_concerns || "No concerns noted"}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium">Technician Observations</h3>
            <p className="mt-1">{serviceRecord.technician_observations || "No observations noted"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Tasks assigned for this service record</CardDescription>
          </div>

          {manager && <AddTaskForm serviceRecordId={params.id} />}
        </CardHeader>
        <CardContent>
          <TaskList tasks={tasks || []} canEdit={canEditTasks} currentUserId={currentUser.id} isManager={manager} />
        </CardContent>
      </Card>

      {canEditTasks && (
        <Card>
          <CardHeader>
            <CardTitle>Parts Used</CardTitle>
            <CardDescription>Record parts and consumables used for this service</CardDescription>
          </CardHeader>
          <CardContent>
            <AddPartsForm tasks={tasks || []} canEditAll={manager} currentUserId={currentUser.id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
