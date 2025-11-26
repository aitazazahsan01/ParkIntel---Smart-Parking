export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      parking_sessions: {
        Row: {
          check_in_time: string
          check_out_time: string | null
          created_at: string
          fee_charged: number | null
          id: number
          lot_id: number
          plate_number: string
          spot_id: number | null
          status: string | null
        }
        Insert: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          fee_charged?: number | null
          id?: number
          lot_id: number
          plate_number: string
          spot_id?: number | null
          status?: string | null
        }
        Update: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          fee_charged?: number | null
          id?: number
          lot_id?: number
          plate_number?: string
          spot_id?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parking_sessions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "ParkingLots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parking_sessions_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_spots: {
        Row: {
          created_at: string
          current_plate: string | null
          id: number
          is_occupied: boolean | null
          label: string
          lot_id: number
          rotation: number | null
          x_coord: number
          y_coord: number
        }
        Insert: {
          created_at?: string
          current_plate?: string | null
          id?: number
          is_occupied?: boolean | null
          label: string
          lot_id: number
          rotation?: number | null
          x_coord?: number
          y_coord?: number
        }
        Update: {
          created_at?: string
          current_plate?: string | null
          id?: number
          is_occupied?: boolean | null
          label?: string
          lot_id?: number
          rotation?: number | null
          x_coord?: number
          y_coord?: number
        }
        Relationships: [
          {
            foreignKeyName: "parking_spots_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "ParkingLots"
            referencedColumns: ["id"]
          },
        ]
      }
      ParkingLots: {
        Row: {
          address: string | null
          base_price: number
          capacity: number
          id: number
          lat: number
          lng: number
          name: string | null
        }
        Insert: {
          address?: string | null
          base_price: number
          capacity: number
          id?: number
          lat: number
          lng: number
          name?: string | null
        }
        Update: {
          address?: string | null
          base_price?: number
          capacity?: number
          id?: number
          lat?: number
          lng?: number
          name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_verified: boolean | null
          assigned_lot_id: number | null
          email: string | null
          full_name: string | null
          has_password: boolean | null
          id: string
          last_password_change: string | null
          password_hash: string | null
          role: string
          username: string | null
        }
        Insert: {
          account_verified?: boolean | null
          assigned_lot_id?: number | null
          email?: string | null
          full_name?: string | null
          has_password?: boolean | null
          id: string
          last_password_change?: string | null
          password_hash?: string | null
          role: string
          username?: string | null
        }
        Update: {
          account_verified?: boolean | null
          assigned_lot_id?: number | null
          email?: string | null
          full_name?: string | null
          has_password?: boolean | null
          id?: string
          last_password_change?: string | null
          password_hash?: string | null
          role?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_assigned_lot_id_fkey"
            columns: ["assigned_lot_id"]
            isOneToOne: false
            referencedRelation: "ParkingLots"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_username_available: {
        Args: { p_username: string }
        Returns: boolean
      }
      cleanup_expired_sessions: { Args: never; Returns: number }
      create_user_session: {
        Args: {
          p_expires_in_hours?: number
          p_ip_address?: unknown
          p_session_token: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: Json
      }
      logout_session: { Args: { p_session_token: string }; Returns: Json }
      set_user_password: {
        Args: { p_password_hash: string; p_user_id: string }
        Returns: Json
      }
      update_username: {
        Args: { p_user_id: string; p_username: string }
        Returns: Json
      }
      validate_session: { Args: { p_session_token: string }; Returns: Json }
      verify_login_credentials: {
        Args: { p_password_hash: string; p_username: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
