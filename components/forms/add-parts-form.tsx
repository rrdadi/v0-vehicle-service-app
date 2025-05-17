"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddPartsFormProps {
  tasks: any[]
  canEditAll: boolean
  currentUserId: string
}

export function AddPartsForm({ tasks, canEditAll, currentUserId }: AddPartsFormProps) {
  const [taskId, setTaskId] = useState("")
  const [partName, setPartName] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()
  const supabase = createClient()

  // Filter tasks that the current user can edit
  const editableTasks = canEditAll
    ? tasks
    : tasks.filter((task) =>
        task.task_assignments.some((a: any) => a.technician_id === currentUserId && a.start_time && !a.end_time),
      )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskId || !partName.trim() || !quantity) return

    setIsLoading(true)

    try {
      const { error } = await supabase.from("parts_used").insert({
        task_id: taskId,
        name: partName.trim(),
        quantity: Number.parseInt(quantity),
      })

      if (error) throw error

      toast({
        title: "Part added",
        description: "The part has been recorded successfully",
      })

      // Reset form
      setPartName("")
      setQuantity("1")

      // Refresh the page to show the new part
      window.location.reload()
    } catch (error) {
      console.error("Error adding part:", error)
      toast({
        title: "Error",
        description: "Failed to add part",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (editableTasks.length === 0) {
    return <p>No tasks available to add parts to.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task">Task</Label>
        <Select value={taskId} onValueChange={setTaskId} required>
          <SelectTrigger id="task">
            <SelectValue placeholder="Select a task" />
          </SelectTrigger>
          <SelectContent>
            {editableTasks.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                {task.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="partName">Part Name</Label>
          <Input id="partName" value={partName} onChange={(e) => setPartName(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Adding..." : "Add Part"}
      </Button>
    </form>
  )
}
