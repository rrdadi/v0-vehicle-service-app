import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { isManager } from "@/lib/utils/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomerForm } from "@/components/forms/customer-form"

export default async function EditCustomerPage({
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

  // Fetch customer to check if it exists
  const { data: customer } = await supabase.from("customers").select("name").eq("id", params.id).single()

  if (!customer) {
    redirect("/customers")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Customer</h1>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Edit the details of {customer.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm customerId={params.id} />
        </CardContent>
      </Card>
    </div>
  )
}
