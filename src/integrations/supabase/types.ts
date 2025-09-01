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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      addresses: {
        Row: {
          access: string | null
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
          access?: string | null
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
          access?: string | null
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
          has_photos: boolean | null
          hours_required: number | null
          id: number
          invoice_id: string | null
          invoice_link: string | null
          invoice_term: number | null
          ironing: string | null
          ironing_hours: number | null
          key_collection: string | null
          last_name: string | null
          linen_management: boolean | null
          linen_used: Json | null
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
          recurring_group_id: string | null
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
          has_photos?: boolean | null
          hours_required?: number | null
          id?: number
          invoice_id?: string | null
          invoice_link?: string | null
          invoice_term?: number | null
          ironing?: string | null
          ironing_hours?: number | null
          key_collection?: string | null
          last_name?: string | null
          linen_management?: boolean | null
          linen_used?: Json | null
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
          recurring_group_id?: string | null
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
          has_photos?: boolean | null
          hours_required?: number | null
          id?: number
          invoice_id?: string | null
          invoice_link?: string | null
          invoice_term?: number | null
          ironing?: string | null
          ironing_hours?: number | null
          key_collection?: string | null
          last_name?: string | null
          linen_management?: boolean | null
          linen_used?: Json | null
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
          recurring_group_id?: string | null
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
      cleaner_recurring_rates: {
        Row: {
          cleaner_id: number
          created_at: string
          custom_hourly_rate: number | null
          custom_percentage_rate: number | null
          id: string
          recurring_group_id: string
          updated_at: string
        }
        Insert: {
          cleaner_id: number
          created_at?: string
          custom_hourly_rate?: number | null
          custom_percentage_rate?: number | null
          id?: string
          recurring_group_id: string
          updated_at?: string
        }
        Update: {
          cleaner_id?: number
          created_at?: string
          custom_hourly_rate?: number | null
          custom_percentage_rate?: number | null
          id?: string
          recurring_group_id?: string
          updated_at?: string
        }
        Relationships: []
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
      cleaning_photos: {
        Row: {
          booking_date: string
          booking_id: number
          caption: string | null
          cleaner_id: number
          created_at: string
          customer_id: number
          damage_details: string | null
          file_path: string
          id: string
          photo_type: string
          postcode: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_id: number
          caption?: string | null
          cleaner_id: number
          created_at?: string
          customer_id: number
          damage_details?: string | null
          file_path: string
          id?: string
          photo_type: string
          postcode: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_id?: number
          caption?: string | null
          cleaner_id?: number
          created_at?: string
          customer_id?: number
          damage_details?: string | null
          file_path?: string
          id?: string
          photo_type?: string
          postcode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_photos_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_photos_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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
      customer_pricing_overrides: {
        Row: {
          created_at: string
          customer_id: number
          id: string
          override_formula_config: Json | null
          override_rate: number | null
          service_type: string
          sub_service_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: number
          id?: string
          override_formula_config?: Json | null
          override_rate?: number | null
          service_type: string
          sub_service_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: number
          id?: string
          override_formula_config?: Json | null
          override_rate?: number | null
          service_type?: string
          sub_service_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_pricing_overrides_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          clent_type: string | null
          client_status: string | null
          company: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          google_review: string | null
          id: number
          image: string | null
          last_name: string | null
          phone: string | null
          whatsapp: string | null
        }
        Insert: {
          clent_type?: string | null
          client_status?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          google_review?: string | null
          id?: number
          image?: string | null
          last_name?: string | null
          phone?: string | null
          whatsapp?: string | null
        }
        Update: {
          clent_type?: string | null
          client_status?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          google_review?: string | null
          id?: number
          image?: string | null
          last_name?: string | null
          phone?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      linen_inventory: {
        Row: {
          address_id: string
          clean_quantity: number
          customer_id: number
          dirty_quantity: number
          id: string
          in_use_quantity: number
          last_updated: string
          product_id: string
        }
        Insert: {
          address_id: string
          clean_quantity?: number
          customer_id: number
          dirty_quantity?: number
          id?: string
          in_use_quantity?: number
          last_updated?: string
          product_id: string
        }
        Update: {
          address_id?: string
          clean_quantity?: number
          customer_id?: number
          dirty_quantity?: number
          id?: string
          in_use_quantity?: number
          last_updated?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linen_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "linen_products"
            referencedColumns: ["id"]
          },
        ]
      }
      linen_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "linen_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "linen_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linen_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "linen_products"
            referencedColumns: ["id"]
          },
        ]
      }
      linen_orders: {
        Row: {
          address_id: string
          admin_cost: number | null
          created_at: string
          customer_id: number
          delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          payment_method: string | null
          payment_status: string | null
          pickup_date: string | null
          status: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          address_id: string
          admin_cost?: number | null
          created_at?: string
          customer_id: number
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_method?: string | null
          payment_status?: string | null
          pickup_date?: string | null
          status?: string
          total_cost?: number
          updated_at?: string
        }
        Update: {
          address_id?: string
          admin_cost?: number | null
          created_at?: string
          customer_id?: number
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_method?: string | null
          payment_status?: string | null
          pickup_date?: string | null
          status?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      linen_products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          items_included: string | null
          name: string
          price: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          items_included?: string | null
          name: string
          price?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          items_included?: string | null
          name?: string
          price?: number
          type?: string
          updated_at?: string
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
          has_photos: boolean | null
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
          has_photos?: boolean | null
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
          has_photos?: boolean | null
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
        ]
      }
      photo_completion_notifications: {
        Row: {
          booking_id: number
          chat_message_sent: boolean
          created_at: string
          email_sent: boolean
          id: string
          notification_sent_at: string
        }
        Insert: {
          booking_id: number
          chat_message_sent?: boolean
          created_at?: string
          email_sent?: boolean
          id?: string
          notification_sent_at?: string
        }
        Update: {
          booking_id?: number
          chat_message_sent?: boolean
          created_at?: string
          email_sent?: boolean
          id?: string
          notification_sent_at?: string
        }
        Relationships: []
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
      recurring_services: {
        Row: {
          address: string | null
          cleaner: number | null
          cleaner_rate: number | null
          cleaning_type: string | null
          cost_per_hour: number | null
          created_at: string
          customer: number | null
          days_of_the_week: string | null
          frequently: string | null
          hours: string | null
          id: number
          interval: string | null
          last_generated_date: string | null
          payment_method: string | null
          postponed: boolean | null
          recurring_group_id: string | null
          start_date: string | null
          start_time: string | null
          total_cost: number | null
          was_created_until: string | null
        }
        Insert: {
          address?: string | null
          cleaner?: number | null
          cleaner_rate?: number | null
          cleaning_type?: string | null
          cost_per_hour?: number | null
          created_at?: string
          customer?: number | null
          days_of_the_week?: string | null
          frequently?: string | null
          hours?: string | null
          id?: number
          interval?: string | null
          last_generated_date?: string | null
          payment_method?: string | null
          postponed?: boolean | null
          recurring_group_id?: string | null
          start_date?: string | null
          start_time?: string | null
          total_cost?: number | null
          was_created_until?: string | null
        }
        Update: {
          address?: string | null
          cleaner?: number | null
          cleaner_rate?: number | null
          cleaning_type?: string | null
          cost_per_hour?: number | null
          created_at?: string
          customer?: number | null
          days_of_the_week?: string | null
          frequently?: string | null
          hours?: string | null
          id?: number
          interval?: string | null
          last_generated_date?: string | null
          payment_method?: string | null
          postponed?: boolean | null
          recurring_group_id?: string | null
          start_date?: string | null
          start_time?: string | null
          total_cost?: number | null
          was_created_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_services_address_fkey"
            columns: ["address"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_services_cleaner_fkey"
            columns: ["cleaner"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_services_customer_fkey"
            columns: ["customer"]
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
      service_pricing_formulas: {
        Row: {
          base_hourly_rate: number | null
          created_at: string
          formula_config: Json
          formula_name: string
          id: string
          is_active: boolean | null
          service_type: string
          sub_service_type: string | null
          updated_at: string
        }
        Insert: {
          base_hourly_rate?: number | null
          created_at?: string
          formula_config: Json
          formula_name: string
          id?: string
          is_active?: boolean | null
          service_type: string
          sub_service_type?: string | null
          updated_at?: string
        }
        Update: {
          base_hourly_rate?: number | null
          created_at?: string
          formula_config?: Json
          formula_name?: string
          id?: string
          is_active?: boolean | null
          service_type?: string
          sub_service_type?: string | null
          updated_at?: string
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
          created: string
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created?: string
          id?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created?: string
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
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
      generate_recurring_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: string
      }
      log_activity: {
        Args: {
          p_action_type: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type?: string
          p_user_id: string
        }
        Returns: undefined
      }
      move_sub_bookings_to_past: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      move_to_past_bookings_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_sample_activity_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_generate_recurring_bookings: {
        Args: Record<PropertyKey, never>
        Returns: {
          address_found: boolean
          booking_date: string
          calculated_start: string
          created: boolean
          day_check: string
          day_name: string
          days_of_week: string
          error_msg: string
          service_id: number
          start_date: string
        }[]
      }
      test_stripe_webhook_sync: {
        Args: { p_customer_email: string }
        Returns: Json
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
