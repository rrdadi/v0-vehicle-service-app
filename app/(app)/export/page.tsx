import { isManager } from "@/lib/utils/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"

export default async function ExportPage() {
  // Check if user is a manager
  const manager = await isManager()

  if (!manager) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Export Data</h1>

      <Card>
        <CardHeader>
          <CardTitle>Export Service Records</CardTitle>
          <CardDescription>Export all service records to Excel format</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This will export all service records with related vehicle, customer, task, and parts information.
          </p>
          <a href="/api/export/service-records" target="_blank" rel="noopener noreferrer">
            <Button>
              <FileDown className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
