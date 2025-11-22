// Core database types and shared interfaces

import type { PartnershipType } from "./enums.types";

// Address interface for JSON field
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

// Business address interface for general settings
export interface BusinessAddress {
  street: string;
  city: string;
  postal_code: string;
  country: string;
}

// Emergency contact interface for JSON field
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

// General Settings (for studio-wide configuration)
export interface GeneralSettings {
  business_name: string;
  business_address: BusinessAddress;
  tax_id: string; // ICE number
  phone: string;
  email: string;
  logo_url?: string; // Path to logo in Supabase Storage
}

// Invoice Settings (invoice-specific configuration)
export interface InvoiceSettings {
  vat_rate: number; // Percentage (e.g., 20 for 20%)
  invoice_footer_notes?: string; // Optional custom footer text
  auto_generate: boolean; // Auto-generate invoice on payment
}

// Collaboration partnership details (for collaboration members)
export interface CollaborationPartnership {
  company_name: string | null;
  partnership_type: PartnershipType | null;
  contract_start_date: string | null; // YYYY-MM-DD
  contract_end_date: string | null; // YYYY-MM-DD
  notes: string | null;
}

// Member presence interface for real-time tracking
export interface MemberPresence {
  userId: string;
  username: string;
  action: "viewing" | "editing";
  timestamp: Date;
}

// User Profiles
export interface UserProfile {
  id: string;
  role: import("./enums.types").UserRole;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  hire_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Database function return types
export interface MembershipStats {
  total_members: number;
  active_members: number;
  new_members_this_month: number;
  churn_rate: number;
}

export interface RevenueStats {
  total_revenue: number;
  monthly_recurring_revenue: number;
  average_revenue_per_member: number;
  outstanding_payments: number;
}

export interface ClassStats {
  total_classes_this_month: number;
  average_attendance_rate: number;
  most_popular_classes: Array<{
    class_type: string;
    booking_count: number;
  }>;
}

export interface EquipmentStats {
  total_equipment: number;
  equipment_out_of_order: number;
}
