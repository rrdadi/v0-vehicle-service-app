import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { isManager } from "@/lib/utils/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VehicleTransferForm } from "@/components/forms/vehicle-transfer-form"
import { Badge } from "@/components/ui/badge"

export default async function VehiclePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerClient()
  const manager = await isManager()

  if (!params.id) {
    notFound()
  }

  // Fetch vehicle with related data
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select(`
      *,
      customers (*)
    `)
    .eq("id", params.id)
    .single()

  if (!vehicle) {
    notFound()
  }

  // Fetch service records for this vehicle
  const { data: serviceRecords } = await supabase
    .from("service_records")
    .select("*")
    .eq("vehicle_id", params.id)
    .order("created_at", { ascending: false })

  // Fetch ownership history
  const { data: ownershipHistory } = await supabase
    .from("vehicle_history")
    .select(`
      *,
      previous_customers:previous_customer_id (
        name
      ),
      new_customers:new_customer_id (
        name
      ),
      users (
        full_name
      )
    `)
    .eq("vehicle_id", params.id)
    .order("change_date", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-muted-foreground">{vehicle.plate_number}</p>
        </div>

        <div className="flex items-center gap-2">
          {manager && (
            <>
              <Link href={`/vehicles/${params.id}/edit`}>
                <Button variant="outline">Edit</Button>
              </Link>
              <VehicleTransferForm vehicleId={params.id} currentCustomerId={vehicle.customer_id} />
            </>
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
                <dd>{vehicle.plate_number}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Make</dt>
                <dd>{vehicle.make}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Model</dt>
                <dd>{vehicle.model}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Year</dt>
                <dd>{vehicle.year}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                <dd>{vehicle.customers.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Contact</dt>
                <dd>{vehicle.customers.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd>{vehicle.customers.email || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                <dd>{vehicle.customers.address}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service History</CardTitle>
          <CardDescription>Service records for this vehicle</CardDescription>
        </CardHeader>
        <CardContent>
          {serviceRecords && serviceRecords.length > 0 ? (
            <div className="space-y-4">
              {serviceRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">Service on {new Date(record.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">Mileage: {record.mileage} km</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        record.status === "completed"
                          ? "success"
                          : record.status === "in_progress"
                            ? "warning"
                            : "default"
                      }
                    >
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace("_", " ")}
                    </Badge>
                    <Link href={`/service-records/${record.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No service records found for this vehicle.</p>
          )}
        </CardContent>
      </Card>

      {ownershipHistory && ownershipHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ownership History</CardTitle>
            <CardDescription>History of ownership changes for this vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ownershipHistory.map((history) => (
                <div key={history.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Transferred on {new Date(history.change_date).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">By {history.users.full_name}</p>
                  </div>
                  <p className="mt-1 text-sm">From: {history.previous_customers?.name || "New Registration"}</p>
                  <p className="text-sm">To: {history.new_customers.name}</p>
                  {history.notes && <p className="mt-2 text-sm text-muted-foreground">Notes: {history.notes}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
