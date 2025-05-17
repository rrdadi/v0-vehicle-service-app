import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { isManager } from "@/lib/utils/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VehicleForm } from "@/components/forms/vehicle-form"

export default async function EditVehiclePage({
  params,
}: {
  params: { id: string }
}) {
  // Check if user is a manager
  const manager = await isManager()

  if (!manager) {
    redirect("/dashboard")
  }

  const supabase = createServerClient()

  // Fetch vehicle to check if it exists
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("plate_number, make, model")
    .eq("id", params.id)
    .single()

  if (!vehicle) {
    redirect("/vehicles")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Vehicle</h1>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
          <CardDescription>
            Edit the details of {vehicle.make} {vehicle.model} ({vehicle.plate_number})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleForm vehicleId={params.id} />
        </CardContent>
      </Card>
    </div>
  )
}
