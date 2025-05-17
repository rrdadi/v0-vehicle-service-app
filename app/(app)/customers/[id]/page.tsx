import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { isManager } from "@/lib/utils/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function CustomerPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerClient()
  const manager = await isManager()

  if (!params.id) {
    notFound()
  }

  // Fetch customer
  const { data: customer } = await supabase.from("customers").select("*").eq("id", params.id).single()

  if (!customer) {
    notFound()
  }

  // Fetch vehicles owned by this customer
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("customer_id", params.id)
    .order("plate_number")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground">Customer Details</p>
        </div>

        {manager && (
          <Link href={`/customers/${params.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd>{customer.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd>{customer.email || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
              <dd>{customer.phone}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-muted-foreground">Address</dt>
              <dd>{customer.address}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
          <CardDescription>Vehicles owned by this customer</CardDescription>
        </CardHeader>
        <CardContent>
          {vehicles && vehicles.length > 0 ? (
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </p>
                    <p className="text-sm text-muted-foreground">Plate Number: {vehicle.plate_number}</p>
                  </div>
                  <Link href={`/vehicles/${vehicle.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p>No vehicles found for this customer.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
