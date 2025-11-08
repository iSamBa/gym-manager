# US-003: Invoice PDF Generation Engine

**Status:** ✅ Completed
**Completed:** 2025-01-08
**Implementation Notes:** Implemented complete PDF generation engine with French number-to-words conversion, logo handling, tax calculations, and Supabase Storage integration. Fixed jsPDF mock issue in tests. All 75 tests passing.

## 📋 User Story

**As a** gym administrator
**I want** a PDF generation engine that creates professional A4-format invoices
**So that** invoices match our branding and meet accounting standards

## 💡 Business Value

**Priority:** P0 (Must Have)
**Complexity:** Large
**Estimated Duration:** 3-4 hours
**Dependencies:** US-001 (GeneralSettings), US-002 (InvoiceSettings)

---

## ✅ Acceptance Criteria

### AC-1: PDF Format & Layout

- A4 format (210mm × 297mm)
- Company logo in top-left
- Business info in top-right
- Invoice number and date centered
- Customer name below header
- Table with HT/TVA/TTC rows
- Amount in words at bottom
- Optional footer notes

### AC-2: Invoice Number Generation

- Format: DDMMYYYY-XX (e.g., 01052025-01)
- Daily counter resets at midnight
- Uses RPC function `generate_invoice_number()`
- Unique constraint enforced

### AC-3: Tax Calculations

- NET amount (HT) = payment amount / (1 + VAT rate/100)
- TAX amount (TVA) = NET × (VAT rate/100)
- TOTAL amount (TTC) = payment amount
- Correct rounding to 2 decimal places

### AC-4: Amount to Words

- Convert total amount to French words
- Example: 7200 → "Sept Mille Deux Cent Dirhams (TTC)"
- Handles decimals correctly

### AC-5: Logo Handling

- Fetch logo from Supabase Storage
- Convert to base64 for PDF embedding
- Handle missing logo gracefully
- Respect aspect ratio

### AC-6: Storage & Database

- Upload PDF to `business-assets/invoices/YYYY/MM/INV-XXX.pdf`
- Save invoice record to database with snapshot data
- Link to payment via `payment_id`

---

## 🔧 Technical Implementation

### Files to Create

```
src/features/invoices/
├── lib/
│   ├── invoice-generator.ts        # PDF generation
│   ├── invoice-utils.ts            # Database operations
│   ├── amount-to-words.ts          # Number to words conversion
│   └── storage-utils.ts            # Supabase Storage operations
└── __tests__/
    ├── invoice-generator.test.ts
    ├── invoice-utils.test.ts
    └── amount-to-words.test.ts
```

### Files to Modify

```
src/features/payments/lib/pdf-generator.ts  # Extend with invoice function
```

### Key Functions

**generateInvoicePDF()**

```typescript
export async function generateInvoicePDF(
  invoice: Invoice,
  member: { first_name: string; last_name: string },
  generalSettings: GeneralSettings,
  invoiceSettings: InvoiceSettings
): Promise<Blob> {
  // Dynamic import for bundle optimization
  const { jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF({ format: "a4", unit: "mm" });

  // Add logo
  if (generalSettings.logo_url) {
    const logoBase64 = await fetchLogoAsBase64(generalSettings.logo_url);
    doc.addImage(logoBase64, "PNG", 20, 20, 40, 40);
  }

  // Business info (top right)
  doc.setFontSize(11);
  doc.text(generalSettings.business_name, 195, 25, { align: "right" });
  doc.text(generalSettings.business_address.street, 195, 31, {
    align: "right",
  });
  doc.text(
    `${generalSettings.business_address.city} ${generalSettings.business_address.postal_code}`,
    195,
    37,
    { align: "right" }
  );
  doc.text(`ICE: ${generalSettings.tax_id}`, 195, 43, { align: "right" });

  // Invoice header
  doc.setFontSize(20);
  doc.text("Facture", 105, 70, { align: "center" });
  doc.setFontSize(12);
  doc.text(`N° ${invoice.invoice_number}`, 105, 78, { align: "center" });
  doc.text(`Date: ${formatDate(invoice.issue_date)}`, 105, 85, {
    align: "center",
  });

  // Client
  doc.setFontSize(11);
  doc.text(`Client(e): ${member.first_name} ${member.last_name}`, 20, 100);

  // Table
  (doc as any).autoTable({
    startY: 110,
    head: [["Description", "Montant (MAD)"]],
    body: [
      ["Abonnement (HT)", formatCurrency(invoice.amount)],
      ["TVA", formatCurrency(invoice.tax_amount)],
      ["Total (TTC)", formatCurrency(invoice.total_amount)],
    ],
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Amount in words
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text("La présente facture est arrêtée à la somme de:", 20, finalY);
  doc.text(amountToWords(invoice.total_amount), 20, finalY + 7);

  // Footer notes
  if (invoiceSettings.invoice_footer_notes) {
    doc.setFontSize(9);
    doc.text(invoiceSettings.invoice_footer_notes, 20, finalY + 20);
  }

  return doc.output("blob");
}
```

**createInvoice()**

```typescript
export async function createInvoice(input: {
  payment_id: string;
  member_id: string;
  subscription_id?: string;
  amount: number;
}): Promise<Invoice> {
  const supabase = createClient();

  // 1. Fetch settings
  const [generalSettings, invoiceSettings] = await Promise.all([
    fetchGeneralSettings(),
    fetchInvoiceSettings(),
  ]);

  if (!generalSettings) {
    throw new Error("General settings not configured");
  }

  // 2. Calculate amounts
  const vatRate = invoiceSettings?.vat_rate || 20;
  const totalAmount = input.amount;
  const netAmount = totalAmount / (1 + vatRate / 100);
  const taxAmount = totalAmount - netAmount;

  // 3. Generate invoice number
  const { data: invoiceNumber } = await supabase.rpc("generate_invoice_number");

  // 4. Create invoice record
  const invoiceData: Partial<Invoice> = {
    invoice_number: invoiceNumber,
    payment_id: input.payment_id,
    member_id: input.member_id,
    subscription_id: input.subscription_id,
    issue_date: formatForDatabase(new Date()),
    amount: netAmount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    // Snapshot business info
    business_name: generalSettings.business_name,
    business_address: generalSettings.business_address,
    business_tax_id: generalSettings.tax_id,
    business_phone: generalSettings.phone,
    business_email: generalSettings.email,
    business_logo_url: generalSettings.logo_url,
    // Snapshot invoice config
    vat_rate: vatRate,
    footer_notes: invoiceSettings?.invoice_footer_notes,
    status: "issued",
  };

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert(invoiceData)
    .select()
    .single();

  if (error) throw error;

  // 5. Generate PDF
  const member = await fetchMember(input.member_id);
  const pdfBlob = await generateInvoicePDF(
    invoice,
    member,
    generalSettings,
    invoiceSettings
  );

  // 6. Upload PDF to Storage
  const pdfUrl = await uploadInvoicePDF(pdfBlob, invoiceNumber);

  // 7. Update invoice with PDF URL
  await supabase
    .from("invoices")
    .update({ pdf_url: pdfUrl })
    .eq("id", invoice.id);

  return { ...invoice, pdf_url: pdfUrl };
}
```

**amountToWords()**

```typescript
const units = [
  "",
  "Un",
  "Deux",
  "Trois",
  "Quatre",
  "Cinq",
  "Six",
  "Sept",
  "Huit",
  "Neuf",
];
const teens = [
  "Dix",
  "Onze",
  "Douze",
  "Treize",
  "Quatorze",
  "Quinze",
  "Seize",
  "Dix-Sept",
  "Dix-Huit",
  "Dix-Neuf",
];
const tens = [
  "",
  "",
  "Vingt",
  "Trente",
  "Quarante",
  "Cinquante",
  "Soixante",
  "Soixante-Dix",
  "Quatre-Vingt",
  "Quatre-Vingt-Dix",
];

export function amountToWords(
  amount: number,
  currency: string = "Dirhams"
): string {
  // Implementation for French number-to-words conversion
  // Returns: "Sept Mille Deux Cent Dirhams (TTC)"
}
```

---

## 🧪 Testing Requirements

### Unit Tests

```typescript
describe('generateInvoicePDF', () => {
  it('should generate A4 PDF', async () => {
    const pdf = await generateInvoicePDF(mockInvoice, mockMember, mockSettings, mockInvoiceSettings);
    expect(pdf.type).toBe('application/pdf');
  });

  it('should include logo if provided', async () => {
    // Test logo inclusion
  });

  it('should handle missing logo gracefully', async () => {
    const settings = { ...mockSettings, logo_url: null };
    const pdf = await generateInvoicePDF(mockInvoice, mockMember, settings, mockInvoiceSettings);
    expect(pdf).toBeInstanceOf(Blob);
  });
});

describe('createInvoice', () => {
  it('should calculate tax amounts correctly', async () => {
    const invoice = await createInvoice({ amount: 7200, ... });
    expect(invoice.amount).toBeCloseTo(6000);
    expect(invoice.tax_amount).toBeCloseTo(1200);
    expect(invoice.total_amount).toBe(7200);
  });

  it('should generate unique invoice numbers', async () => {
    const invoice1 = await createInvoice(mockInput);
    const invoice2 = await createInvoice(mockInput);
    expect(invoice1.invoice_number).not.toBe(invoice2.invoice_number);
  });
});

describe('amountToWords', () => {
  it('should convert amounts correctly', () => {
    expect(amountToWords(7200)).toBe('Sept Mille Deux Cent Dirhams (TTC)');
    expect(amountToWords(1000)).toBe('Mille Dirhams (TTC)');
  });
});
```

---

## 📝 Implementation Checklist

- [ ] Create invoice-generator.ts with generateInvoicePDF()
- [ ] Create invoice-utils.ts with createInvoice()
- [ ] Create amount-to-words.ts
- [ ] Create storage-utils.ts
- [ ] Implement tax calculations
- [ ] Implement invoice number generation
- [ ] Implement PDF layout matching design
- [ ] Implement logo fetching and embedding
- [ ] Implement Storage upload
- [ ] Write comprehensive tests
- [ ] Test with real data
- [ ] Verify PDF format and quality

---

**Next Story:** US-004 (integrate into payment flow)
