# US-004: Automatic Invoice Generation on Payment

## 📋 User Story

**As a** gym administrator
**I want** invoices to be automatically generated when payments are recorded
**So that** I don't have to manually create invoices for every transaction

## 💡 Business Value

**Priority:** P1 (Should Have)
**Complexity:** Medium
**Estimated Duration:** 2-3 hours
**Dependencies:** US-003 (PDF generation engine)

---

## ✅ Acceptance Criteria

### AC-1: Auto-generate on Payment

**Given** auto-generate is enabled in invoice settings
**When** a payment is successfully recorded
**Then** an invoice should automatically be created and linked to the payment

### AC-2: Manual Generation Option

**Given** auto-generate is disabled OR invoice doesn't exist
**When** admin clicks "Generate Invoice" button
**Then** invoice should be created for that payment

### AC-3: Error Handling

**Given** invoice generation fails (settings missing, storage error, etc.)
**When** the error occurs
**Then**:

- Payment should still be recorded successfully
- Error should be logged
- Admin should see warning notification
- "Generate Invoice" button available to retry

### AC-4: Prevent Duplicates

**Given** an invoice already exists for a payment
**When** admin attempts to generate again
**Then** show warning "Invoice already exists" and prevent duplicate

### AC-5: Payment-Invoice Linking

**Given** an invoice is generated
**When** viewing the invoice record
**Then** it should be linked to the payment via `payment_id`

---

## 🔧 Technical Implementation

### Files to Create

```
src/features/invoices/
├── hooks/
│   └── use-invoices.ts             # Invoice CRUD operations
└── components/
    └── GenerateInvoiceDialog.tsx   # Manual generation UI (optional)
```

### Files to Modify

```
src/features/payments/
├── components/
│   ├── RecordPaymentDialog.tsx     # Add auto-invoice logic
│   └── PaymentHistoryTable.tsx     # Add "Generate Invoice" action
└── hooks/
    └── use-payments.ts             # Integrate invoice generation
```

### Integration Points

**RecordPaymentDialog.tsx** - Auto-generation

```typescript
const handleRecordPayment = async (paymentData) => {
  try {
    // 1. Record payment
    const payment = await recordPayment(paymentData);

    // 2. Check if auto-generate enabled
    const invoiceSettings = await fetchInvoiceSettings();

    if (invoiceSettings?.auto_generate) {
      try {
        await createInvoice({
          payment_id: payment.id,
          member_id: payment.member_id,
          subscription_id: payment.subscription_id,
          amount: payment.amount,
        });
        toast.success("Payment recorded and invoice generated");
      } catch (invoiceError) {
        logger.error("Invoice generation failed", { error: invoiceError });
        toast.warning(
          "Payment recorded but invoice generation failed. You can retry from payment history."
        );
      }
    } else {
      toast.success("Payment recorded successfully");
    }
  } catch (error) {
    toast.error("Failed to record payment");
  }
};
```

**PaymentHistoryTable.tsx** - Manual generation

```typescript
const GenerateInvoiceButton = ({ payment }) => {
  const { generateInvoice, isGenerating } = useInvoices();
  const [hasInvoice, setHasInvoice] = useState(false);

  useEffect(() => {
    // Check if invoice exists
    checkInvoiceExists(payment.id).then(setHasInvoice);
  }, [payment.id]);

  if (hasInvoice) {
    return <Button disabled>Invoice Exists</Button>;
  }

  return (
    <Button
      onClick={() => generateInvoice({ payment_id: payment.id, ... })}
      disabled={isGenerating}
    >
      {isGenerating ? 'Generating...' : 'Generate Invoice'}
    </Button>
  );
};
```

**use-invoices.ts** Hook

```typescript
export function useInvoices() {
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Invoice generated successfully");
    },
    onError: (error) => {
      logger.error("Failed to generate invoice", { error });
      toast.error("Failed to generate invoice");
    },
  });

  const checkExistsMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { data } = await supabase
        .from("invoices")
        .select("id")
        .eq("payment_id", paymentId)
        .maybeSingle();
      return !!data;
    },
  });

  return {
    generateInvoice: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    checkInvoiceExists: checkExistsMutation.mutateAsync,
  };
}
```

---

## 🧪 Testing Requirements

```typescript
describe("Auto Invoice Generation", () => {
  it("should generate invoice when auto-generate enabled", async () => {
    // Mock auto_generate: true
    const payment = await recordPayment(mockData);
    const invoice = await fetchInvoiceByPaymentId(payment.id);
    expect(invoice).toBeDefined();
  });

  it("should not generate invoice when auto-generate disabled", async () => {
    // Mock auto_generate: false
    const payment = await recordPayment(mockData);
    const invoice = await fetchInvoiceByPaymentId(payment.id);
    expect(invoice).toBeNull();
  });

  it("should allow manual generation", async () => {
    const payment = mockPayment;
    await generateInvoice({ payment_id: payment.id });
    const invoice = await fetchInvoiceByPaymentId(payment.id);
    expect(invoice).toBeDefined();
  });

  it("should prevent duplicate invoices", async () => {
    const payment = mockPayment;
    await generateInvoice({ payment_id: payment.id });

    await expect(generateInvoice({ payment_id: payment.id })).rejects.toThrow(
      "Invoice already exists"
    );
  });
});
```

---

## 📝 Implementation Checklist

- [ ] Create use-invoices.ts hook
- [ ] Modify RecordPaymentDialog with auto-generation logic
- [ ] Add "Generate Invoice" button to PaymentHistoryTable
- [ ] Implement duplicate prevention
- [ ] Add error handling and logging
- [ ] Add loading states
- [ ] Write integration tests
- [ ] Manual testing of complete flow

---

**Next Story:** US-005 (invoice viewing)
