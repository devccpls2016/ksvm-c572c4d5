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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          access_districts: string[]
          access_scope: string
          access_talukas: string[]
          access_villages: string[]
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          mobile: string | null
        }
        Insert: {
          access_districts?: string[]
          access_scope?: string
          access_talukas?: string[]
          access_villages?: string[]
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          mobile?: string | null
        }
        Update: {
          access_districts?: string[]
          access_scope?: string
          access_talukas?: string[]
          access_villages?: string[]
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          mobile?: string | null
        }
        Relationships: []
      }
      surveys: {
        Row: {
          age: number | null
          benefits_info: Json
          community: string | null
          created_at: string
          created_by: string | null
          crops: Json | null
          district: string | null
          dob: string | null
          dryland_area: string | null
          education: string | null
          employment_info: Json
          farm_management: Json
          farming_tools: string[] | null
          farming_tools_details: Json
          gender: string | null
          gharkul_received: boolean | null
          gharkul_wanted: boolean | null
          has_farmland: boolean | null
          has_position: boolean | null
          head_name: string
          head_photo_url: string | null
          house_type: string | null
          household_item_counts: Json | null
          household_items: string[] | null
          id: string
          irrigated_area: string | null
          irrigation_details: Json
          irrigation_sources: string[] | null
          kharif_area: string | null
          living_status: string | null
          major_crop_types: string[] | null
          major_crop_types_other: string | null
          marital_status: string | null
          marriage_type: string | null
          maternal_family: Json | null
          members: Json | null
          mobile: string | null
          occupation: string | null
          owns_house: boolean | null
          permanent_address: Json | null
          pincode: string | null
          position_data: Json | null
          rabi_area: string | null
          solar_panel_installed: boolean | null
          solar_panel_wanted: boolean | null
          spouse_caste: string | null
          summer_area: string | null
          taluka: string | null
          total_farmland: string | null
          updated_at: string
          updated_by: string | null
          village: string
        }
        Insert: {
          age?: number | null
          benefits_info?: Json
          community?: string | null
          created_at?: string
          created_by?: string | null
          crops?: Json | null
          district?: string | null
          dob?: string | null
          dryland_area?: string | null
          education?: string | null
          employment_info?: Json
          farm_management?: Json
          farming_tools?: string[] | null
          farming_tools_details?: Json
          gender?: string | null
          gharkul_received?: boolean | null
          gharkul_wanted?: boolean | null
          has_farmland?: boolean | null
          has_position?: boolean | null
          head_name: string
          head_photo_url?: string | null
          house_type?: string | null
          household_item_counts?: Json | null
          household_items?: string[] | null
          id?: string
          irrigated_area?: string | null
          irrigation_details?: Json
          irrigation_sources?: string[] | null
          kharif_area?: string | null
          living_status?: string | null
          major_crop_types?: string[] | null
          major_crop_types_other?: string | null
          marital_status?: string | null
          marriage_type?: string | null
          maternal_family?: Json | null
          members?: Json | null
          mobile?: string | null
          occupation?: string | null
          owns_house?: boolean | null
          permanent_address?: Json | null
          pincode?: string | null
          position_data?: Json | null
          rabi_area?: string | null
          solar_panel_installed?: boolean | null
          solar_panel_wanted?: boolean | null
          spouse_caste?: string | null
          summer_area?: string | null
          taluka?: string | null
          total_farmland?: string | null
          updated_at?: string
          updated_by?: string | null
          village: string
        }
        Update: {
          age?: number | null
          benefits_info?: Json
          community?: string | null
          created_at?: string
          created_by?: string | null
          crops?: Json | null
          district?: string | null
          dob?: string | null
          dryland_area?: string | null
          education?: string | null
          employment_info?: Json
          farm_management?: Json
          farming_tools?: string[] | null
          farming_tools_details?: Json
          gender?: string | null
          gharkul_received?: boolean | null
          gharkul_wanted?: boolean | null
          has_farmland?: boolean | null
          has_position?: boolean | null
          head_name?: string
          head_photo_url?: string | null
          house_type?: string | null
          household_item_counts?: Json | null
          household_items?: string[] | null
          id?: string
          irrigated_area?: string | null
          irrigation_details?: Json
          irrigation_sources?: string[] | null
          kharif_area?: string | null
          living_status?: string | null
          major_crop_types?: string[] | null
          major_crop_types_other?: string | null
          marital_status?: string | null
          marriage_type?: string | null
          maternal_family?: Json | null
          members?: Json | null
          mobile?: string | null
          occupation?: string | null
          owns_house?: boolean | null
          permanent_address?: Json | null
          pincode?: string | null
          position_data?: Json | null
          rabi_area?: string | null
          solar_panel_installed?: boolean | null
          solar_panel_wanted?: boolean | null
          spouse_caste?: string | null
          summer_area?: string | null
          taluka?: string | null
          total_farmland?: string | null
          updated_at?: string
          updated_by?: string | null
          village?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      survey_in_user_scope: {
        Args: {
          _district: string
          _taluka: string
          _user_id: string
          _village: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "surveyor"
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
    Enums: {
      app_role: ["admin", "surveyor"],
    },
  },
} as const
