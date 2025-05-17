"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertCircle, MoveIcon as Transfer } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VehicleTransferFormProps {
  vehicleId: string
  currentCustomerId: string
}

export function VehicleTransferForm({ vehicleId, currentCustomerId }: VehicleTransferFormProps) {
  const [open, setOpen] = useState(false)
  const [newCustomerId, setNewCustomerId] = useState("")
  const [notes, setNotes] = useState("")
  const [customers, setCustomers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()
  const supabase = createClient()

  // Fetch customers for dropdown
  useEffect(() => {
    if (open) {
      const fetchCustomers = async () => {
        const { data, error } = await supabase.from("customers").select("id, name").order("name")

        if (error) {
          console.error("Error fetching customers:", error)
          return
        }

        // Filter out the current customer
        const filteredCustomers = data?.filter((c) => c.id !== currentCustomerId) || []
        setCustomers(filteredCustomers)
      }

      fetchCustomers()
    }
  }, [open, supabase, currentCustomerId])

  const handleTransfer = async () => {
    if (!newCustomerId) return

    setIsLoading(true)
    setError(null)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("User not authenticated")

      // Start a transaction
      // 1. Update vehicle customer_id
      const { error: updateError } = await supabase
        .from("vehicles")
        .update({ customer_id: newCustomerId })
        .eq("id", vehicleId)

      if (updateError) throw updateError

      // 2. Add to vehicle history
      const { error: historyError } = await supabase.from("vehicle_history").insert({
        vehicle_id: vehicleId,
        previous_customer_id: currentCustomerId,
        new_customer_id: newCustomerId,
        notes: notes || null,
        created_by: user.id,
      })

      if (historyError) throw historyError

      toast({
        title: "Vehicle transferred",
        description: "The vehicle has been transferred to the new owner",
      })

      // Reset form and close dialog
      setNewCustomerId("")
      setNotes("")
      setOpen(false)

      // Refresh the page
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Transfer className="mr-2 h-4 w-4" />
          Transfer Ownership
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Vehicle Ownership</DialogTitle>
          <DialogDescription>Transfer this vehicle to a new owner</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="newOwner">New Owner</Label>
            <Select value={newCustomerId} onValueChange={setNewCustomerId} required>
              <SelectTrigger id="newOwner">
                <SelectValue placeholder="Select a new owner" />
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this transfer"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleTransfer} disabled={!newCustomerId || isLoading}>
            {isLoading ? "Transferring..." : "Transfer Vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
