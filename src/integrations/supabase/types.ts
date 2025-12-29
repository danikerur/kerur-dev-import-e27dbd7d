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
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_images: {
        Row: {
          category_id: string | null
          created_at: string | null
          group_tag: string | null
          id: string
          image_url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          group_tag?: string | null
          id?: string
          image_url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          group_tag?: string | null
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_images_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_order: {
        Row: {
          created_at: string
          customer_id: string
          expected_delivery_date: string | null
          id: string
          notes: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_order_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_order_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_orders"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_order_items: {
        Row: {
          id: string
          order_id: string
          product_name: string
          qty: number
          total_price: number | null
          unit_price: number
          variant: string | null
          variant_id: string | null
        }
        Insert: {
          id?: string
          order_id: string
          product_name: string
          qty: number
          total_price?: number | null
          unit_price?: number
          variant?: string | null
          variant_id?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          product_name?: string
          qty?: number
          total_price?: number | null
          unit_price?: number
          variant?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "customer_order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_customer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "v_inventory"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string
          city: string | null
          created_at: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          phone: string
          product_id: string | null
          product_specifications: Json | null
          products: Json | null
          updated_at: string | null
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          phone: string
          product_id?: string | null
          product_specifications?: Json | null
          products?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          phone?: string
          product_id?: string | null
          product_specifications?: Json | null
          products?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory"
            referencedColumns: ["product_id"]
          },
        ]
      }
      deliveries: {
        Row: {
          created_at: string | null
          delivery_date: string | null
          driver_id: string | null
          id: string
          status: Database["public"]["Enums"]["delivery_status"] | null
        }
        Insert: {
          created_at?: string | null
          delivery_date?: string | null
          driver_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["delivery_status"] | null
        }
        Update: {
          created_at?: string | null
          delivery_date?: string | null
          driver_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["delivery_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_customers: {
        Row: {
          address: string
          created_at: string | null
          customer_id: string | null
          delivery_id: string | null
          delivery_price: number | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          order: number | null
        }
        Insert: {
          address: string
          created_at?: string | null
          customer_id?: string | null
          delivery_id?: string | null
          delivery_price?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          order?: number | null
        }
        Update: {
          address?: string
          created_at?: string | null
          customer_id?: string | null
          delivery_id?: string | null
          delivery_price?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_orders"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "delivery_customers_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_products: {
        Row: {
          created_at: string | null
          delivery_customer_id: string | null
          dimension_index: number | null
          id: string
          product_id: string | null
          product_size: Json | null
          quantity: number
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_customer_id?: string | null
          dimension_index?: number | null
          id?: string
          product_id?: string | null
          product_size?: Json | null
          quantity: number
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_customer_id?: string | null
          dimension_index?: number | null
          id?: string
          product_id?: string | null
          product_size?: Json | null
          quantity?: number
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_products_delivery_customer_id_fkey"
            columns: ["delivery_customer_id"]
            isOneToOne: false
            referencedRelation: "delivery_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "delivery_products_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
        }
        Relationships: []
      }
      inventory_balances: {
        Row: {
          on_hand: number
          on_order_from_supplier: number
          reserved_for_customers: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          on_hand?: number
          on_order_from_supplier?: number
          reserved_for_customers?: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          on_hand?: number
          on_order_from_supplier?: number
          reserved_for_customers?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_balances_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: true
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_balances_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: true
            referencedRelation: "v_inventory"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      leads: {
        Row: {
          business_name: string | null
          call_summary: string | null
          city: string | null
          created_at: string
          customer_name: string | null
          id: string
          inquiry_date: string
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          call_summary?: string | null
          city?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          inquiry_date?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          call_summary?: string | null
          city?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          inquiry_date?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string
          height: number | null
          id: string
          is_active: boolean
          length: number | null
          model: string | null
          product_id: string
          size_label: string
          sku: string | null
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          is_active?: boolean
          length?: number | null
          model?: string | null
          product_id: string
          size_label: string
          sku?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          is_active?: boolean
          length?: number | null
          model?: string | null
          product_id?: string
          size_label?: string
          sku?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory"
            referencedColumns: ["product_id"]
          },
        ]
      }
      product_variations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          price: number | null
          product_id: string | null
          stock: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          price?: number | null
          product_id?: string | null
          stock?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          price?: number | null
          product_id?: string | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory"
            referencedColumns: ["product_id"]
          },
        ]
      }
      products: {
        Row: {
          catalog_order: number | null
          catalog_visible: boolean | null
          category_id: string | null
          created_at: string | null
          description: string | null
          dimensions: Json | null
          id: string
          image_url: string | null
          is_visible_in_catalog: boolean | null
          model: string | null
          name: string
          options_type: string | null
          product_code: string | null
          specifications: Json | null
          supplier: string | null
          supplier_id: string | null
          tag: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          catalog_order?: number | null
          catalog_visible?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          image_url?: string | null
          is_visible_in_catalog?: boolean | null
          model?: string | null
          name: string
          options_type?: string | null
          product_code?: string | null
          specifications?: Json | null
          supplier?: string | null
          supplier_id?: string | null
          tag?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          catalog_order?: number | null
          catalog_visible?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          image_url?: string | null
          is_visible_in_catalog?: boolean | null
          model?: string | null
          name?: string
          options_type?: string | null
          product_code?: string | null
          specifications?: Json | null
          supplier?: string | null
          supplier_id?: string | null
          tag?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      products_backup: {
        Row: {
          catalog_order: number | null
          catalog_visible: boolean | null
          category_id: string | null
          created_at: string | null
          description: string | null
          dimensions: Json | null
          id: string | null
          image_url: string | null
          is_visible_in_catalog: boolean | null
          model: string | null
          name: string | null
          product_code: string | null
          specifications: Json | null
          supplier: string | null
          supplier_id: string | null
          tag: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          catalog_order?: number | null
          catalog_visible?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string | null
          image_url?: string | null
          is_visible_in_catalog?: boolean | null
          model?: string | null
          name?: string | null
          product_code?: string | null
          specifications?: Json | null
          supplier?: string | null
          supplier_id?: string | null
          tag?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          catalog_order?: number | null
          catalog_visible?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string | null
          image_url?: string | null
          is_visible_in_catalog?: boolean | null
          model?: string | null
          name?: string | null
          product_code?: string | null
          specifications?: Json | null
          supplier?: string | null
          supplier_id?: string | null
          tag?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quick_quote_products: {
        Row: {
          free_text: string | null
          id: string
          is_text_row: boolean | null
          product_id: string | null
          quantity: number
          quote_id: string | null
          selected_dimension: Json | null
          total_price: number
          unit_price: number
        }
        Insert: {
          free_text?: string | null
          id?: string
          is_text_row?: boolean | null
          product_id?: string | null
          quantity: number
          quote_id?: string | null
          selected_dimension?: Json | null
          total_price: number
          unit_price: number
        }
        Update: {
          free_text?: string | null
          id?: string
          is_text_row?: boolean | null
          product_id?: string | null
          quantity?: number
          quote_id?: string | null
          selected_dimension?: Json | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quick_quote_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_quote_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "quick_quote_products_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quick_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_quotes: {
        Row: {
          client_address: string | null
          client_name: string
          client_phone: string | null
          created_at: string | null
          id: string
          pdf_url: string | null
          quote_number: number | null
          total_price: number | null
          total_price_with_vat: number | null
          vat_number: string | null
        }
        Insert: {
          client_address?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          id?: string
          pdf_url?: string | null
          quote_number?: number | null
          total_price?: number | null
          total_price_with_vat?: number | null
          vat_number?: string | null
        }
        Update: {
          client_address?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          id?: string
          pdf_url?: string | null
          quote_number?: number | null
          total_price?: number | null
          total_price_with_vat?: number | null
          vat_number?: string | null
        }
        Relationships: []
      }
      supplier_order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          selected_dimension: Json | null
          version_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity: number
          selected_dimension?: Json | null
          version_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          selected_dimension?: Json | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "supplier_order_items_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "supplier_order_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_order_versions: {
        Row: {
          comment: string | null
          created_at: string | null
          created_by: string | null
          id: string
          order_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          order_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_order_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_order_versions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_orders: {
        Row: {
          created_at: string | null
          id: string
          order_number: number | null
          supplier_id: string | null
          supplier_order_number: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_number?: number | null
          supplier_id?: string | null
          supplier_order_number?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_number?: number | null
          supplier_id?: string | null
          supplier_order_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_shipment_statuses: {
        Row: {
          completed_at: string | null
          description: string | null
          id: string
          shipment_id: string | null
          source: string | null
          status: string | null
          step_number: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          description?: string | null
          id?: string
          shipment_id?: string | null
          source?: string | null
          status?: string | null
          step_number?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          description?: string | null
          id?: string
          shipment_id?: string | null
          source?: string | null
          status?: string | null
          step_number?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_shipment_statuses_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "supplier_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_shipments: {
        Row: {
          created_at: string | null
          estimated_arrival_date: string | null
          estimated_arrival_days: number
          id: string
          order_id: string | null
          status: string | null
          supplier_tracking_number: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_arrival_date?: string | null
          estimated_arrival_days: number
          id?: string
          order_id?: string | null
          status?: string | null
          supplier_tracking_number?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_arrival_date?: string | null
          estimated_arrival_days?: number
          id?: string
          order_id?: string | null
          status?: string | null
          supplier_tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_name: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          phone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          phone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          phone?: string
        }
        Relationships: []
      }
      warehouse_inventory: {
        Row: {
          available_quantity: number | null
          display_order: number | null
          id: string
          inventory_key: string | null
          product_id: string | null
          product_size: Json | null
          quantity: number
          reserved_quantity: number | null
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          available_quantity?: number | null
          display_order?: number | null
          id?: string
          inventory_key?: string | null
          product_id?: string | null
          product_size?: Json | null
          quantity?: number
          reserved_quantity?: number | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          available_quantity?: number | null
          display_order?: number | null
          id?: string
          inventory_key?: string | null
          product_id?: string | null
          product_size?: Json | null
          quantity?: number
          reserved_quantity?: number | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "warehouse_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_customer_orders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          expected_delivery_date: string | null
          id: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_inventory: {
        Row: {
          available_now: number | null
          height: number | null
          length: number | null
          on_hand: number | null
          on_order_from_supplier: number | null
          product_id: string | null
          product_name: string | null
          reserved_for_customers: number | null
          size_label: string | null
          variant_id: string | null
          width: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_inventory_key:
        | {
            Args: { product_id: string; warehouse_id: string }
            Returns: string
          }
        | {
            Args: {
              product_id: string
              product_size: Json
              warehouse_id: string
            }
            Returns: string
          }
      recalc_customer_order_total: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      update_delivery:
        | {
            Args: {
              delivery_id: string
              new_status: Database["public"]["Enums"]["delivery_status"]
            }
            Returns: undefined
          }
        | {
            Args: {
              p_customers: Json
              p_delivery_date: string
              p_delivery_id: string
              p_driver_id: string
              p_status: Database["public"]["Enums"]["delivery_status"]
            }
            Returns: undefined
          }
        | {
            Args: {
              p_customers: Json
              p_delivery_date: string
              p_delivery_id: string
              p_driver_id: string
              p_status: string
            }
            Returns: undefined
          }
      update_delivery_status: {
        Args: {
          p_delivery_id: string
          p_status: Database["public"]["Enums"]["delivery_status"]
        }
        Returns: undefined
      }
    }
    Enums: {
      delivery_status: "planned" | "completed" | "canceled"
      supplier_order_status: "open" | "ordered" | "delivered"
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
      delivery_status: ["planned", "completed", "canceled"],
      supplier_order_status: ["open", "ordered", "delivered"],
    },
  },
} as const
