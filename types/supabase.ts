export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ParkingLots: {
        Row: {
          id: number
          name: string | null
          address: string | null
          lat: number
          lng: number
          capacity: number
          base_price: number
        }
        Insert: {
          id?: number
          name?: string | null
          address?: string | null
          lat?: number
          lng?: number
          capacity: number
          base_price: number
        }
        Update: {
          id?: number
          name?: string | null
          address?: string | null
          lat?: number
          lng?: number
          capacity?: number
          base_price?: number
        }
      }
      parking_spots: {
        Row: {
          id: number
          created_at: string
          lot_id: number
          label: string
          is_occupied: boolean | null
          current_plate: string | null
          x_coord: number
          y_coord: number
          rotation: number
        }
        Insert: {
          id?: number
          created_at?: string
          lot_id: number
          label: string
          is_occupied?: boolean | null
          current_plate?: string | null
          x_coord?: number
          y_coord?: number
          rotation?: number
        }
        Update: {
          id?: number
          created_at?: string
          lot_id?: number
          label?: string
          is_occupied?: boolean | null
          current_plate?: string | null
          x_coord?: number
          y_coord?: number
          rotation?: number
        }
      }
      parking_sessions: {
        Row: {
          id: number
          created_at: string
          lot_id: number
          spot_id: number | null
          plate_number: string
          check_in_time: string
          check_out_time: string | null
          fee_charged: number | null
          status: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          lot_id: number
          spot_id?: number | null
          plate_number: string
          check_in_time?: string
          check_out_time?: string | null
          fee_charged?: number | null
          status?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          lot_id?: number
          spot_id?: number | null
          plate_number?: string
          check_in_time?: string
          check_out_time?: string | null
          fee_charged?: number | null
          status?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          role: 'driver' | 'owner' | 'operator'
          full_name: string | null
          assigned_lot_id: number | null
        }
        Insert: {
          id: string
          email?: string | null
          role: 'driver' | 'owner' | 'operator'
          full_name?: string | null
          assigned_lot_id?: number | null
        }
        Update: {
          id?: string
          email?: string | null
          role?: 'driver' | 'owner' | 'operator'
          full_name?: string | null
          assigned_lot_id?: number | null
        }
      }
    }
  }
}