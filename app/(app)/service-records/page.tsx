import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { isManager } from "@/lib/utils/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"

export default async function ServiceRecordsPage() {
  const supabase = createServerClient()
  const manager = await isManager()

  const { data: serviceRecords } = await supabase
    .from("service_records")
    .select(`
      id,
      mileage,
      status,
      created_at,
      vehicles (
        plate_number,
        make,
        model,
        customers (
          name
        )
      )
    `)
    .order("created_at", { ascending: false })

  const columns = [
    {
      accessorKey: "vehicles.plate_number",
      header: "Plate Number",
    },
    {
      accessorKey: "vehicles.make",
      header: "Make",
    },
    {
      accessorKey: "vehicles.model",
      header: "Model",
    },
    {
      accessorKey: "vehicles.customers.name",
      header: "Customer",
    },
    {
      accessorKey: "mileage",
      header: "Mileage",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.getValue("status")
        return (
          <Badge variant={status === "completed" ? "success" : status === "in_progress" ? "warning" : "default"}>
            {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }: { row: any }) => {
        return new Date(row.getValue("created_at")).toLocaleDateString()
      },
    },
    {
      id: "actions",
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/service-records/${row.original.id}`}>
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
          {manager && (
            <Link href={`/service-records/${row.original.id}/edit`}>
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
        <h1 className="text-3xl font-bold tracking-tight">Service Records</h1>
        {manager && (
          <Link href="/service-records/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Service Record
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Service Records</CardTitle>
          <CardDescription>View and manage all service records</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={serviceRecords || []} />
        </CardContent>
      </Card>
    </div>
  )
}
