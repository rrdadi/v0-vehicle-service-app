import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { isManager } from "@/lib/utils/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"

export default async function CustomersPage() {
  const supabase = createServerClient()
  const manager = await isManager()

  const { data: customers } = await supabase.from("customers").select("*").order("name")

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "address",
      header: "Address",
    },
    {
      id: "actions",
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/customers/${row.original.id}`}>
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
          {manager && (
            <Link href={`/customers/${row.original.id}/edit`}>
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
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        {manager && (
          <Link href="/customers/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>Manage all customers in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={customers || []} searchKey="name" />
        </CardContent>
      </Card>
    </div>
  )
}
