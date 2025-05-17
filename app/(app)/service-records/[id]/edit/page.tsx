import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { isManager } from "@/lib/utils/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceRecordForm } from "@/components/forms/service-record-form"

export default async function EditServiceRecordPage({
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

  // Fetch service record to check if it exists
  const { data: serviceRecord } = await supabase
    .from("service_records")
    .select(`
      id,
      vehicles (
        plate_number,
        make,
        model
      )
    `)
    .eq("id", params.id)
    .single()

  if (!serviceRecord) {
    redirect("/service-records")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Service Record</h1>

      <Card>
        <CardHeader>
          <CardTitle>Service Record Information</CardTitle>
          <CardDescription>
            Edit the details of service record for {serviceRecord.vehicles.make} {serviceRecord.vehicles.model} (
            {serviceRecord.vehicles.plate_number})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceRecordForm serviceRecordId={params.id} />
        </CardContent>
      </Card>
    </div>
  )
}
