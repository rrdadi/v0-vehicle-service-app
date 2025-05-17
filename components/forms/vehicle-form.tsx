"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CACHE_KEYS } from "@/lib/cache"

interface VehicleFormProps {
  vehicleId?: string
}

export function VehicleForm({ vehicleId }: VehicleFormProps = {}) {
  const [plateNumber, setPlateNumber] = useState("")
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [customers, setCustomers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase.from("customers").select("id, name").order("name")

      if (error) {
        console.error("Error fetching customers:", error)
        return
      }

      setCustomers(data || [])
    }

    fetchCustomers()
  }, [supabase])

  // If editing, fetch vehicle data
  useEffect(() => {
    if (vehicleId) {
      setIsEditing(true)

      const fetchVehicle = async () => {
        const { data, error } = await supabase.from("vehicles").select("*").eq("id", vehicleId).single()

        if (error) {
          console.error("Error fetching vehicle:", error)
          return
        }

        if (data) {
          setPlateNumber(data.plate_number)
          setMake(data.make)
          setModel(data.model)
          setYear(data.year.toString())
          setCustomerId(data.customer_id)
        }
      }

      fetchVehicle()
    }
  }, [vehicleId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!plateNumber || !make || !model || !year || !customerId) {
        setError("Please fill in all fields")
        return
      }

      const vehicleData = {
        plate_number: plateNumber,
        make,
        model,
        year: Number.parseInt(year),
        customer_id: customerId,
      }

      let result

      if (isEditing) {
        result = await supabase.from("vehicles").update(vehicleData).eq("id", vehicleId)
      } else {
        result = await supabase.from("vehicles").insert(vehicleData)
      }

      if (result.error) {
        setError(result.error.message)
        return
      }

      // Invalidate caches
      await fetch("/api/cache/invalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keys: [
            CACHE_KEYS.VEHICLES,
            isEditing ? CACHE_KEYS.VEHICLE_SERVICE_RECORDS(vehicleId!) : null,
            CACHE_KEYS.CUSTOMER_VEHICLES(customerId),
          ].filter(Boolean),
        }),
      })

      toast({
        title: isEditing ? "Vehicle updated" : "Vehicle added",
        description: isEditing
          ? "The vehicle has been updated successfully"
          : "The vehicle has been added successfully",
      })

      router.push("/vehicles")
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
        <div className="space-y-2">
          <Label htmlFor="plateNumber">Plate Number</Label>
          <Input id="plateNumber" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="make">Make</Label>
          <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="customer">Customer</Label>
          <Select value={customerId} onValueChange={setCustomerId} required>
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : isEditing ? "Update Vehicle" : "Add Vehicle"}
        </Button>
      </div>
    </form>
  )
}
