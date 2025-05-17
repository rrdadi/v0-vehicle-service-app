"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Trash2 } from "lucide-react"

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const fetchUserAndSessions = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        setUserId(user.id)

        // Fetch sessions
        const response = await fetch(`/api/auth/session?userId=${user.id}`)
        const data = await response.json()

        if (data.sessions) {
          setSessions(data.sessions)
        }
      } catch (error) {
        console.error("Error fetching sessions:", error)
        toast({
          title: "Error",
          description: "Failed to fetch active sessions",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndSessions()
  }, [supabase, toast])

  const handleDeleteSession = async (sessionId: string) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/auth/session?userId=${userId}&sessionId=${sessionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete session")
      }

      // Remove the session from the list
      setSessions(sessions.filter((session) => session.id !== sessionId))

      toast({
        title: "Session terminated",
        description: "The session has been terminated successfully",
      })
    } catch (error) {
      console.error("Error deleting session:", error)
      toast({
        title: "Error",
        description: "Failed to terminate session",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Active Sessions</h1>

      <Card>
        <CardHeader>
          <CardTitle>Manage Sessions</CardTitle>
          <CardDescription>View and manage your active sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p>No active sessions found.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">Session {index + 1}</p>
                    <p className="text-sm text-muted-foreground">
                      Last login: {new Date(session.lastLogin).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{session.userAgent}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteSession(session.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Terminate
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
