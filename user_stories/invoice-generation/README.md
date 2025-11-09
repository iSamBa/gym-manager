# Invoice Generation System - Technical Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Storage Structure](#storage-structure)
- [TypeScript Types](#typescript-types)
- [Components](#components)
- [Hooks & Utilities](#hooks--utilities)
- [PDF Generation](#pdf-generation)
- [API Integration](#api-integration)
- [Testing Strategy](#testing-strategy)

---

## Overview

### Feature Description

The Invoice Generation System provides automated, professional invoice creation for all payment transactions in the gym management system. It includes:

- **Settings Management**: Reusable business information and invoice configuration
- **Automatic Generation**: Invoices created on payment with daily-reset numbering
- **PDF Creation**: A4-format invoices matching provided design template
- **Storage**: Organized file storage in Supabase Storage
- **Viewing**: Easy access to invoices from payment history

### Business Value

- **Accounting Compliance**: Professional invoices with proper numbering
- **Time Savings**: Automated generation eliminates manual work
- **Branding**: Consistent company branding on all invoices
- **Audit Trail**: All invoices stored and accessible
- **Customer Service**: Members can download their invoices anytime

---

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Settings UI                       │
│  ┌─────────────────────┐    ┌───────────────────────────┐  │
│  │   General Tab       │    │   Invoice Settings Tab    │  │
│  │ - Business Info     │    │ - VAT Rate                │  │
│  │ - Logo Upload       │    │ - Footer Notes            │  │
│  │ - Contact Details   │    │ - Auto-generate Toggle    │  │
│  └─────────────────────┘    └───────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
          ┌────────────────────────┐
          │   studio_settings      │
          │   (Supabase Database)  │
          │ - general_settings     │
          │ - invoice_settings     │
          └────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ↓                           ↓
┌──────────────────┐       ┌──────────────────┐
│  Payment Record  │       │  Manual Generate │
│  Dialog          │       │  (Optional)      │
└────────┬─────────┘       └────────┬─────────┘
         │                          │
         └──────────┬───────────────┘
                    ↓
         ┌────────────────────────┐
         │  Invoice Generator     │
         │  1. Get invoice number │
         │  2. Fetch settings     │
         │  3. Generate PDF       │
         │  4. Upload to Storage  │
         │  5. Save to DB         │
         └────────┬───────────────┘
                  │
         ┌────────┴────────┐
         ↓                 ↓
┌──────────────┐    ┌────────────────┐
│   invoices   │    │ Supabase       │
│   (Database) │    │ Storage        │
│              │    │ /invoices/     │
└──────┬───────┘    └────────┬───────┘
       │                     │
       └──────────┬──────────┘
                  ↓
      ┌───────────────────────┐
      │  Payment History UI   │
      │  - View Invoice       │
      │  - Download PDF       │
      └───────────────────────┘
```

### Data Flow

**1. Settings Configuration**

```
Admin → GeneralTab → use-general-settings → studio_settings
Admin → InvoiceSettingsTab → use-invoice-settings → studio_settings
Admin → Logo Upload → Supabase Storage → business-assets/company-logo.png
```

**2. Invoice Generation**

```
Payment Created → Check auto_generate flag → Generate Invoice
    ↓
Get Settings (general + invoice)
    ↓
Generate Invoice Number (RPC: generate_invoice_number)
    ↓
Generate PDF (jsPDF with settings data)
    ↓
Upload PDF (Supabase Storage: invoices/YYYY/MM/INV-XXX.pdf)
    ↓
Save Invoice Record (invoices table with snapshot data)
    ↓
Link to Payment (payment_id reference)
```

**3. Invoice Viewing**

```
Payment History → Click "View Invoice" → Fetch PDF from Storage → Download/Preview
```

---

## Database Schema

### Invoices Table

**Already Created** ✅

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,  -- DDMMYYYY-XX
  payment_id UUID REFERENCES subscription_payments(id),
  member_id UUID REFERENCES members(id) NOT NULL,
  subscription_id UUID REFERENCES member_subscriptions(id),

  -- Invoice amounts
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,

  -- Business info snapshot (from general_settings)
  business_name VARCHAR(255),
  business_address JSONB,
  business_tax_id VARCHAR(100),
  business_phone VARCHAR(50),
  business_email VARCHAR(255),
  business_logo_url TEXT,

  -- Invoice config snapshot (from invoice_settings)
  vat_rate DECIMAL(5, 2),
  footer_notes TEXT,

  -- Storage
  pdf_url TEXT,
  status VARCHAR(50) DEFAULT 'issued',

  -- Audit
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**

- `idx_invoices_member_id` - Fast member lookups
- `idx_invoices_payment_id` - Fast payment lookups
- `idx_invoices_issue_date` - Date range queries
- `idx_invoices_invoice_number` - Unique invoice lookups

### Invoice Counters Table

**Already Created** ✅

```sql
CREATE TABLE invoice_counters (
  counter_date DATE PRIMARY KEY,
  next_counter INTEGER NOT NULL DEFAULT 1
);
```

**Purpose:** Tracks daily invoice counter for DDMMYYYY-XX format

### Settings Storage

**Using Existing `studio_settings` Table**

```sql
-- General Settings Entry
INSERT INTO studio_settings (setting_key, setting_value, is_active)
VALUES ('general_settings', '{
  "business_name": "IronBodyFit Palmier",
  "business_address": {
    "street": "Lot Massira Résidence Costa Del Sol",
    "city": "Mohammedia",
    "postal_code": "20110",
    "country": "Maroc"
  },
  "tax_id": "001754517000028",
  "phone": "06.60.15.10.98",
  "email": "contact@ironbodyfit.ma",
  "logo_url": "business-assets/company-logo.png"
}', true);

-- Invoice Settings Entry
INSERT INTO studio_settings (setting_key, setting_value, is_active)
VALUES ('invoice_settings', '{
  "vat_rate": 20,
  "invoice_footer_notes": "",
  "auto_generate": true
}', true);
```

### RPC Functions

**Already Created** ✅

```sql
-- Generate and increment invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50);

-- Preview next invoice number without incrementing
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS VARCHAR(50);
```

---

## Storage Structure

### Supabase Storage Bucket: `business-assets`

**Already Created** ✅

```
business-assets/
├── company-logo.png              # Single business logo
└── invoices/
    ├── 2025/
    │   ├── 01/
    │   │   ├── INV-01012025-01.pdf
    │   │   ├── INV-01012025-02.pdf
    │   │   └── INV-31012025-15.pdf
    │   ├── 02/
    │   └── ...
    └── 2024/
        └── ...
```

### Storage Policies

**Logo (Public Read, Admin Write):**

```sql
-- Anyone can view company logo
CREATE POLICY "Anyone can view company logo" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'business-assets' AND name = 'company-logo.png');

-- Admins can upload/update/delete company logo
CREATE POLICY "Admins can upload company logo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-assets' AND name = 'company-logo.png' AND is_admin());
```

**Invoices (Authenticated Read, Admin Write):**

```sql
-- Authenticated users can view invoices
CREATE POLICY "Authenticated users can view invoices" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'business-assets' AND name LIKE 'invoices/%');

-- Admins can upload/delete invoices
CREATE POLICY "Admins can upload invoices" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-assets' AND name LIKE 'invoices/%' AND is_admin());
```

---

## TypeScript Types

### Core Types

**Already Defined** ✅ in `src/features/database/lib/types.ts`

```typescript
// Settings
export interface GeneralSettings {
  business_name: string;
  business_address: BusinessAddress;
  tax_id: string;
  phone: string;
  email: string;
  logo_url?: string;
}

export interface BusinessAddress {
  street: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface InvoiceSettings {
  vat_rate: number;
  invoice_footer_notes?: string;
  auto_generate: boolean;
}

// Invoice
export interface Invoice {
  id: string;
  invoice_number: string;
  payment_id?: string;
  member_id: string;
  subscription_id?: string;
  issue_date: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  business_name?: string;
  business_address?: BusinessAddress;
  business_tax_id?: string;
  business_phone?: string;
  business_email?: string;
  business_logo_url?: string;
  vat_rate?: number;
  footer_notes?: string;
  pdf_url?: string;
  status: InvoiceStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled";
```

### Extended Types

```typescript
// Invoice with member details
export interface InvoiceWithMember extends Invoice {
  members?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Invoice with payment details
export interface InvoiceWithPayment extends Invoice {
  subscription_payments?: SubscriptionPayment;
}

// Invoice generation input
export interface GenerateInvoiceInput {
  payment_id: string;
  member_id: string;
  subscription_id?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
}
```

---

## Components

### Feature Structure

```
src/features/
├── settings/
│   └── components/
│       ├── GeneralTab.tsx                # US-001
│       ├── InvoiceSettingsTab.tsx        # US-002
│       ├── BusinessInfoForm.tsx          # US-001
│       └── LogoUploadField.tsx           # US-001
│
└── invoices/
    ├── components/
    │   ├── GenerateInvoiceDialog.tsx     # US-004
    │   └── InvoicePreview.tsx            # US-005
    ├── hooks/
    │   ├── use-general-settings.ts       # US-001
    │   ├── use-invoice-settings.ts       # US-002
    │   └── use-invoices.ts               # US-003
    ├── lib/
    │   ├── invoice-generator.ts          # US-003
    │   ├── invoice-utils.ts              # US-003
    │   └── amount-to-words.ts            # US-003
    └── __tests__/
        ├── invoice-generator.test.ts     # US-006
        └── invoice-utils.test.ts         # US-006
```

### Component Descriptions

**GeneralTab.tsx**

- Renders business information form
- Logo upload with preview
- Save/Reset functionality
- Uses `use-general-settings` hook

**InvoiceSettingsTab.tsx**

- VAT rate input (percentage)
- Invoice footer notes textarea
- Auto-generate toggle checkbox
- Uses `use-invoice-settings` hook

**BusinessInfoForm.tsx**

- Reusable form for business details
- Fields: name, address, tax ID, phone, email
- Validation and error messages

**LogoUploadField.tsx**

- File input with drag-and-drop
- Image preview
- Upload to Supabase Storage
- File size/format validation

---

## Hooks & Utilities

### Hooks

**use-general-settings.ts**

```typescript
export function useGeneralSettings() {
  const { data, isLoading, error, updateSettings, isUpdating } =
    useStudioSettings("general_settings");

  return {
    settings: data?.setting_value as GeneralSettings | null,
    isLoading,
    error,
    updateSettings: (newSettings: GeneralSettings) =>
      updateSettings({ value: newSettings, effectiveFrom: null }),
    isUpdating,
  };
}
```

**use-invoice-settings.ts**

```typescript
export function useInvoiceSettings() {
  const { data, isLoading, error, updateSettings, isUpdating } =
    useStudioSettings("invoice_settings");

  return {
    settings: data?.setting_value as InvoiceSettings | null,
    isLoading,
    error,
    updateSettings: (newSettings: InvoiceSettings) =>
      updateSettings({ value: newSettings, effectiveFrom: null }),
    isUpdating,
  };
}
```

**use-invoices.ts**

```typescript
export function useInvoices(filters?: InvoiceFilters) {
  const query = useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => fetchInvoices(filters),
  });

  const generateMutation = useMutation({
    mutationFn: generateInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  return {
    invoices: query.data,
    isLoading: query.isLoading,
    generateInvoice: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
  };
}
```

### Utilities

**invoice-generator.ts**

```typescript
export async function generateInvoicePDF(
  invoice: Invoice,
  generalSettings: GeneralSettings,
  invoiceSettings: InvoiceSettings
): Promise<Blob>;
```

**invoice-utils.ts**

```typescript
export async function createInvoice(
  input: GenerateInvoiceInput
): Promise<Invoice>;
export async function getInvoiceNumber(): Promise<string>;
export async function storeInvoicePDF(
  pdf: Blob,
  invoiceNumber: string
): Promise<string>;
export async function fetchInvoices(
  filters?: InvoiceFilters
): Promise<Invoice[]>;
```

**amount-to-words.ts**

```typescript
export function amountToWords(amount: number, currency: string = "MAD"): string;
// Example: 7200 → "Sept Mille Deux Cent Dirhams"
```

---

## PDF Generation

### Design Specifications

**Format:** A4 (210mm × 297mm)

**Layout:**

```
┌────────────────────────────────────────────────┐
│ [LOGO]                    IRONBODYFIT PALMIER  │
│                          279 Boulevard...      │
│                          Casablanca 20110      │
│                          ICE: 001754517000028  │
│                                                │
│            Facture                             │
│            N° 01052025-01                      │
│            Date: 01/05/2025                    │
│                                                │
│ Client(e): Lalla Rabiaa Tigha                  │
│                                                │
│ ┌──────────────────┬───────────────────────┐  │
│ │ Description      │ Montant (MAD)         │  │
│ ├──────────────────┼───────────────────────┤  │
│ │ Abonnement (HT)  │            6,000.00   │  │
│ │ TVA              │            1,200.00   │  │
│ │ Total (TTC)      │            7,200.00   │  │
│ └──────────────────┴───────────────────────┘  │
│                                                │
│ La présente facture est arrêtée à la somme de: │
│ Sept Mille Deux Cent Dirhams (TTC)             │
│                                                │
│ [Optional footer notes from settings]          │
└────────────────────────────────────────────────┘
```

### Implementation

**Using jsPDF** (already in dependencies):

```typescript
import { jsPDF } from "jspdf";

export async function generateInvoicePDF(
  invoice: Invoice,
  generalSettings: GeneralSettings,
  invoiceSettings: InvoiceSettings
): Promise<Blob> {
  const doc = new jsPDF({
    format: "a4",
    unit: "mm",
  });

  // Add logo (if exists)
  if (generalSettings.logo_url) {
    const logoData = await fetchLogoAsBase64(generalSettings.logo_url);
    doc.addImage(logoData, "PNG", 20, 20, 30, 30);
  }

  // Business info (top right)
  doc.setFontSize(12);
  doc.text(generalSettings.business_name, 150, 25, { align: "right" });
  // ... rest of business info

  // Invoice header
  doc.setFontSize(18);
  doc.text("Facture", 105, 60, { align: "center" });
  doc.setFontSize(12);
  doc.text(`N° ${invoice.invoice_number}`, 105, 68, { align: "center" });

  // Client info
  doc.text(`Client(e): ${member.first_name} ${member.last_name}`, 20, 85);

  // Table
  doc.autoTable({
    startY: 95,
    head: [["Description", "Montant (MAD)"]],
    body: [
      ["Abonnement (HT)", formatCurrency(invoice.amount)],
      ["TVA", formatCurrency(invoice.tax_amount)],
      ["Total (TTC)", formatCurrency(invoice.total_amount)],
    ],
  });

  // Amount in words
  const amountWords = amountToWords(invoice.total_amount);
  doc.text(`La présente facture est arrêtée à la somme de:`, 20, 140);
  doc.text(amountWords, 20, 148);

  // Footer notes
  if (invoiceSettings.invoice_footer_notes) {
    doc.text(invoiceSettings.invoice_footer_notes, 20, 160);
  }

  return doc.output("blob");
}
```

---

## API Integration

### Settings API

**Existing:** Uses `src/features/settings/lib/settings-api.ts`

```typescript
export async function fetchActiveSettings(
  settingKey: string
): Promise<StudioSettings | null>;
export async function updateStudioSettings(
  settingKey: string,
  value: unknown,
  effectiveFrom: Date | null
): Promise<StudioSettings>;
```

### Invoice API

**New:** Create `src/features/invoices/lib/invoice-api.ts`

```typescript
export async function createInvoiceRecord(
  invoice: Partial<Invoice>
): Promise<Invoice>;
export async function fetchInvoices(
  filters?: InvoiceFilters
): Promise<Invoice[]>;
export async function fetchInvoiceByPaymentId(
  paymentId: string
): Promise<Invoice | null>;
export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus
): Promise<void>;
```

### Storage API

**New:** Create `src/features/invoices/lib/storage-api.ts`

```typescript
export async function uploadLogo(file: File): Promise<string>;
export async function uploadInvoicePDF(
  pdf: Blob,
  invoiceNumber: string
): Promise<string>;
export async function downloadInvoicePDF(pdfUrl: string): Promise<Blob>;
export async function deleteLogo(): Promise<void>;
```

---

## Testing Strategy

### Unit Tests

**invoice-generator.test.ts**

```typescript
describe("generateInvoicePDF", () => {
  it("should generate PDF with correct format", async () => {
    const pdf = await generateInvoicePDF(
      mockInvoice,
      mockSettings,
      mockInvoiceSettings
    );
    expect(pdf).toBeInstanceOf(Blob);
    expect(pdf.type).toBe("application/pdf");
  });

  it("should include business logo if provided", async () => {
    const settings = { ...mockSettings, logo_url: "path/to/logo.png" };
    const pdf = await generateInvoicePDF(
      mockInvoice,
      settings,
      mockInvoiceSettings
    );
    // Verify logo in PDF
  });
});
```

**invoice-utils.test.ts**

```typescript
describe("createInvoice", () => {
  it("should generate unique invoice number", async () => {
    const invoice1 = await createInvoice(mockInput);
    const invoice2 = await createInvoice(mockInput);
    expect(invoice1.invoice_number).not.toBe(invoice2.invoice_number);
  });

  it("should reset counter daily", async () => {
    // Test daily reset logic
  });
});
```

**amount-to-words.test.ts**

```typescript
describe("amountToWords", () => {
  it("should convert amount to French words", () => {
    expect(amountToWords(7200)).toBe("Sept Mille Deux Cent Dirhams");
  });
});
```

### Component Tests

**GeneralTab.test.tsx**

```typescript
describe('GeneralTab', () => {
  it('should render business info form', () => {
    render(<GeneralTab />);
    expect(screen.getByLabelText('Business Name')).toBeInTheDocument();
  });

  it('should save settings on submit', async () => {
    // Test save flow
  });
});
```

### Integration Tests

**invoice-generation-flow.test.ts**

```typescript
describe("Invoice Generation Flow", () => {
  it("should generate invoice on payment creation", async () => {
    // 1. Create payment
    // 2. Verify invoice generated
    // 3. Verify PDF uploaded
    // 4. Verify database record
  });
});
```

---

## Performance Considerations

### Bundle Optimization

- ✅ **Dynamic import for jsPDF**: `const { jsPDF } = await import('jspdf')`
- ✅ **Lazy load components**: `const InvoicePreview = lazy(() => import('./InvoicePreview'))`

### Database Performance

- ✅ **Indexes on key fields**: member_id, payment_id, issue_date
- ✅ **Limit queries**: Use pagination for invoice lists
- ✅ **RPC functions**: Server-side invoice number generation

### Storage Performance

- ✅ **Organized structure**: Year/Month folders for efficient browsing
- ✅ **Signed URLs**: Temporary download links for security
- ✅ **Image optimization**: Compress logo before upload (max 2MB)

---

## Security Considerations

### Authentication & Authorization

- ✅ **Admin-only settings**: Only admins can configure business/invoice settings
- ✅ **Admin-only generation**: Only admins can generate/delete invoices
- ✅ **Authenticated viewing**: Only authenticated users can view invoices

### Data Validation

- ✅ **File upload validation**: Image format (PNG/JPG), size (max 2MB)
- ✅ **Settings validation**: Required fields, format checks
- ✅ **Amount validation**: Positive numbers, proper decimals

### Storage Security

- ✅ **RLS policies**: Enforce access control on Storage
- ✅ **Private invoices**: Only authenticated users can access
- ✅ **Public logo**: Anyone can view company logo (for invoices)

---

## Future Enhancements (P2)

### Nice-to-Have Features

1. **Email Invoices**: Send invoice PDF to member's email
2. **Bulk Download**: Download multiple invoices as ZIP
3. **Invoice Templates**: Multiple design templates to choose from
4. **Multi-currency**: Support for different currencies
5. **Invoice History Viewer**: Dedicated page with advanced filters
6. **Regenerate Invoice**: Ability to regenerate if settings changed
7. **Invoice Preview**: Live preview before generation

---

## References

- **jsPDF Documentation**: https://github.com/parallax/jsPDF
- **Supabase Storage**: https://supabase.com/docs/guides/storage
- **shadcn/ui Components**: https://ui.shadcn.com/
- **React Query**: https://tanstack.com/query/latest

---

**For implementation guidance, see [AGENT-GUIDE.md](./AGENT-GUIDE.md)**
