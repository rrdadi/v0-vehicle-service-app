import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { isManager } from "@/lib/utils/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { getCachedData, cacheData, CACHE_KEYS, CACHE_TTL } from "@/lib/cache"

export default async function VehiclesPage() {
  const supabase = createServerClient()
  const manager = await isManager()

  // Try to get vehicles from cache
  let vehicles = await getCachedData(CACHE_KEYS.VEHICLES)

  // If not in cache, fetch from database
  if (!vehicles) {
    const { data } = await supabase
      .from("vehicles")
      .select(`
        id,
        plate_number,
        make,
        model,
        year,
        customers (
          name,
          phone
        )
      `)
      .order("created_at", { ascending: false })

    vehicles = data || []

    // Cache the vehicles data
    await cacheData(CACHE_KEYS.VEHICLES, vehicles, CACHE_TTL.VEHICLES)
  }

  const columns = [
    {
      accessorKey: "plate_number",
      header: "Plate Number",
    },
    {
      accessorKey: "make",
      header: "Make",
    },
    {
      accessorKey: "model",
      header: "Model",
    },
    {
      accessorKey: "year",
      header: "Year",
    },
    {
      accessorKey: "customers.name",
      header: "Owner",
    },
    {
      accessorKey: "customers.phone",
      header: "Contact",
    },
    {
      id: "actions",
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/vehicles/${row.original.id}`}>
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
          {manager && (
            <Link href={`/vehicles/${row.original.id}/edit`}>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </Link>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
        {manager && (
          <Link href="/vehicles/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Vehicles</CardTitle>
          <CardDescription>Manage all vehicles in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={vehicles} />
        </CardContent>
      </Card>
    </div>
  )
}
