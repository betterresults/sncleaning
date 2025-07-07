export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address: string
          created_at: string
          customer_id: number
          deatails: string | null
          id: string
          is_default: boolean | null
          postcode: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          customer_id: number
          deatails?: string | null
          id?: string
          is_default?: boolean | null
          postcode: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          customer_id?: number
          deatails?: string | null
          id?: string
          is_default?: boolean | null
          postcode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_addresses_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
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
          same_day: boolean | null
          service_type: string | null
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
          same_day?: boolean | null
          service_type?: string | null
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
          same_day?: boolean | null
          service_type?: string | null
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
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_fkey"
            columns: ["customer"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          created_at: string
          edited_at: string | null
          file_url: string | null
          id: string
          is_deleted: boolean
          is_read: boolean
          message: string
          message_type: Database["public"]["Enums"]["message_type"]
          sender_id: number
          sender_type: Database["public"]["Enums"]["sender_type"]
        }
        Insert: {
          chat_id: string
          created_at?: string
          edited_at?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean
          is_read?: boolean
          message: string
          message_type?: Database["public"]["Enums"]["message_type"]
          sender_id: number
          sender_type: Database["public"]["Enums"]["sender_type"]
        }
        Update: {
          chat_id?: string
          created_at?: string
          edited_at?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean
          is_read?: boolean
          message?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          sender_id?: number
          sender_type?: Database["public"]["Enums"]["sender_type"]
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          booking_id: number | null
          chat_type: Database["public"]["Enums"]["chat_type"]
          cleaner_id: number | null
          created_at: string
          customer_id: number | null
          id: string
          is_active: boolean
          last_message_at: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: number | null
          chat_type: Database["public"]["Enums"]["chat_type"]
          cleaner_id?: number | null
          created_at?: string
          customer_id?: number | null
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: number | null
          chat_type?: Database["public"]["Enums"]["chat_type"]
          cleaner_id?: number | null
          created_at?: string
          customer_id?: number | null
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaner_tracking: {
        Row: {
          booking_id: number
          check_in_location: string | null
          check_in_time: string | null
          check_out_location: string | null
          check_out_time: string | null
          cleaner_id: number
          created_at: string
          id: string
          is_auto_checked_in: boolean | null
          is_auto_checked_out: boolean | null
          updated_at: string
          work_duration: unknown | null
        }
        Insert: {
          booking_id: number
          check_in_location?: string | null
          check_in_time?: string | null
          check_out_location?: string | null
          check_out_time?: string | null
          cleaner_id: number
          created_at?: string
          id?: string
          is_auto_checked_in?: boolean | null
          is_auto_checked_out?: boolean | null
          updated_at?: string
          work_duration?: unknown | null
        }
        Update: {
          booking_id?: number
          check_in_location?: string | null
          check_in_time?: string | null
          check_out_location?: string | null
          check_out_time?: string | null
          cleaner_id?: number
          created_at?: string
          id?: string
          is_auto_checked_in?: boolean | null
          is_auto_checked_out?: boolean | null
          updated_at?: string
          work_duration?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaner_tracking_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaner_tracking_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
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
      customer_payment_methods: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string
          customer_id: number
          id: string
          is_default: boolean | null
          stripe_customer_id: string
          stripe_payment_method_id: string
          updated_at: string
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          customer_id: number
          id?: string
          is_default?: boolean | null
          stripe_customer_id: string
          stripe_payment_method_id: string
          updated_at?: string
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          customer_id?: number
          id?: string
          is_default?: boolean | null
          stripe_customer_id?: string
          stripe_payment_method_id?: string
          updated_at?: string
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
          same_day: string | null
          service_type: string | null
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
          same_day?: string | null
          service_type?: string | null
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
          same_day?: string | null
          service_type?: string | null
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
      reviews: {
        Row: {
          created_at: string
          id: string
          past_booking_id: number
          rating: number
          review_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          past_booking_id: number
          rating: number
          review_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          past_booking_id?: number
          rating?: number
          review_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_past_booking_id_fkey"
            columns: ["past_booking_id"]
            isOneToOne: false
            referencedRelation: "past_bookings"
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
      sub_bookings: {
        Row: {
          cleaner_id: number
          cleaner_pay: number | null
          created_at: string | null
          hourly_rate: number | null
          hours_assigned: number | null
          id: number
          payment_method: string
          percentage_rate: number | null
          primary_booking_id: number
          updated_at: string | null
        }
        Insert: {
          cleaner_id: number
          cleaner_pay?: number | null
          created_at?: string | null
          hourly_rate?: number | null
          hours_assigned?: number | null
          id?: number
          payment_method: string
          percentage_rate?: number | null
          primary_booking_id: number
          updated_at?: string | null
        }
        Update: {
          cleaner_id?: number
          cleaner_pay?: number | null
          created_at?: string | null
          hourly_rate?: number | null
          hours_assigned?: number | null
          id?: number
          payment_method?: string
          percentage_rate?: number | null
          primary_booking_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_bookings_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_bookings_primary_booking_id_fkey"
            columns: ["primary_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      move_past_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      move_sub_bookings_to_past: {
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
      chat_type: "customer_office" | "customer_cleaner" | "office_cleaner"
      message_type: "text" | "image" | "file"
      sender_type: "customer" | "cleaner" | "admin"
      user_role: "admin" | "user" | "guest"
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
      chat_type: ["customer_office", "customer_cleaner", "office_cleaner"],
      message_type: ["text", "image", "file"],
      sender_type: ["customer", "cleaner", "admin"],
      user_role: ["admin", "user", "guest"],
    },
  },
} as const
