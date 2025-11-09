/**
 * Invoice Utilities
 *
 * Database operations and business logic for invoice management:
 * - Tax calculations (NET, VAT, TOTAL)
 * - Invoice number generation
 * - Invoice creation with PDF generation
 * - Settings fetching
 *
 * @module invoice-utils
 */

import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { formatForDatabase } from "@/lib/date-utils";
import { fetchActiveSettings } from "@/features/settings/lib/settings-api";
import type {
  Invoice,
  GeneralSettings,
  InvoiceSettings,
} from "@/features/database/lib/types";

/**
 * Tax calculation result
 */
export interface TaxCalculation {
  /** Net amount before tax (HT) */
  netAmount: number;
  /** Tax amount (TVA) */
  taxAmount: number;
  /** Total amount including tax (TTC) */
  totalAmount: number;
  /** VAT rate used (percentage) */
  vatRate: number;
}

/**
 * Calculate tax amounts from total (TTC)
 *
 * Given a total amount (TTC), calculates the breakdown:
 * - NET (HT) = TOTAL / (1 + VAT_RATE/100)
 * - TAX (TVA) = TOTAL - NET
 * - TOTAL (TTC) = input amount
 *
 * All amounts are rounded to 2 decimal places.
 *
 * @param totalAmount - Total amount including tax (TTC)
 * @param vatRate - VAT rate as percentage (e.g., 20 for 20%)
 * @returns Tax calculation breakdown
 *
 * @example
 * ```typescript
 * const calc = calculateTax(7200, 20);
 * // Returns: { netAmount: 6000, taxAmount: 1200, totalAmount: 7200, vatRate: 20 }
 * ```
 */
export function calculateTax(
  totalAmount: number,
  vatRate: number
): TaxCalculation {
  // Validate inputs
  if (totalAmount < 0) {
    throw new Error("Total amount cannot be negative");
  }
  if (vatRate < 0 || vatRate > 100) {
    throw new Error("VAT rate must be between 0 and 100");
  }

  // Calculate net amount: NET = TOTAL / (1 + VAT_RATE/100)
  const netAmount = totalAmount / (1 + vatRate / 100);

  // Round net amount first to 2 decimal places
  const roundedNet = Math.round(netAmount * 100) / 100;

  // Calculate tax from rounded net to ensure total = net + tax
  const roundedTotal = Math.round(totalAmount * 100) / 100;
  const roundedTax = Math.round((roundedTotal - roundedNet) * 100) / 100;

  return {
    netAmount: roundedNet,
    taxAmount: roundedTax,
    totalAmount: roundedTotal,
    vatRate,
  };
}

/**
 * Fetch general settings from database
 *
 * Retrieves active general settings including business information and logo.
 *
 * @returns General settings or null if not configured
 * @throws Error if database query fails
 */
export async function fetchGeneralSettings(): Promise<GeneralSettings | null> {
  try {
    const settings = await fetchActiveSettings("general_settings");
    if (!settings) {
      logger.warn("General settings not configured");
      return null;
    }

    return settings.setting_value as GeneralSettings;
  } catch (error) {
    logger.error("Failed to fetch general settings", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Fetch invoice settings from database
 *
 * Retrieves active invoice settings including VAT rate and footer notes.
 * Returns default values if not configured.
 *
 * @returns Invoice settings with defaults
 * @throws Error if database query fails
 */
export async function fetchInvoiceSettings(): Promise<InvoiceSettings> {
  try {
    const settings = await fetchActiveSettings("invoice_settings");

    // Return defaults if not configured
    if (!settings) {
      logger.debug("Invoice settings not configured, using defaults");
      return {
        vat_rate: 20,
        invoice_footer_notes: undefined,
        auto_generate: true,
      };
    }

    return settings.setting_value as InvoiceSettings;
  } catch (error) {
    logger.error("Failed to fetch invoice settings", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Generate unique invoice number
 *
 * Calls the RPC function `generate_invoice_number()` which:
 * - Format: DDMMYYYY-XX (e.g., 01052025-01)
 * - Daily counter (resets at midnight)
 * - Handles concurrent requests with locking
 *
 * @returns Generated invoice number
 * @throws Error if RPC call fails
 *
 * @example
 * ```typescript
 * const invoiceNumber = await generateInvoiceNumber();
 * // Returns: "08012025-01" (first invoice of Jan 8, 2025)
 * ```
 */
export async function generateInvoiceNumber(): Promise<string> {
  try {
    logger.debug("Generating invoice number via RPC");

    const { data, error } = await supabase.rpc("generate_invoice_number");

    if (error) {
      logger.error("RPC generate_invoice_number failed", {
        error: error.message,
      });
      throw error;
    }

    if (!data) {
      throw new Error("RPC returned null invoice number");
    }

    logger.info("Invoice number generated successfully", {
      invoiceNumber: data,
    });

    return data as string;
  } catch (error) {
    logger.error("Failed to generate invoice number", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      `Failed to generate invoice number: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Input for creating an invoice
 */
export interface CreateInvoiceInput {
  /** Payment ID to link invoice to */
  payment_id: string;
  /** Member ID */
  member_id: string;
  /** Optional subscription ID */
  subscription_id?: string;
  /** Total amount (TTC) - will be used to calculate NET and TAX */
  amount: number;
}

/**
 * Create invoice record in database
 *
 * Creates invoice with:
 * - Calculated tax breakdown
 * - Generated invoice number
 * - Snapshot of business info and settings
 * - Links to payment
 *
 * Note: PDF generation and upload is handled separately by the caller.
 * This function only creates the database record.
 *
 * @param input - Invoice creation parameters
 * @returns Created invoice record (without PDF URL)
 * @throws Error if settings not configured or database operation fails
 *
 * @example
 * ```typescript
 * const invoice = await createInvoiceRecord({
 *   payment_id: "pay_123",
 *   member_id: "mem_456",
 *   subscription_id: "sub_789",
 *   amount: 7200
 * });
 * // Returns invoice with calculated amounts and invoice number
 * ```
 */
export async function createInvoiceRecord(
  input: CreateInvoiceInput
): Promise<Invoice> {
  try {
    logger.debug("Creating invoice record", {
      payment_id: input.payment_id,
      member_id: input.member_id,
      amount: input.amount,
    });

    // 1. Fetch settings
    const [generalSettings, invoiceSettings] = await Promise.all([
      fetchGeneralSettings(),
      fetchInvoiceSettings(),
    ]);

    if (!generalSettings) {
      throw new Error(
        "General settings not configured. Please configure business information in Settings."
      );
    }

    // 2. Calculate tax amounts
    const taxCalc = calculateTax(input.amount, invoiceSettings.vat_rate);

    logger.debug("Tax calculation completed", {
      netAmount: taxCalc.netAmount,
      taxAmount: taxCalc.taxAmount,
      totalAmount: taxCalc.totalAmount,
      vatRate: taxCalc.vatRate,
    });

    // 3. Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // 4. Get current user for created_by
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 5. Create invoice record
    const invoiceData: Partial<Invoice> = {
      invoice_number: invoiceNumber,
      payment_id: input.payment_id,
      member_id: input.member_id,
      subscription_id: input.subscription_id,
      issue_date: formatForDatabase(new Date()),
      amount: taxCalc.netAmount,
      tax_amount: taxCalc.taxAmount,
      total_amount: taxCalc.totalAmount,
      // Snapshot business info (immutable at time of invoice generation)
      business_name: generalSettings.business_name,
      business_address: generalSettings.business_address,
      business_tax_id: generalSettings.tax_id,
      business_phone: generalSettings.phone,
      business_email: generalSettings.email,
      business_logo_url: generalSettings.logo_url,
      // Snapshot invoice config
      vat_rate: invoiceSettings.vat_rate,
      footer_notes: invoiceSettings.invoice_footer_notes,
      // Status
      status: "issued",
      created_by: user?.id,
    };

    logger.debug("Inserting invoice record", { invoice_number: invoiceNumber });

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select()
      .single();

    if (error) {
      logger.error("Failed to insert invoice record", {
        error: error.message,
        invoice_number: invoiceNumber,
      });
      throw error;
    }

    logger.info("Invoice record created successfully", {
      invoice_id: invoice.id,
      invoice_number: invoiceNumber,
      total_amount: taxCalc.totalAmount,
    });

    return invoice;
  } catch (error) {
    logger.error("Failed to create invoice record", {
      error: error instanceof Error ? error.message : String(error),
      payment_id: input.payment_id,
    });
    throw error;
  }
}

/**
 * Update invoice with PDF URL
 *
 * Updates the invoice record with the uploaded PDF URL.
 * Called after PDF generation and upload to Storage.
 *
 * @param invoiceId - Invoice ID
 * @param pdfUrl - Public URL of uploaded PDF
 * @throws Error if update fails
 */
export async function updateInvoicePdfUrl(
  invoiceId: string,
  pdfUrl: string
): Promise<void> {
  try {
    logger.debug("Updating invoice with PDF URL", { invoiceId, pdfUrl });

    const { error } = await supabase
      .from("invoices")
      .update({ pdf_url: pdfUrl })
      .eq("id", invoiceId);

    if (error) {
      logger.error("Failed to update invoice PDF URL", {
        error: error.message,
        invoiceId,
      });
      throw error;
    }

    logger.info("Invoice PDF URL updated successfully", { invoiceId });
  } catch (error) {
    logger.error("Failed to update invoice PDF URL", {
      error: error instanceof Error ? error.message : String(error),
      invoiceId,
    });
    throw error;
  }
}

/**
 * Fetch member details for invoice
 *
 * Retrieves minimal member information needed for invoice generation.
 *
 * @param memberId - Member ID
 * @returns Member details
 * @throws Error if member not found
 */
export async function fetchMemberForInvoice(memberId: string): Promise<{
  first_name: string;
  last_name: string;
  email: string;
}> {
  try {
    logger.debug("Fetching member for invoice", { memberId });

    const { data, error } = await supabase
      .from("members")
      .select("first_name, last_name, email")
      .eq("id", memberId)
      .single();

    if (error) {
      logger.error("Failed to fetch member", {
        error: error.message,
        memberId,
      });
      throw error;
    }

    if (!data) {
      throw new Error(`Member not found: ${memberId}`);
    }

    return data;
  } catch (error) {
    logger.error("Failed to fetch member for invoice", {
      error: error instanceof Error ? error.message : String(error),
      memberId,
    });
    throw error;
  }
}
