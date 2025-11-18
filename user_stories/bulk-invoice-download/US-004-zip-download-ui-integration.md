# US-004: ZIP Download UI & Integration

**Feature:** Bulk Invoice Download
**Story ID:** US-004
**Priority:** P0 (Must Have)
**Complexity:** Medium
**Estimated Effort:** 4-6 hours

---

## User Story

**As a** gym administrator
**I want** a user interface to trigger bulk invoice downloads with progress tracking
**So that** I can efficiently download multiple invoices and monitor the process

---

## Business Value

**Problem:**
While US-001, US-002, and US-003 provide selection UI and business logic, there's no way for users to actually trigger the bulk download or see progress/results. Users need clear feedback during long-running operations.

**Solution:**
Create a `BulkInvoiceToolbar` component that:

- Shows selection count
- Provides download and clear buttons
- Displays confirmation dialog before downloading
- Shows real-time progress during generation
- Reports success/failure results after completion
- Integrates seamlessly into both payments page and member details

**Value:**

- **User Empowerment:** Clear call-to-action for bulk operations
- **Transparency:** Real-time feedback on progress
- **Confidence:** Confirmation prevents accidental downloads
- **Accountability:** Clear success/failure reporting
- **Efficiency:** Streamlined workflow for bulk operations

---

## Acceptance Criteria

### Functional Requirements

#### AC1: Toolbar Visibility

**Given** I am on the payments page or member details
**When** I have 0 selections
**Then** the bulk invoice toolbar should not be visible
**When** I select 1 or more payments
**Then** the toolbar should appear with selection count

#### AC2: Selection Badge

**Given** the toolbar is visible
**Then** I should see a badge showing the count of selected payments
**And** the badge should use "secondary" variant styling
**And** it should display as "{count} selected"

#### AC3: Download Button

**Given** I have selected payments
**When** the download button is enabled
**Then** it should show "Download Invoices" text
**And** display a download icon
**When** I have selected more than max limit (100)
**Then** the button should be disabled
**And** show warning message "Maximum 100 invoices allowed"

#### AC4: Clear Button

**Given** I have selected payments
**When** I click the "Clear" button
**Then** all selections should be cleared
**And** the toolbar should disappear

#### AC5: Confirmation Dialog

**Given** I click "Download Invoices"
**When** the confirmation dialog appears
**Then** it should show the count of invoices to download
**And** explain the operation ("This will generate a ZIP file...")
**And** provide "Cancel" and "Download" actions
**When** I click "Cancel"
**Then** the dialog should close and no download should start
**When** I click "Download"
**Then** the dialog should close and download should start

#### AC6: Progress Dialog

**Given** the download process has started
**Then** a progress dialog should appear
**And** show "Generating Invoices" title
**And** display current progress (e.g., "Processing 5 of 25")
**And** show a progress bar with percentage
**And** show batch information (e.g., "Batch 1 of 3")
**And** the dialog should not be dismissible (no close button)

#### AC7: Progress Updates

**Given** the progress dialog is visible
**When** invoices are being processed
**Then** the progress should update smoothly
**And** show accurate current/total counts
**And** update the progress bar percentage
**And** update batch information

#### AC8: Result Dialog

**Given** the download completes (successfully or partially)
**Then** the progress dialog should close
**And** a result dialog should appear
**And** show "Download Complete" title
**When** all invoices succeeded
**Then** show "Successfully downloaded {count} invoices"
**When** some invoices failed
**Then** show success count AND failure count
**And** list up to 5 failed items with error messages
**And** indicate if more failures exist ("...and X more")

#### AC9: Selection Clear After Success

**Given** the download completed successfully
**When** I close the result dialog
**Then** all selections should be cleared automatically
**And** the toolbar should disappear

#### AC10: Integration - Payments Page

**Given** I am on the payments page
**When** I select payments and use the toolbar
**Then** the download should process the correct payments
**And** honor any active filters (date range, status, method)

#### AC11: Integration - Member Details

**Given** I am on a member's details page
**When** I select payments from that member's history
**Then** the download should process only that member's payments
**And** selection should be independent from the main payments page

---

## Technical Requirements

### Implementation Details

#### 1. BulkInvoiceToolbar Component

**File:** `src/features/payments/components/BulkInvoiceToolbar.tsx`

**Props Interface:**

```typescript
interface Payment {
  id: string;
  member_id: string;
  subscription_id?: string;
  amount: number;
  receipt_number: string;
}

interface BulkInvoiceToolbarProps {
  selectedPayments: Payment[]; // Full payment objects
  selectedCount: number; // For badge display
  onClearSelection?: () => void; // Callback to clear selection
  maxSelections?: number; // Default: 100
}
```

**Component Structure:**

```typescript
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Download, X } from "lucide-react";
import { useBulkInvoiceDownload } from "@/features/invoices/hooks/use-bulk-invoice-download";
import type { BulkOperationResult } from "@/features/members/lib/types";

export function BulkInvoiceToolbar({
  selectedPayments,
  selectedCount,
  onClearSelection,
  maxSelections = 100,
}: BulkInvoiceToolbarProps) {
  // Dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [result, setResult] = useState<BulkOperationResult | null>(null);

  // Hook for bulk download
  const { downloadInvoices, isProcessing, progress } = useBulkInvoiceDownload();

  // Check if exceeds limit
  const exceedsLimit = selectedCount > maxSelections;

  // Handle download click
  const handleDownloadClick = () => {
    if (exceedsLimit) return;
    setShowConfirmDialog(true);
  };

  // Handle confirm download
  const handleConfirmDownload = async () => {
    setShowConfirmDialog(false);
    setShowProgressDialog(true);

    try {
      // Transform payment data for hook
      const invoiceData = selectedPayments.map((payment) => ({
        paymentId: payment.id,
        memberId: payment.member_id,
        subscriptionId: payment.subscription_id,
        amount: payment.amount,
        receiptNumber: payment.receipt_number,
      }));

      // Process download
      const operationResult = await downloadInvoices(invoiceData);

      // Show results
      setResult(operationResult);
      setShowProgressDialog(false);
      setShowResultDialog(true);

      // Clear selection if any succeeded
      if (operationResult.totalSuccessful > 0) {
        onClearSelection?.();
      }
    } catch (error) {
      // Error already handled by hook (toast shown)
      setShowProgressDialog(false);
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
        <Badge variant="secondary" className="font-semibold">
          {selectedCount} selected
        </Badge>

        <div className="flex-1" />

        <Button
          onClick={handleDownloadClick}
          disabled={selectedCount === 0 || exceedsLimit || isProcessing}
          size="sm"
          variant="default"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Invoices
        </Button>

        <Button
          onClick={onClearSelection}
          disabled={selectedCount === 0 || isProcessing}
          size="sm"
          variant="outline"
        >
          <X className="w-4 h-4 mr-2" />
          Clear
        </Button>

        {exceedsLimit && (
          <p className="text-sm text-destructive">
            Maximum {maxSelections} invoices allowed
          </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Download {selectedCount} Invoice{selectedCount > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a ZIP file containing {selectedCount} invoice PDF
              {selectedCount > 1 ? "s" : ""}. This may take a few moments for large
              batches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDownload}>
              Download
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader>
            <DialogTitle>Generating Invoices</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Processing {progress?.current || 0} of {progress?.total || 0}
                </span>
                <span>{Math.round(progress?.percentage || 0)}%</span>
              </div>
              <Progress value={progress?.percentage || 0} />
            </div>
            {progress?.currentBatch && progress?.totalBatches && (
              <p className="text-sm text-muted-foreground">
                Batch {progress.currentBatch} of {progress.totalBatches}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Download Complete</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Successfully downloaded {result?.totalSuccessful || 0} invoice
                  {result?.totalSuccessful !== 1 ? "s" : ""}.
                </p>
                {result && result.totalFailed > 0 && (
                  <div className="p-3 bg-destructive/10 rounded-md">
                    <p className="font-semibold text-destructive">
                      {result.totalFailed} invoice{result.totalFailed > 1 ? "s" : ""}{" "}
                      failed:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {result.failed.slice(0, 5).map((item) => (
                        <li key={item.id}>
                          Payment ID: {item.id.substring(0, 8)}... - {item.error}
                        </li>
                      ))}
                      {result.failed.length > 5 && (
                        <li>...and {result.failed.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowResultDialog(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

#### 2. Payments Page Integration

**File:** `src/app/payments/page.tsx`

**Add import:**

```typescript
import { BulkInvoiceToolbar } from "@/features/payments/components/BulkInvoiceToolbar";
```

**Compute selected payment objects:**

```typescript
const selectedPaymentObjects = useMemo(() => {
  return data?.payments.filter((p) => selectedPayments.has(p.id)) || [];
}, [data?.payments, selectedPayments]);
```

**Render toolbar (before table):**

```typescript
{selectedPayments.size > 0 && (
  <BulkInvoiceToolbar
    selectedPayments={selectedPaymentObjects}
    selectedCount={selectedPayments.size}
    onClearSelection={handleClearSelection}
  />
)}
```

#### 3. Member Details Integration

**File:** Member details page (wherever PaymentHistoryTable is used)

**Similar integration:**

```typescript
const selectedPaymentObjects = useMemo(() => {
  return payments.filter(p => selectedPayments.has(p.id));
}, [payments, selectedPayments]);

{selectedPayments.size > 0 && (
  <BulkInvoiceToolbar
    selectedPayments={selectedPaymentObjects}
    selectedCount={selectedPayments.size}
    onClearSelection={handleClearSelection}
  />
)}
```

### File Changes

**New Files:**

- `src/features/payments/components/BulkInvoiceToolbar.tsx`

**Modified Files:**

- `src/app/payments/page.tsx`
- Member details page

---

## Dependencies

### Upstream Dependencies

- **US-001:** Payment Selection UI (provides selection state)
- **US-002:** Member Payment Selection UI (provides selection in member context)
- **US-003:** Bulk Invoice Generation Logic (provides hook and utilities)

### Downstream Dependencies

- **US-005:** Production Readiness (final review and optimization)

### External Dependencies

- shadcn/ui components (Button, Badge, Dialog, Progress, AlertDialog)
- lucide-react icons (Download, X)
- useBulkInvoiceDownload hook (from US-003)

---

## Testing Requirements

### Unit Tests

**File:** `src/features/payments/components/__tests__/BulkInvoiceToolbar.test.tsx`

```typescript
describe("BulkInvoiceToolbar", () => {
  it("should render selection badge with count");
  it("should disable download button when no selections");
  it("should disable download button when exceeding max");
  it("should show warning when exceeding max selections");
  it("should call onClearSelection when clear button clicked");
  it("should open confirmation dialog on download click");
});
```

### Integration Tests

**File:** `src/features/payments/__tests__/bulk-download-integration.test.tsx`

```typescript
describe("Bulk Invoice Download Integration", () => {
  it("should complete full download flow");
  it("should handle partial failures");
  it("should clear selection after success");
});
```

### Manual Testing Scenarios

#### Test 1: Basic Flow - Single Invoice

1. Navigate to /payments
2. Select 1 payment
3. ✅ Verify toolbar appears
4. Click "Download Invoices"
5. ✅ Verify confirmation dialog
6. Click "Download"
7. ✅ Verify progress dialog appears briefly
8. ✅ Verify result dialog shows success
9. ✅ Verify ZIP file downloads
10. ✅ Verify selection cleared

#### Test 2: Medium Batch - 10 Invoices

1. Select 10 payments
2. ✅ Verify badge shows "10 selected"
3. Click "Download Invoices"
4. Confirm
5. ✅ Verify progress shows batch info
6. ✅ Verify progress updates smoothly
7. ✅ Verify successful completion

#### Test 3: Large Batch - 50 Invoices

1. Select 50 payments
2. Click "Download Invoices"
3. ✅ Verify progress shows multiple batches
4. ✅ Verify progress percentage increases
5. ✅ Monitor performance (should complete <15s)

#### Test 4: Exceed Max Limit

1. Try to select 101 payments (if possible)
2. ✅ Verify warning message appears
3. ✅ Verify download button disabled
4. Clear selection
5. Select exactly 100
6. ✅ Verify download button enabled

#### Test 5: Cancel Confirmation

1. Select 5 payments
2. Click "Download Invoices"
3. Click "Cancel" in confirmation
4. ✅ Verify dialog closes
5. ✅ Verify no download started
6. ✅ Verify selections still active

#### Test 6: Clear Selection

1. Select 3 payments
2. Click "Clear" button
3. ✅ Verify selections cleared
4. ✅ Verify toolbar disappears

#### Test 7: Partial Failure (simulated)

1. Mock some invoices to fail
2. Select multiple payments
3. Download
4. ✅ Verify result dialog shows both success and failure
5. ✅ Verify failed items listed with errors
6. ✅ Verify ZIP still created with successful invoices

#### Test 8: Member Details Integration

1. Navigate to member details
2. Select member payments
3. ✅ Verify toolbar works same as payments page
4. Download
5. ✅ Verify only that member's invoices downloaded

#### Test 9: Independent Selection State

1. Select payments on main page
2. Navigate to member details
3. ✅ Verify member page has no selections
4. Select member payments
5. Return to main page
6. ✅ Verify original selections still there

#### Test 10: Progress Dialog Not Dismissible

1. Start large download (50+)
2. Try to click outside progress dialog
3. ✅ Verify dialog doesn't close
4. Try to press Escape
5. ✅ Verify dialog stays open

---

## Definition of Done

### Code Quality

- [x] Code follows CLAUDE.md standards
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Component uses proper React patterns
- [x] Event handlers use useCallback where needed
- [x] No console.log statements

### Functionality

- [x] Toolbar appears/disappears based on selection
- [x] All dialogs work correctly
- [x] Progress tracking is accurate
- [x] Result reporting is comprehensive
- [x] Selection clears after success
- [x] Both integrations work (payments & member details)

### User Experience

- [x] Confirmation prevents accidental downloads
- [x] Progress provides clear feedback
- [x] Results are easy to understand
- [x] Error messages are helpful
- [x] Workflow feels smooth and responsive

### Testing

- [x] All manual test scenarios pass
- [x] Unit tests written and passing
- [x] Integration tests written and passing
- [x] Tested with various batch sizes
- [x] Tested with error scenarios

### Integration

- [x] Works in payments page
- [x] Works in member details
- [x] Selection states are independent
- [x] No conflicts with existing features

### Documentation

- [x] Component is self-documenting
- [x] Complex logic has comments
- [x] Props interface is clear

### Git

- [x] Changes committed properly
- [x] Commit message: `feat(payments): add bulk invoice download UI and integration (US-004)`
- [x] Pushed to feature branch

---

## Implementation Notes

### Design Decisions

**Why Three Separate Dialogs?**

- **Confirmation:** Prevents accidental bulk operations
- **Progress:** Keeps user informed during long operations
- **Result:** Provides closure and accountability

**Why Make Progress Dialog Non-Dismissible?**
Prevents users from accidentally interrupting the download process, which could leave partial state.

**Why useMemo for selectedPaymentObjects?**
Prevents unnecessary re-computation and re-renders when selection state changes but payment list hasn't.

**Why Clear Selection on Success?**
Prevents confusion about which payments were just processed. User expects fresh state after operation completes.

### UX Considerations

**Progress Granularity:**

- Show current/total for context
- Show percentage for visual progress
- Show batch info for transparency

**Error Reporting:**

- List first 5 failures to keep dialog readable
- Indicate if more exist to set expectations
- Include error messages for debugging

**Button States:**

- Disabled when no selections (prevents confusion)
- Disabled when exceeding limit (prevents errors)
- Disabled during processing (prevents double-trigger)

### Performance

**useMemo for Derived Data:**

```typescript
// Prevents filtering on every render
const selectedPaymentObjects = useMemo(() => {
  return payments.filter((p) => selectedPayments.has(p.id));
}, [payments, selectedPayments]);
```

**Dialog State Management:**

```typescript
// Only one dialog open at a time
// State machine: None → Confirm → Progress → Result
```

### Future Enhancements

**P2 Features (not in this story):**

1. **Download Cancel Button:**

   ```typescript
   <Button onClick={cancelDownload}>Cancel Download</Button>
   ```

2. **Email Option for Large Batches:**

   ```typescript
   if (selectedCount > 50) {
     showEmailOption = true;
   }
   ```

3. **Download History:**

   ```typescript
   // Track recent bulk downloads
   // Allow re-download without re-selecting
   ```

4. **Custom Filename:**
   ```typescript
   <Input placeholder="invoices-january" />
   ```

---

## Rollback Plan

**If issues arise:**

1. **Hide Toolbar:**

   ```typescript
   const ENABLE_BULK_DOWNLOAD = false;
   if (!ENABLE_BULK_DOWNLOAD) return null;
   ```

2. **Revert Integration:**

   ```bash
   git checkout HEAD~1 -- src/app/payments/page.tsx
   ```

3. **Remove Component:**
   ```bash
   git checkout HEAD~1 -- src/features/payments/components/BulkInvoiceToolbar.tsx
   ```

---

## Success Metrics

### Immediate Metrics

- Component renders without errors
- All dialogs function correctly
- Progress updates smoothly
- Results display accurately

### User Experience Metrics

- Users understand how to trigger download
- Progress feedback reduces anxiety
- Error messages help resolve issues
- Success rate >95%

### Performance Metrics

- UI remains responsive during download
- Progress updates don't cause lag
- Dialog transitions are smooth

### Integration Metrics

- Works correctly in both locations
- No conflicts with existing features
- Selection states remain independent

---

## References

### Related Components

- `src/features/members/components/BulkActionToolbar.tsx` - Similar pattern
- `src/components/ui/dialog.tsx` - Dialog component
- `src/components/ui/alert-dialog.tsx` - AlertDialog component
- `src/components/ui/progress.tsx` - Progress component

### Hooks

- `src/features/invoices/hooks/use-bulk-invoice-download.ts` - Core logic

### Patterns

- **Dialog State Machine:** Sequential dialog flow
- **Derived State Pattern:** useMemo for computed values
- **Callback Pattern:** onClearSelection callback
- **Conditional Rendering:** Toolbar visibility

### Standards

- CLAUDE.md - Component Guidelines
- CLAUDE.md - User Experience Standards
- shadcn/ui Documentation

---

**Story Status:** ⏳ Not Started
**Last Updated:** 2025-01-18
**Assigned To:** Implementation Agent
**Dependencies:** US-001, US-002, US-003
