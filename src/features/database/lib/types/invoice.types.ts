// Invoice-related types and interfaces

import type { InvoiceStatus } from "./enums.types";
import type { BusinessAddress } from "./database.types";
import type { SubscriptionPayment } from "./subscription.types";

// Invoices
export interface Invoice {
  id: string;
  invoice_number: string; // Format: DDMMYYYY-XX (e.g., 01052025-01)
  payment_id?: string; // Reference to subscription_payments
  member_id: string;
  subscription_id?: string;
  issue_date: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  // Business info snapshot (from general settings at time of generation)
  business_name?: string;
  business_address?: BusinessAddress;
  business_tax_id?: string;
  business_phone?: string;
  business_email?: string;
  business_logo_url?: string;
  // Invoice configuration snapshot
  vat_rate?: number;
  footer_notes?: string;
  // File storage
  pdf_url?: string; // Path to PDF in Supabase Storage
  status: InvoiceStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Invoice with member details
 * Used when displaying invoices with customer information
 */
export interface InvoiceWithMember extends Invoice {
  members?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

/**
 * Invoice with payment details
 * Used when displaying invoices with payment information
 */
export interface InvoiceWithPayment extends Invoice {
  subscription_payments?: SubscriptionPayment;
}
