"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { PlayCircle, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NOTIFICATION_CHANNELS } from "@/lib/redis"

interface TaskListProps {
  tasks: any[]
  canEdit: boolean
  currentUserId: string
  isManager: boolean
}

export function TaskList({ tasks, canEdit, currentUserId, isManager }: TaskListProps) {
  const { toast } = useToast()
  const supabase = createClient()

  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [selectedTechnician, setSelectedTechnician] = useState<string>("")
  const [technicians, setTechnicians] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch technicians for assignment
  const fetchTechnicians = async () => {
    const { data } = await supabase.from("users").select("id, full_name").eq("role", "technician")

    setTechnicians(data || [])
  }

  const handleAssignTask = async () => {
    if (!selectedTask || !selectedTechnician) return

    setIsLoading(true)

    try {
      const { error } = await supabase.from("task_assignments").insert({
        task_id: selectedTask.id,
        technician_id: selectedTechnician,
      })

      if (error) throw error

      // Get technician details for notification
      const { data: technicianData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", selectedTechnician)
        .single()

      // Create notification in database
      await supabase.from("notifications").insert({
        user_id: selectedTechnician,
        title: "New Task Assigned",
        message: `You have been assigned a new task: ${selectedTask.description}`,
      })

      // Send real-time notification
      await fetch("/api/notifications/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: NOTIFICATION_CHANNELS.TASK_ASSIGNED,
          message: {
            userId: selectedTechnician,
            taskId: selectedTask.id,
            title: "New Task Assigned",
            description: selectedTask.description,
            timestamp: new Date().toISOString(),
          },
        }),
      })

      toast({
        title: "Task assigned",
        description: `The task has been assigned to ${technicianData?.full_name}`,
      })

      // Refresh the page to show the new assignment
      window.location.reload()
    } catch (error) {
      console.error("Error assigning task:", error)
      toast({
        title: "Error",
        description: "Failed to assign task",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setAssignDialogOpen(false)
    }
  }

  const handleStartTask = async (taskId: string, assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("task_assignments")
        .update({
          start_time: new Date().toISOString(),
        })
        .eq("id", assignmentId)

      if (error) throw error

      // Update task status
      await supabase
        .from("tasks")
        .update({
          status: "in_progress",
        })
        .eq("id", taskId)

      toast({
        title: "Task started",
        description: "You have started working on this task",
      })

      // Refresh the page
      window.location.reload()
    } catch (error) {
      console.error("Error starting task:", error)
      toast({
        title: "Error",
        description: "Failed to start task",
        variant: "destructive",
      })
    }
  }

  const handleCompleteTask = async (taskId: string, assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("task_assignments")
        .update({
          end_time: new Date().toISOString(),
        })
        .eq("id", assignmentId)

      if (error) throw error

      // Update task status
      await supabase
        .from("tasks")
        .update({
          status: "completed",
        })
        .eq("id", taskId)

      // Get task details for notification
      const { data: taskData } = await supabase
        .from("tasks")
        .select(`
          description,
          service_record_id,
          service_records (
            vehicles (
              plate_number,
              make,
              model
            )
          )
        `)
        .eq("id", taskId)
        .single()

      if (taskData) {
        // Get managers for notifications
        const { data: managers } = await supabase.from("users").select("id").eq("role", "manager")

        if (managers && managers.length > 0) {
          // Create notifications in database
          const notifications = managers.map((manager) => ({
            user_id: manager.id,
            title: "Task Completed",
            message: `Task "${taskData.description}" for vehicle ${taskData.service_records.vehicles.plate_number} has been completed.`,
          }))

          await supabase.from("notifications").insert(notifications)

          // Send real-time notification
          await fetch("/api/notifications/publish", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              channel: NOTIFICATION_CHANNELS.TASK_COMPLETED,
              message: {
                userIds: managers.map((m) => m.id),
                taskId,
                serviceRecordId: taskData.service_record_id,
                title: "Task Completed",
                description: taskData.description,
                vehicle: `${taskData.service_records.vehicles.make} ${taskData.service_records.vehicles.model} (${taskData.service_records.vehicles.plate_number})`,
                timestamp: new Date().toISOString(),
              },
            }),
          })
        }
      }

      toast({
        title: "Task completed",
        description: "You have completed this task",
      })

      // Refresh the page
      window.location.reload()
    } catch (error) {
      console.error("Error completing task:", error)
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      })
    }
  }

  if (tasks.length === 0) {
    return <p>No tasks have been assigned yet.</p>
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const isAssigned = task.task_assignments && task.task_assignments.length > 0
        const userAssignment = task.task_assignments.find((a: any) => a.technician_id === currentUserId)
        const canStartTask = userAssignment && !userAssignment.start_time
        const canCompleteTask = userAssignment && userAssignment.start_time && !userAssignment.end_time

        return (
          <div key={task.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{task.description}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      task.status === "completed" ? "success" : task.status === "in_progress" ? "warning" : "default"
                    }
                  >
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace("_", " ")}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isManager && !isAssigned && (
                  <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task)
                          fetchTechnicians()
                        }}
                      >
                        Assign
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Task</DialogTitle>
                        <DialogDescription>Assign this task to a technician</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="technician">Technician</Label>
                          <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a technician" />
                            </SelectTrigger>
                            <SelectContent>
                              {technicians.map((tech) => (
                                <SelectItem key={tech.id} value={tech.id}>
                                  {tech.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAssignTask} disabled={!selectedTechnician || isLoading}>
                          {isLoading ? "Assigning..." : "Assign Task"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {canStartTask && (
                  <Button variant="outline" size="sm" onClick={() => handleStartTask(task.id, userAssignment.id)}>
                    <PlayCircle className="mr-1 h-4 w-4" />
                    Start
                  </Button>
                )}

                {canCompleteTask && (
                  <Button variant="outline" size="sm" onClick={() => handleCompleteTask(task.id, userAssignment.id)}>
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Complete
                  </Button>
                )}
              </div>
            </div>

            {isAssigned && (
              <div className="mt-3 text-sm">
                <p className="text-muted-foreground">Assigned to:</p>
                <ul className="mt-1 space-y-1">
                  {task.task_assignments.map((assignment: any) => (
                    <li key={assignment.id} className="flex items-center justify-between">
                      <span>{assignment.users.full_name}</span>
                      <div className="text-xs text-muted-foreground">
                        {assignment.start_time ? (
                          <>
                            Started: {new Date(assignment.start_time).toLocaleString()}
                            {assignment.end_time && (
                              <>
                                <br />
                                Completed: {new Date(assignment.end_time).toLocaleString()}
                              </>
                            )}
                          </>
                        ) : (
                          "Not started"
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {task.parts_used && task.parts_used.length > 0 && (
              <div className="mt-3 text-sm">
                <p className="text-muted-foreground">Parts used:</p>
                <ul className="mt-1 space-y-1">
                  {task.parts_used.map((part: any) => (
                    <li key={part.id} className="flex items-center justify-between">
                      <span>{part.name}</span>
                      <span>Qty: {part.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
