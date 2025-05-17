import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createServerActionClient({ cookies })

    // Check if user is authenticated and is a manager
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: user } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    if (!user || user.role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Add sample customers
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .insert([
        {
          name: "John Smith",
          email: "john@example.com",
          phone: "555-123-4567",
          address: "123 Main St, Anytown, USA",
        },
        {
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "555-987-6543",
          address: "456 Oak Ave, Somewhere, USA",
        },
        {
          name: "Bob Johnson",
          email: "bob@example.com",
          phone: "555-555-5555",
          address: "789 Pine Rd, Nowhere, USA",
        },
      ])
      .select()

    if (customersError) {
      return NextResponse.json({ error: customersError.message }, { status: 500 })
    }

    // Add sample vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from("vehicles")
      .insert([
        {
          plate_number: "ABC123",
          make: "Toyota",
          model: "Camry",
          year: 2018,
          customer_id: customers[0].id,
        },
        {
          plate_number: "XYZ789",
          make: "Honda",
          model: "Civic",
          year: 2020,
          customer_id: customers[1].id,
        },
        {
          plate_number: "DEF456",
          make: "Ford",
          model: "F-150",
          year: 2019,
          customer_id: customers[2].id,
        },
      ])
      .select()

    if (vehiclesError) {
      return NextResponse.json({ error: vehiclesError.message }, { status: 500 })
    }

    // Add sample service records
    const { data: serviceRecords, error: serviceRecordsError } = await supabase
      .from("service_records")
      .insert([
        {
          vehicle_id: vehicles[0].id,
          mileage: 35000,
          customer_concerns: "Car makes a strange noise when braking",
          technician_observations: "Worn brake pads, recommend replacement",
          status: "open",
        },
        {
          vehicle_id: vehicles[1].id,
          mileage: 15000,
          customer_concerns: "Regular maintenance check",
          technician_observations: "All systems normal, oil change performed",
          status: "completed",
        },
      ])
      .select()

    if (serviceRecordsError) {
      return NextResponse.json({ error: serviceRecordsError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: "Sample data seeded successfully",
      customers: customers.length,
      vehicles: vehicles.length,
      serviceRecords: serviceRecords.length,
    })
  } catch (error) {
    console.error("Error seeding data:", error)
    return NextResponse.json({ error: "Failed to seed data" }, { status: 500 })
  }
}
