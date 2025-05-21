"use client"

import { redirect } from "next/navigation"
import { isManager } from "@/lib/utils/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, UserPlus, FileDown, Shield } from "lucide-react"
import Link from "next/link"

export default async function SettingsPage() {
  // Check if user is a manager
  const manager = await isManager()

  if (!manager) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage users of the system</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Add new managers or technicians to the system.</p>
            <Link href="/auth/register">
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add New User
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>Export data from the system</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Export service records and other data to Excel.</p>
            <Link href="/export">
              <Button>
                <FileDown className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Data</CardTitle>
            <CardDescription>Add sample data to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Add sample customers, vehicles, and service records for testing.</p>
            <SeedDataButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View and manage active sessions.</p>
            <Link href="/settings/sessions">
              <Button>
                <Shield className="mr-2 h-4 w-4" />
                Manage Sessions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SeedDataButton() {
  const handleSeedData = async () => {
    if (confirm("Are you sure you want to add sample data to the system?")) {
      try {
        const response = await fetch("/api/seed", {
          method: "POST",
        })

        if (!response.ok) {
          throw new Error("Failed to seed data")
        }

        const data = await response.json()
        alert(
          `Sample data added successfully: ${data.customers} customers, ${data.vehicles} vehicles, ${data.serviceRecords} service records`,
        )

        // Refresh the page
        window.location.reload()
      } catch (error) {
        console.error("Error seeding data:", error)
        alert("Failed to add sample data")
      }
    }
  }

  return (
    <Button onClick={handleSeedData}>
      <Database className="mr-2 h-4 w-4" />
      Add Sample Data
    </Button>
  )
}
