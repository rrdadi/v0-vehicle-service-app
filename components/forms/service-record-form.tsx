"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ServiceRecordFormProps {
  serviceRecordId?: string
}

export function ServiceRecordForm({ serviceRecordId }: ServiceRecordFormProps = {}) {
  const [vehicleId, setVehicleId] = useState("")
  const [mileage, setMileage] = useState("")
  const [customerConcerns, setCustomerConcerns] = useState("")
  const [technicianObservations, setTechnicianObservations] = useState("")
  const [status, setStatus] = useState("open")
  const [vehicles, setVehicles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Fetch vehicles for dropdown
  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          id,
          plate_number,
          make,
          model,
          customers (
            name
          )
        `)
        .order("plate_number")

      if (error) {
        console.error("Error fetching vehicles:", error)
        return
      }

      setVehicles(data || [])
    }

    fetchVehicles()
  }, [supabase])

  // If editing, fetch service record data
  useEffect(() => {
    if (serviceRecordId) {
      setIsEditing(true)

      const fetchServiceRecord = async () => {
        const { data, error } = await supabase.from("service_records").select("*").eq("id", serviceRecordId).single()

        if (error) {
          console.error("Error fetching service record:", error)
          return
        }

        if (data) {
          setVehicleId(data.vehicle_id)
          setMileage(data.mileage.toString())
          setCustomerConcerns(data.customer_concerns || "")
          setTechnicianObservations(data.technician_observations || "")
          setStatus(data.status)
        }
      }

      fetchServiceRecord()
    }
  }, [serviceRecordId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!vehicleId || !mileage) {
        setError("Please fill in all required fields")
        return
      }

      const serviceRecordData = {
        vehicle_id: vehicleId,
        mileage: Number.parseInt(mileage),
        customer_concerns: customerConcerns || null,
        technician_observations: technicianObservations || null,
        status,
      }

      let result

      if (isEditing) {
        result = await supabase.from("service_records").update(serviceRecordData).eq("id", serviceRecordId)
      } else {
        result = await supabase.from("service_records").insert(serviceRecordData)
      }

      if (result.error) {
        setError(result.error.message)
        return
      }

      toast({
        title: isEditing ? "Service record updated" : "Service record created",
        description: isEditing
          ? "The service record has been updated successfully"
          : "The service record has been created successfully",
      })

      router.push("/service-records")
      router.refresh()
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="vehicle">Vehicle</Label>
          <Select value={vehicleId} onValueChange={setVehicleId} required>
            <SelectTrigger id="vehicle">
              <SelectValue placeholder="Select a vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate_number} - {vehicle.make} {vehicle.model} ({vehicle.customers.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mileage">Mileage (km)</Label>
          <Input id="mileage" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus} required>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="customerConcerns">Customer Concerns</Label>
          <Textarea
            id="customerConcerns"
            value={customerConcerns}
            onChange={(e) => setCustomerConcerns(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="technicianObservations">Technician Observations</Label>
          <Textarea
            id="technicianObservations"
            value={technicianObservations}
            onChange={(e) => setTechnicianObservations(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : isEditing ? "Update Service Record" : "Create Service Record"}
        </Button>
      </div>
    </form>
  )
}
