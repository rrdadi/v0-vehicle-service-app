import { redirect } from "next/navigation"
import { isManager } from "@/lib/utils/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceRecordForm } from "@/components/forms/service-record-form"

export default async function NewServiceRecordPage() {
  // Check if user is a manager
  const manager = await isManager()

  if (!manager) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">New Service Record</h1>

      <Card>
        <CardHeader>
          <CardTitle>Service Record Information</CardTitle>
          <CardDescription>Enter the details of the new service record</CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceRecordForm />
        </CardContent>
      </Card>
    </div>
  )
}
