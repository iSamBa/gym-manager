# Bulk Invoice Download Feature - START HERE

## Feature Overview

This feature adds the ability for gym administrators to select multiple payment records and download all their invoices in a single ZIP file. This functionality is available in two locations:

1. **Payments Page** - Select payments from filtered/searched results with date range
2. **Member Details** - Select payments from a specific member's payment history

## Why This Feature?

**Current Problem:**

- Admins must download invoices one-by-one
- Time-consuming for bulk archiving or accounting purposes
- No efficient way to export multiple invoices for audits

**Solution:**

- Checkbox selection on payment tables
- Bulk download action with progress tracking
- ZIP file containing all invoice PDFs with proper naming

## Quick Start for Implementation

### Prerequisites

Before starting implementation, ensure you have:

- [x] Read `CLAUDE.md` (project standards and guidelines)
- [x] Reviewed research report (codebase architecture)
- [x] Access to Supabase database and storage
- [x] Node.js 18+ and dependencies installed

### Implementation Order

**IMPORTANT:** User stories MUST be implemented in order due to dependencies.

```
US-001 (Payments Selection) → US-002 (Member Selection)
                ↓                           ↓
          US-003 (Bulk Generation Logic) ←──┘
                ↓
          US-004 (UI Integration)
                ↓
          US-005 (Production Readiness)
```

### Getting Started

1. **Read this file completely** (you're here!)
2. **Read `AGENT-GUIDE.md`** for step-by-step workflow
3. **Review `README.md`** for architecture details
4. **Check `STATUS.md`** for current progress
5. **Start with US-001** using `/implement-userstory US-001`

## Feature Scope

### In Scope ✅

- Checkbox selection in payments table
- Checkbox selection in member payment history
- Bulk invoice generation with progress tracking
- ZIP file creation and download
- Error handling and retry logic
- Performance optimization for large batches

### Out of Scope ❌

- Email delivery of ZIP files (P2 - future enhancement)
- Custom ZIP file naming (P2 - future enhancement)
- CSV summary export (P2 - future enhancement)
- Invoice regeneration (use existing invoices when available)

## Key Files to Understand

### Existing Code (Read First)

**Invoice System:**

- `src/features/invoices/lib/invoice-generator.ts` - PDF generation
- `src/features/invoices/lib/invoice-utils.ts` - Business logic
- `src/features/invoices/hooks/use-invoices.ts` - React hook

**Bulk Operation Patterns:**

- `src/features/members/components/BulkActionToolbar.tsx` - Reference implementation
- `src/features/members/components/AdvancedMemberTable.tsx` - Selection pattern

**Payments:**

- `src/app/payments/page.tsx` - Main payments page
- `src/features/payments/components/PaymentHistoryTable.tsx` - Reusable table
- `src/features/payments/hooks/use-all-payments.ts` - Data fetching

### New Files to Create

**Core Logic:**

- `src/features/invoices/hooks/use-bulk-invoice-download.ts` - Bulk download hook
- `src/features/invoices/lib/zip-utils.ts` - ZIP file utilities

**UI Components:**

- `src/features/payments/components/BulkInvoiceToolbar.tsx` - Bulk action toolbar

## Architecture Highlights

### Selection State Management

```typescript
// Pattern used throughout
const [selectedPayments, setSelectedPayments] = useState<Set<string>>(
  new Set()
);

// Select all on current page
const handleSelectAll = () => {
  const allIds = new Set(payments.map((p) => p.id));
  setSelectedPayments(allIds);
};

// Toggle individual
const handleToggle = (id: string) => {
  const newSet = new Set(selectedPayments);
  newSet.has(id) ? newSet.delete(id) : newSet.add(id);
  setSelectedPayments(newSet);
};
```

### Bulk Download Flow

```
1. User selects payments (checkboxes)
2. Clicks "Download Invoices" button
3. System checks for existing invoices
4. Generates missing invoices in batches
5. Fetches all invoice PDFs
6. Creates ZIP archive
7. Triggers browser download
8. Shows result dialog (success/failures)
```

### Progress Tracking

```typescript
interface BulkOperationProgress {
  current: number; // Invoices processed
  total: number; // Total to process
  percentage: number; // Completion %
  currentBatch?: number; // Current batch number
  totalBatches?: number; // Total batches
}
```

## Performance Requirements

### Targets

- **Small Batch (1-10):** <2 seconds
- **Medium Batch (11-50):** <10 seconds
- **Large Batch (51-100):** <30 seconds
- **Max Selection:** 100 invoices (warn if exceeded)

### Optimization Strategies

1. **Batch Processing:** Process 10-20 invoices in parallel
2. **Dynamic Imports:** JSZip loaded only when needed
3. **Memory Management:** Stream to ZIP, clear blobs after adding
4. **Reuse Existing:** Use existing invoice PDFs when available

## Testing Strategy

### Unit Tests

- `use-bulk-invoice-download.ts` - Hook logic
- `zip-utils.ts` - ZIP creation utilities
- Selection state management

### Integration Tests

- Full download flow (small batch)
- Error handling (failed invoice generation)
- Progress tracking accuracy

### Manual Testing Scenarios

1. **Single invoice** - Verify basic flow
2. **10 invoices** - Check performance
3. **50 invoices** - Test progress tracking
4. **Mix of existing/new** - Verify reuse logic
5. **With failures** - Check error handling
6. **Network issues** - Test resilience

## Dependencies

### To Install

```bash
npm install jszip @types/jszip
```

### Already Available

- jsPDF (PDF generation)
- Sonner (toast notifications)
- shadcn/ui components (Checkbox, Dialog, Progress)

## Common Pitfalls to Avoid

❌ **Don't:**

- Load all PDFs into memory at once
- Block UI during generation
- Skip error handling
- Forget to revoke blob URLs
- Use synchronous operations

✅ **Do:**

- Batch process with progress updates
- Show progress dialog
- Handle partial failures gracefully
- Clean up memory (revoke URLs)
- Use async/await throughout

## Success Criteria

### Functional Requirements

- [x] Select payments from filtered results
- [x] Select payments from member details
- [x] Download multiple invoices as ZIP
- [x] Show progress during generation
- [x] Display result summary
- [x] Handle errors gracefully

### Non-Functional Requirements

- [x] Performance meets targets
- [x] No memory leaks
- [x] Accessible UI (keyboard navigation)
- [x] Mobile-responsive (if applicable)
- [x] Proper error logging

## Next Steps

1. **Read `AGENT-GUIDE.md`** - Understand the implementation workflow
2. **Review `README.md`** - Deep dive into architecture
3. **Check `STATUS.md`** - See current progress
4. **Create feature branch** - `git checkout -b feature/bulk-invoice-download`
5. **Start US-001** - `/implement-userstory US-001`

## Questions or Issues?

- Check `README.md` for architecture details
- Review existing bulk operation code in members feature
- Consult `CLAUDE.md` for project standards
- Check research report for codebase specifics

---

**Ready to implement?** → Read `AGENT-GUIDE.md` next!
