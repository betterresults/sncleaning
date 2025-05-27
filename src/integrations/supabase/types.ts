export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          access: string | null
          additional_details: string | null
          address: string | null
          agency: string | null
          booking_id: number | null
          booking_status: string | null
          carpet_items: string | null
          cleaner: number | null
          cleaner_pay: number | null
          cleaner_percentage: number | null
          cleaner_rate: number | null
          cleaning_cost_per_hour: number | null
          cleaning_cost_per_visit: string | null
          cleaning_time: number | null
          cleaning_type: string | null
          company: string | null
          cost_deduction: string | null
          coupon_code: string | null
          customer: number | null
          date_only: string | null
          date_submited: string | null
          date_time: string | null
          days: string | null
          days_number: string | null
          deposit: number | null
          edit_admin: string | null
          edit_client: string | null
          email: string | null
          end_date_time: string | null
          exclude_areas: string | null
          extras: string | null
          first_cleaning: string | null
          first_name: string | null
          form_name: string | null
          frequently: string | null
          frontly_id: number | null
          hours_required: number | null
          id: number
          invoice_id: string | null
          invoice_link: string | null
          invoice_term: number | null
          ironing: string | null
          ironing_hours: number | null
          key_collection: string | null
          last_name: string | null
          linens: string | null
          mattress_items: string | null
          occupied: string | null
          oven_size: string | null
          parking_details: string | null
          payment_method: string | null
          payment_status: string | null
          payment_term: string | null
          phone_number: string | null
          postcode: string | null
          property_details: string | null
          record_message: string | null
          remaining_days: string | null
          result_page: string | null
          steam_cleaning_cost: string | null
          time_only: string | null
          total_cost: number | null
          total_hours: number | null
          upholstery_items: string | null
          video_message: string | null
        }
        Insert: {
          access?: string | null
          additional_details?: string | null
          address?: string | null
          agency?: string | null
          booking_id?: number | null
          booking_status?: string | null
          carpet_items?: string | null
          cleaner?: number | null
          cleaner_pay?: number | null
          cleaner_percentage?: number | null
          cleaner_rate?: number | null
          cleaning_cost_per_hour?: number | null
          cleaning_cost_per_visit?: string | null
          cleaning_time?: number | null
          cleaning_type?: string | null
          company?: string | null
          cost_deduction?: string | null
          coupon_code?: string | null
          customer?: number | null
          date_only?: string | null
          date_submited?: string | null
          date_time?: string | null
          days?: string | null
          days_number?: string | null
          deposit?: number | null
          edit_admin?: string | null
          edit_client?: string | null
          email?: string | null
          end_date_time?: string | null
          exclude_areas?: string | null
          extras?: string | null
          first_cleaning?: string | null
          first_name?: string | null
          form_name?: string | null
          frequently?: string | null
          frontly_id?: number | null
          hours_required?: number | null
          id?: number
          invoice_id?: string | null
          invoice_link?: string | null
          invoice_term?: number | null
          ironing?: string | null
          ironing_hours?: number | null
          key_collection?: string | null
          last_name?: string | null
          linens?: string | null
          mattress_items?: string | null
          occupied?: string | null
          oven_size?: string | null
          parking_details?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_term?: string | null
          phone_number?: string | null
          postcode?: string | null
          property_details?: string | null
          record_message?: string | null
          remaining_days?: string | null
          result_page?: string | null
          steam_cleaning_cost?: string | null
          time_only?: string | null
          total_cost?: number | null
          total_hours?: number | null
          upholstery_items?: string | null
          video_message?: string | null
        }
        Update: {
          access?: string | null
          additional_details?: string | null
          address?: string | null
          agency?: string | null
          booking_id?: number | null
          booking_status?: string | null
          carpet_items?: string | null
          cleaner?: number | null
          cleaner_pay?: number | null
          cleaner_percentage?: number | null
          cleaner_rate?: number | null
          cleaning_cost_per_hour?: number | null
          cleaning_cost_per_visit?: string | null
          cleaning_time?: number | null
          cleaning_type?: string | null
          company?: string | null
          cost_deduction?: string | null
          coupon_code?: string | null
          customer?: number | null
          date_only?: string | null
          date_submited?: string | null
          date_time?: string | null
          days?: string | null
          days_number?: string | null
          deposit?: number | null
          edit_admin?: string | null
          edit_client?: string | null
          email?: string | null
          end_date_time?: string | null
          exclude_areas?: string | null
          extras?: string | null
          first_cleaning?: string | null
          first_name?: string | null
          form_name?: string | null
          frequently?: string | null
          frontly_id?: number | null
          hours_required?: number | null
          id?: number
          invoice_id?: string | null
          invoice_link?: string | null
          invoice_term?: number | null
          ironing?: string | null
          ironing_hours?: number | null
          key_collection?: string | null
          last_name?: string | null
          linens?: string | null
          mattress_items?: string | null
          occupied?: string | null
          oven_size?: string | null
          parking_details?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_term?: string | null
          phone_number?: string | null
          postcode?: string | null
          property_details?: string | null
          record_message?: string | null
          remaining_days?: string | null
          result_page?: string | null
          steam_cleaning_cost?: string | null
          time_only?: string | null
          total_cost?: number | null
          total_hours?: number | null
          upholstery_items?: string | null
          video_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cleaner_fkey"
            columns: ["cleaner"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["frontly_id"]
          },
          {
            foreignKeyName: "bookings_customer_fkey"
            columns: ["customer"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["frontly_id"]
          },
        ]
      }
      cleaners: {
        Row: {
          address: string | null
          cleans_number: number | null
          DBS: string | null
          DBS_date: string | null
          email: string | null
          first_name: string | null
          frontly_id: number | null
          full_name: string | null
          hourly_rate: number | null
          id: number
          ID: string | null
          last_name: string | null
          phone: number | null
          photo: string | null
          postcode: string | null
          presentage_rate: number | null
          rating: number | null
          reviews: number | null
          services: string | null
          years: number | null
        }
        Insert: {
          address?: string | null
          cleans_number?: number | null
          DBS?: string | null
          DBS_date?: string | null
          email?: string | null
          first_name?: string | null
          frontly_id?: number | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: number
          ID?: string | null
          last_name?: string | null
          phone?: number | null
          photo?: string | null
          postcode?: string | null
          presentage_rate?: number | null
          rating?: number | null
          reviews?: number | null
          services?: string | null
          years?: number | null
        }
        Update: {
          address?: string | null
          cleans_number?: number | null
          DBS?: string | null
          DBS_date?: string | null
          email?: string | null
          first_name?: string | null
          frontly_id?: number | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: number
          ID?: string | null
          last_name?: string | null
          phone?: number | null
          photo?: string | null
          postcode?: string | null
          presentage_rate?: number | null
          rating?: number | null
          reviews?: number | null
          services?: string | null
          years?: number | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          clent_type: string | null
          client_status: string | null
          company: string | null
          email: string | null
          first_name: string | null
          frontly_id: number | null
          full_name: string | null
          id: number
          image: string | null
          last_name: string | null
          phone: string | null
          postcode: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          clent_type?: string | null
          client_status?: string | null
          company?: string | null
          email?: string | null
          first_name?: string | null
          frontly_id?: number | null
          full_name?: string | null
          id?: number
          image?: string | null
          last_name?: string | null
          phone?: string | null
          postcode?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          clent_type?: string | null
          client_status?: string | null
          company?: string | null
          email?: string | null
          first_name?: string | null
          frontly_id?: number | null
          full_name?: string | null
          id?: number
          image?: string | null
          last_name?: string | null
          phone?: string | null
          postcode?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      "Past Bookings_Original": {
        Row: {
          access: string | null
          additional_details: string | null
          address: string | null
          agency: string | null
          booking_id: number | null
          booking_status: string | null
          carpet_items: string | null
          cleaner: number | null
          cleaner_pay: unknown | null
          cleaner_pay_status: string | null
          cleaning_cost_per_hour: string | null
          cleaning_cost_per_visit: string | null
          cleaning_time: string | null
          cleaning_type: string | null
          client_status: string | null
          client_type: string | null
          cost_deduction: string | null
          coupon_code: string | null
          customer: number | null
          date_only: string | null
          date_submited: string | null
          date_time: string | null
          days: string | null
          days_number: string | null
          deposit: string | null
          edit_admin: string | null
          email: string | null
          email_pay_status: string | null
          exclude_areas: string | null
          extras: string | null
          first_cleaning: string | null
          first_name: string | null
          form_name: string | null
          frequently: string | null
          hours_required: number | null
          id: number
          invoice_id: string | null
          invoice_link: string | null
          invoice_term: string | null
          ironing: string | null
          ironing_hours: number | null
          key_collection: string | null
          last_name: string | null
          linens: string | null
          mattress_items: string | null
          occupied: string | null
          oven_size: string | null
          parking_details: string | null
          payment_method: string | null
          payment_status: string | null
          payment_term: string | null
          phone_number: string | null
          photos: string | null
          postcode: string | null
          property_details: string | null
          record_message: string | null
          result_page: string | null
          steam_cleaning_cost: string | null
          terms: string | null
          total_cost: string | null
          total_hours: number | null
          upholstery_items: string | null
          video_message: string | null
        }
        Insert: {
          access?: string | null
          additional_details?: string | null
          address?: string | null
          agency?: string | null
          booking_id?: number | null
          booking_status?: string | null
          carpet_items?: string | null
          cleaner?: number | null
          cleaner_pay?: unknown | null
          cleaner_pay_status?: string | null
          cleaning_cost_per_hour?: string | null
          cleaning_cost_per_visit?: string | null
          cleaning_time?: string | null
          cleaning_type?: string | null
          client_status?: string | null
          client_type?: string | null
          cost_deduction?: string | null
          coupon_code?: string | null
          customer?: number | null
          date_only?: string | null
          date_submited?: string | null
          date_time?: string | null
          days?: string | null
          days_number?: string | null
          deposit?: string | null
          edit_admin?: string | null
          email?: string | null
          email_pay_status?: string | null
          exclude_areas?: string | null
          extras?: string | null
          first_cleaning?: string | null
          first_name?: string | null
          form_name?: string | null
          frequently?: string | null
          hours_required?: number | null
          id: number
          invoice_id?: string | null
          invoice_link?: string | null
          invoice_term?: string | null
          ironing?: string | null
          ironing_hours?: number | null
          key_collection?: string | null
          last_name?: string | null
          linens?: string | null
          mattress_items?: string | null
          occupied?: string | null
          oven_size?: string | null
          parking_details?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_term?: string | null
          phone_number?: string | null
          photos?: string | null
          postcode?: string | null
          property_details?: string | null
          record_message?: string | null
          result_page?: string | null
          steam_cleaning_cost?: string | null
          terms?: string | null
          total_cost?: string | null
          total_hours?: number | null
          upholstery_items?: string | null
          video_message?: string | null
        }
        Update: {
          access?: string | null
          additional_details?: string | null
          address?: string | null
          agency?: string | null
          booking_id?: number | null
          booking_status?: string | null
          carpet_items?: string | null
          cleaner?: number | null
          cleaner_pay?: unknown | null
          cleaner_pay_status?: string | null
          cleaning_cost_per_hour?: string | null
          cleaning_cost_per_visit?: string | null
          cleaning_time?: string | null
          cleaning_type?: string | null
          client_status?: string | null
          client_type?: string | null
          cost_deduction?: string | null
          coupon_code?: string | null
          customer?: number | null
          date_only?: string | null
          date_submited?: string | null
          date_time?: string | null
          days?: string | null
          days_number?: string | null
          deposit?: string | null
          edit_admin?: string | null
          email?: string | null
          email_pay_status?: string | null
          exclude_areas?: string | null
          extras?: string | null
          first_cleaning?: string | null
          first_name?: string | null
          form_name?: string | null
          frequently?: string | null
          hours_required?: number | null
          id?: number
          invoice_id?: string | null
          invoice_link?: string | null
          invoice_term?: string | null
          ironing?: string | null
          ironing_hours?: number | null
          key_collection?: string | null
          last_name?: string | null
          linens?: string | null
          mattress_items?: string | null
          occupied?: string | null
          oven_size?: string | null
          parking_details?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_term?: string | null
          phone_number?: string | null
          photos?: string | null
          postcode?: string | null
          property_details?: string | null
          record_message?: string | null
          result_page?: string | null
          steam_cleaning_cost?: string | null
          terms?: string | null
          total_cost?: string | null
          total_hours?: number | null
          upholstery_items?: string | null
          video_message?: string | null
        }
        Relationships: []
      }
      past_bookings: {
        Row: {
          access: string | null
          additional_details: string | null
          address: string | null
          agency: string | null
          booking_id: number | null
          booking_status: string | null
          carpet_items: string | null
          cleaner: number | null
          cleaner_pay: number | null
          cleaner_pay_status: string | null
          cleaning_cost_per_hour: string | null
          cleaning_cost_per_visit: string | null
          cleaning_time: string | null
          cleaning_type: string | null
          client_status: string | null
          client_type: string | null
          company: string | null
          cost_deduction: string | null
          coupon_code: string | null
          customer: number | null
          date_only: string | null
          date_submited: string | null
          date_time: string | null
          days: string | null
          days_number: string | null
          deposit: string | null
          edit_admin: string | null
          email: string | null
          exclude_areas: string | null
          extras: string | null
          first_cleaning: string | null
          first_name: string | null
          form_name: string | null
          frequently: string | null
          frontly_id: number | null
          hours_required: number | null
          id: number
          invoice_id: string | null
          invoice_link: string | null
          invoice_term: string | null
          ironing: string | null
          ironing_hours: number | null
          key_collection: string | null
          last_name: string | null
          linens: string | null
          mattress_items: string | null
          occupied: string | null
          oven_size: string | null
          parking_details: string | null
          payment_method: string | null
          payment_status: string | null
          payment_term: string | null
          phone_number: string | null
          photos: string | null
          postcode: string | null
          property_details: string | null
          record_message: string | null
          result_page: string | null
          steam_cleaning_cost: string | null
          terms: string | null
          total_cost: string | null
          total_hours: number | null
          upholstery_items: string | null
          video_message: string | null
        }
        Insert: {
          access?: string | null
          additional_details?: string | null
          address?: string | null
          agency?: string | null
          booking_id?: number | null
          booking_status?: string | null
          carpet_items?: string | null
          cleaner?: number | null
          cleaner_pay?: number | null
          cleaner_pay_status?: string | null
          cleaning_cost_per_hour?: string | null
          cleaning_cost_per_visit?: string | null
          cleaning_time?: string | null
          cleaning_type?: string | null
          client_status?: string | null
          client_type?: string | null
          company?: string | null
          cost_deduction?: string | null
          coupon_code?: string | null
          customer?: number | null
          date_only?: string | null
          date_submited?: string | null
          date_time?: string | null
          days?: string | null
          days_number?: string | null
          deposit?: string | null
          edit_admin?: string | null
          email?: string | null
          exclude_areas?: string | null
          extras?: string | null
          first_cleaning?: string | null
          first_name?: string | null
          form_name?: string | null
          frequently?: string | null
          frontly_id?: number | null
          hours_required?: number | null
          id: number
          invoice_id?: string | null
          invoice_link?: string | null
          invoice_term?: string | null
          ironing?: string | null
          ironing_hours?: number | null
          key_collection?: string | null
          last_name?: string | null
          linens?: string | null
          mattress_items?: string | null
          occupied?: string | null
          oven_size?: string | null
          parking_details?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_term?: string | null
          phone_number?: string | null
          photos?: string | null
          postcode?: string | null
          property_details?: string | null
          record_message?: string | null
          result_page?: string | null
          steam_cleaning_cost?: string | null
          terms?: string | null
          total_cost?: string | null
          total_hours?: number | null
          upholstery_items?: string | null
          video_message?: string | null
        }
        Update: {
          access?: string | null
          additional_details?: string | null
          address?: string | null
          agency?: string | null
          booking_id?: number | null
          booking_status?: string | null
          carpet_items?: string | null
          cleaner?: number | null
          cleaner_pay?: number | null
          cleaner_pay_status?: string | null
          cleaning_cost_per_hour?: string | null
          cleaning_cost_per_visit?: string | null
          cleaning_time?: string | null
          cleaning_type?: string | null
          client_status?: string | null
          client_type?: string | null
          company?: string | null
          cost_deduction?: string | null
          coupon_code?: string | null
          customer?: number | null
          date_only?: string | null
          date_submited?: string | null
          date_time?: string | null
          days?: string | null
          days_number?: string | null
          deposit?: string | null
          edit_admin?: string | null
          email?: string | null
          exclude_areas?: string | null
          extras?: string | null
          first_cleaning?: string | null
          first_name?: string | null
          form_name?: string | null
          frequently?: string | null
          frontly_id?: number | null
          hours_required?: number | null
          id?: number
          invoice_id?: string | null
          invoice_link?: string | null
          invoice_term?: string | null
          ironing?: string | null
          ironing_hours?: number | null
          key_collection?: string | null
          last_name?: string | null
          linens?: string | null
          mattress_items?: string | null
          occupied?: string | null
          oven_size?: string | null
          parking_details?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_term?: string | null
          phone_number?: string | null
          photos?: string | null
          postcode?: string | null
          property_details?: string | null
          record_message?: string | null
          result_page?: string | null
          steam_cleaning_cost?: string | null
          terms?: string | null
          total_cost?: string | null
          total_hours?: number | null
          upholstery_items?: string | null
          video_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "past_bookings_cleaner_fkey"
            columns: ["cleaner"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["frontly_id"]
          },
          {
            foreignKeyName: "past_bookings_customer_fkey"
            columns: ["customer"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["frontly_id"]
          },
        ]
      }
      profiles: {
        Row: {
          cleaner_id: number | null
          created_at: string | null
          customer_id: number | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cleaner_id?: number | null
          created_at?: string | null
          customer_id?: number | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cleaner_id?: number | null
          created_at?: string | null
          customer_id?: number | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_cleaner"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profiles_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: number
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: number
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
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      create_bi_weekly_cleaning_bookings_within_30_days: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_monthly_cleaning_bookings_within_30_days: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_weekly_cleaning_bookings_within_30_days: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
      move_past_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_permission:
        | "bookings.read"
        | "bookings.write"
        | "bookings.delete"
        | "customers.read"
        | "customers.write"
        | "cleaners.read"
        | "cleaners.write"
        | "admin.access"
      app_role: "admin" | "user" | "guest"
      user_role: "admin" | "user" | "guest"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_permission: [
        "bookings.read",
        "bookings.write",
        "bookings.delete",
        "customers.read",
        "customers.write",
        "cleaners.read",
        "cleaners.write",
        "admin.access",
      ],
      app_role: ["admin", "user", "guest"],
      user_role: ["admin", "user", "guest"],
    },
  },
} as const
