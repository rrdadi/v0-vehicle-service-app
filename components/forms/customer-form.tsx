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
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CustomerFormProps {
  customerId?: string
}

export function CustomerForm({ customerId }: CustomerFormProps = {}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // If editing, fetch customer data
  useEffect(() => {
    if (customerId) {
      setIsEditing(true)

      const fetchCustomer = async () => {
        const { data, error } = await supabase.from("customers").select("*").eq("id", customerId).single()

        if (error) {
          console.error("Error fetching customer:", error)
          return
        }

        if (data) {
          setName(data.name)
          setEmail(data.email || "")
          setPhone(data.phone)
          setAddress(data.address)
        }
      }

      fetchCustomer()
    }
  }, [customerId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!name || !phone || !address) {
        setError("Please fill in all required fields")
        return
      }

      const customerData = {
        name,
        email: email || null,
        phone,
        address,
      }

      let result

      if (isEditing) {
        result = await supabase.from("customers").update(customerData).eq("id", customerId)
      } else {
        result = await supabase.from("customers").insert(customerData)
      }

      if (result.error) {
        setError(result.error.message)
        return
      }

      toast({
        title: isEditing ? "Customer updated" : "Customer added",
        description: isEditing
          ? "The customer has been updated successfully"
          : "The customer has been added successfully",
      })

      router.push("/customers")
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
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} required rows={3} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : isEditing ? "Update Customer" : "Add Customer"}
        </Button>
      </div>
    </form>
  )
}
