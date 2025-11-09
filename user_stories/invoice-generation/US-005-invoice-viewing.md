# US-005: Invoice Viewing in Payment History

**Status**: ✅ Completed
**Completed**: 2025-01-09
**Implementation Notes**: Invoice viewing implemented with InvoiceViewDialog component using shadcn/ui. Dialog displays PDF in 95vh iframe with download functionality. Available in both PaymentHistoryTable and /payments page.

## 📋 User Story

**As a** gym administrator or member
**I want** to view and download invoices from the payment history
**So that** I can access invoice records for accounting or personal use

## 💡 Business Value

**Priority:** P0 (Must Have)
**Complexity:** Small
**Estimated Duration:** 1-2 hours
**Actual Duration:** 1.5 hours
**Dependencies:** US-004 (invoices must exist) ✅ Complete

---

## ✅ Acceptance Criteria

### AC-1: View Invoice Button

**Given** a payment has an associated invoice
**When** viewing the payment in PaymentHistoryTable
**Then** a "View Invoice" or download icon button should be visible

### AC-2: Download Invoice

**Given** I click the "View Invoice" button
**When** the invoice exists
**Then** the PDF should download to my device

### AC-3: Missing Invoice Handling

**Given** a payment does not have an invoice
**When** viewing the payment
**Then** show "Generate Invoice" button instead

### AC-4: Loading States

**Given** I'm downloading an invoice
**When** the download is in progress
**Then** show loading spinner on the button

### AC-5: Error Handling

**Given** invoice download fails (storage error, network issue)
**When** the error occurs
**Then** show error toast with retry option

---

## 🔧 Technical Implementation

### Files to Modify

```
src/features/payments/
└── components/
    └── PaymentHistoryTable.tsx     # Add invoice column/actions
```

### Component Updates

**PaymentHistoryTable.tsx**

```typescript
// Add invoice column to table
const columns = [
  // ... existing columns
  {
    accessorKey: 'invoice',
    header: 'Invoice',
    cell: ({ row }) => {
      const payment = row.original;
      return <InvoiceActions payment={payment} />;
    }
  }
];

// Invoice actions component
const InvoiceActions = ({ payment }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchInvoiceByPaymentId(payment.id).then(setInvoice);
  }, [payment.id]);

  const handleDownload = async () => {
    if (!invoice?.pdf_url) return;

    setIsLoading(true);
    try {
      const blob = await downloadInvoicePDF(invoice.pdf_url);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
    } finally {
      setIsLoading(false);
    }
  };

  if (!invoice) {
    return <GenerateInvoiceButton payment={payment} />;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      <span className="ml-2">Download</span>
    </Button>
  );
};
```

### Storage Download

**downloadInvoicePDF()**

```typescript
export async function downloadInvoicePDF(pdfUrl: string): Promise<Blob> {
  const supabase = createClient();

  // Extract path from URL
  const path = extractPathFromUrl(pdfUrl);

  const { data, error } = await supabase.storage
    .from("business-assets")
    .download(path);

  if (error) throw error;
  return data;
}
```

---

## 🧪 Testing Requirements

```typescript
describe('Invoice Viewing', () => {
  it('should show download button when invoice exists', () => {
    render(<PaymentHistoryTable payments={[mockPaymentWithInvoice]} />);
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('should show generate button when no invoice', () => {
    render(<PaymentHistoryTable payments={[mockPaymentWithoutInvoice]} />);
    expect(screen.getByText('Generate Invoice')).toBeInTheDocument();
  });

  it('should download invoice PDF', async () => {
    render(<PaymentHistoryTable payments={[mockPaymentWithInvoice]} />);

    fireEvent.click(screen.getByText('Download'));

    await waitFor(() => {
      expect(screen.getByText('Invoice downloaded')).toBeInTheDocument();
    });
  });

  it('should handle download errors', async () => {
    // Mock storage error
    fireEvent.click(screen.getByText('Download'));

    await waitFor(() => {
      expect(screen.getByText('Failed to download invoice')).toBeInTheDocument();
    });
  });
});
```

---

## 📝 Implementation Checklist

- [ ] Add invoice column to PaymentHistoryTable
- [ ] Create InvoiceActions component
- [ ] Implement download functionality
- [ ] Add loading states
- [ ] Add error handling
- [ ] Write component tests
- [ ] Manual testing of download flow

---

**Next Story:** US-006 (testing & edge cases)
