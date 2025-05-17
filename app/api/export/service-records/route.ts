import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get all service records with related data
    const { data: serviceRecords, error } = await supabase
      .from("service_records")
      .select(`
        id,
        mileage,
        customer_concerns,
        technician_observations,
        status,
        created_at,
        updated_at,
        vehicles (
          plate_number,
          make,
          model,
          year,
          customers (
            name,
            email,
            phone,
            address
          )
        ),
        tasks (
          id,
          description,
          status,
          task_assignments (
            technician_id,
            start_time,
            end_time,
            users (
              full_name
            )
          ),
          parts_used (
            name,
            quantity
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!serviceRecords || serviceRecords.length === 0) {
      return NextResponse.json({ message: "No service records found" }, { status: 404 })
    }

    // Transform data for Excel
    const excelData = serviceRecords.map((record) => {
      // Get all parts used across all tasks
      const partsUsed = record.tasks
        .flatMap((task: any) => task.parts_used)
        .map((part: any) => `${part.name} (${part.quantity})`)
        .join(", ")

      // Get all technicians assigned to tasks
      const technicians = record.tasks
        .flatMap((task: any) => task.task_assignments)
        .map((assignment: any) => assignment.users.full_name)
        .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index) // Remove duplicates
        .join(", ")

      return {
        "Service ID": record.id,
        Date: new Date(record.created_at).toLocaleDateString(),
        Status: record.status,
        "Plate Number": record.vehicles.plate_number,
        Vehicle: `${record.vehicles.make} ${record.vehicles.model}`,
        Year: record.vehicles.year,
        Mileage: record.mileage,
        "Customer Name": record.vehicles.customers.name,
        "Customer Email": record.vehicles.customers.email,
        "Customer Phone": record.vehicles.customers.phone,
        "Customer Address": record.vehicles.customers.address,
        "Customer Concerns": record.customer_concerns,
        "Technician Observations": record.technician_observations,
        Technicians: technicians,
        "Parts Used": partsUsed,
      }
    })

    // Create Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Service Records")

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="service-records.xlsx"',
      },
    })
  } catch (error) {
    console.error("Error exporting service records:", error)
    return NextResponse.json({ error: "Failed to export service records" }, { status: 500 })
  }
}
