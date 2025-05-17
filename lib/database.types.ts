export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          name: string
          address: string
          email: string | null
          phone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          email?: string | null
          phone: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          email?: string | null
          phone?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
      parts_used: {
        Row: {
          id: string
          task_id: string
          name: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          name: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          name?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      service_records: {
        Row: {
          id: string
          vehicle_id: string
          mileage: number
          customer_concerns: string | null
          technician_observations: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          mileage: number
          customer_concerns?: string | null
          technician_observations?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          mileage?: number
          customer_concerns?: string | null
          technician_observations?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      task_assignments: {
        Row: {
          id: string
          task_id: string
          technician_id: string
          start_time: string | null
          end_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          technician_id: string
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          technician_id?: string
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          service_record_id: string
          description: string
          status: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_record_id: string
          description: string
          status?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_record_id?: string
          description?: string
          status?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      vehicle_history: {
        Row: {
          id: string
          vehicle_id: string
          previous_customer_id: string | null
          new_customer_id: string
          change_date: string
          notes: string | null
          created_by: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          previous_customer_id?: string | null
          new_customer_id: string
          change_date?: string
          notes?: string | null
          created_by: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          previous_customer_id?: string | null
          new_customer_id?: string
          change_date?: string
          notes?: string | null
          created_by?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          plate_number: string
          make: string
          model: string
          year: number
          customer_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plate_number: string
          make: string
          model: string
          year: number
          customer_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plate_number?: string
          make?: string
          model?: string
          year?: number
          customer_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
