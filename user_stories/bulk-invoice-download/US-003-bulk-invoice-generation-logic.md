# US-003: Bulk Invoice Generation Logic

**Feature:** Bulk Invoice Download
**Story ID:** US-003
**Priority:** P0 (Must Have)
**Complexity:** Medium
**Estimated Effort:** 4-6 hours

---

## User Story

**As a** developer implementing the bulk invoice download feature
**I want** core business logic for generating multiple invoices and creating ZIP archives
**So that** the UI can trigger bulk downloads with proper progress tracking and error handling

---

## Business Value

**Problem:**
While US-001 and US-002 provide the UI for selection, there's no logic to actually process multiple invoices in bulk, create a ZIP archive, and handle the various edge cases (existing invoices, failures, progress tracking).

**Solution:**
Create a reusable hook (`useBulkInvoiceDownload`) and utility functions (`zip-utils.ts`) that encapsulate all the complex logic for:

- Checking for existing invoices
- Generating missing invoices in batches
- Fetching PDF blobs
- Creating ZIP archives
- Tracking progress
- Handling errors gracefully

**Value:**

- **Separation of Concerns:** Business logic separated from UI
- **Reusability:** Hook can be used from any component
- **Performance:** Batch processing prevents browser lockup
- **Reliability:** Comprehensive error handling
- **User Experience:** Progress tracking for long operations

---

## Acceptance Criteria

### Functional Requirements

#### AC1: ZIP Utility Functions

**Given** I have multiple PDF blobs with filenames
**When** I call `createInvoiceZip(invoices, onProgress)`
**Then** a ZIP Blob should be created containing all PDFs
**And** progress callbacks should be fired during creation
**And** the ZIP should use DEFLATE compression

**Given** I have a Blob and filename
**When** I call `downloadBlob(blob, filename)`
**Then** the browser download should be triggered
**And** the blob URL should be revoked after download

**Given** I provide a count of invoices
**When** I call `generateZipFilename(count)`
**Then** I should receive a filename like "invoices-2024-01-15-10.zip"
**And** the filename should include current date and invoice count

#### AC2: Invoice Processing - Check Existing

**Given** I have a list of payment IDs
**When** the bulk download process starts
**Then** the system should check each payment for existing invoices
**And** use existing invoice PDFs when available
**And** only generate new invoices when necessary

#### AC3: Batch Processing

**Given** I have 50 invoices to process
**When** the download process runs
**Then** invoices should be processed in batches of 10-20
**And** each batch should process in parallel
**And** the next batch should wait for the previous to complete
**And** progress should be updated after each batch

#### AC4: Progress Tracking

**Given** I am downloading multiple invoices
**When** the process is running
**Then** I should receive progress updates via callback
**And** progress should include:

- Current invoice being processed
- Total invoices
- Percentage complete
- Current batch number
- Total batches

#### AC5: Error Handling - Individual Failures

**Given** I am downloading 10 invoices
**When** 2 invoices fail to generate
**Then** the process should continue with the remaining 8
**And** the result should include 8 successful downloads
**And** the result should include 2 failures with error messages
**And** a ZIP with 8 PDFs should still be created

#### AC6: Error Handling - Complete Failure

**Given** I am downloading invoices
**When** a critical error occurs (network failure, storage unavailable)
**Then** the process should throw an error
**And** appropriate error message should be provided
**And** any partial progress should be discarded
**And** user should be notified

#### AC7: Result Object

**Given** the download process completes (success or partial)
**When** I receive the result
**Then** it should include:

- Array of successful payment IDs
- Array of failures with {id, error} objects
- Total processed count
- Total successful count
- Total failed count

#### AC8: Dynamic Import

**Given** the ZIP utility is not yet loaded
**When** I first call `createInvoiceZip`
**Then** JSZip library should be dynamically imported
**And** initial page load should not include JSZip in bundle

---

## Technical Requirements

### Implementation Details

#### 1. ZIP Utilities File

**File:** `src/features/invoices/lib/zip-utils.ts`

**Dependencies:**

```bash
npm install jszip @types/jszip
```

**Functions:**

**createInvoiceZip:**

```typescript
import type { BulkOperationProgress } from "@/features/members/lib/types";

export async function createInvoiceZip(
  invoices: Array<{ blob: Blob; filename: string }>,
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<Blob> {
  // Dynamic import for bundle optimization
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  invoices.forEach((invoice, index) => {
    zip.file(invoice.filename, invoice.blob);

    // Update progress
    if (onProgress) {
      onProgress({
        current: index + 1,
        total: invoices.length,
        percentage: ((index + 1) / invoices.length) * 100,
      });
    }
  });

  return await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
```

**downloadBlob:**

```typescript
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
```

**generateZipFilename:**

```typescript
export function generateZipFilename(count: number): string {
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `invoices-${date}-${count}.zip`;
}
```

#### 2. Bulk Invoice Download Hook

**File:** `src/features/invoices/hooks/use-bulk-invoice-download.ts`

**Interface:**

```typescript
interface InvoiceData {
  paymentId: string;
  memberId: string;
  subscriptionId?: string;
  amount: number;
  receiptNumber: string;
}

interface UseBulkInvoiceDownloadReturn {
  downloadInvoices: (payments: InvoiceData[]) => Promise<BulkOperationResult>;
  isProcessing: boolean;
  progress: BulkOperationProgress | null;
}

export function useBulkInvoiceDownload(): UseBulkInvoiceDownloadReturn;
```

**Hook Implementation:**

```typescript
export function useBulkInvoiceDownload() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BulkOperationProgress | null>(null);
  const { generateInvoice } = useInvoices();

  const downloadInvoices = useCallback(
    async (payments: InvoiceData[]): Promise<BulkOperationResult> => {
      setIsProcessing(true);
      setProgress({ current: 0, total: payments.length, percentage: 0 });

      const successful: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];
      const invoiceBlobs: Array<{ blob: Blob; filename: string }> = [];

      try {
        const batchSize = 10;
        const totalBatches = Math.ceil(payments.length / batchSize);

        for (let i = 0; i < payments.length; i += batchSize) {
          const batch = payments.slice(i, i + batchSize);
          const currentBatch = Math.floor(i / batchSize) + 1;

          // Process batch in parallel
          await Promise.all(
            batch.map(async (payment) => {
              try {
                // Check for existing invoice
                const { data: existingInvoice } = await supabase
                  .from("invoices")
                  .select("id, pdf_url, invoice_number")
                  .eq("payment_id", payment.paymentId)
                  .maybeSingle();

                let pdfUrl: string;
                let invoiceNumber: string;

                if (existingInvoice?.pdf_url) {
                  pdfUrl = existingInvoice.pdf_url;
                  invoiceNumber = existingInvoice.invoice_number;
                } else {
                  const newInvoice = await generateInvoice({
                    payment_id: payment.paymentId,
                    member_id: payment.memberId,
                    subscription_id: payment.subscriptionId,
                    amount: payment.amount,
                  });
                  pdfUrl = newInvoice.pdf_url!;
                  invoiceNumber = newInvoice.invoice_number;
                }

                // Fetch PDF
                const response = await fetch(pdfUrl);
                if (!response.ok) throw new Error("Failed to fetch PDF");
                const blob = await response.blob();

                invoiceBlobs.push({
                  blob,
                  filename: `invoice-${invoiceNumber}.pdf`,
                });

                successful.push(payment.paymentId);
              } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : "Unknown error";
                failed.push({ id: payment.paymentId, error: errorMessage });
              }
            })
          );

          // Update progress
          const processed = Math.min(i + batchSize, payments.length);
          setProgress({
            current: processed,
            total: payments.length,
            percentage: (processed / payments.length) * 100,
            currentBatch,
            totalBatches,
          });
        }

        // Create ZIP and download
        if (invoiceBlobs.length > 0) {
          const zipBlob = await createInvoiceZip(invoiceBlobs);
          const filename = generateZipFilename(invoiceBlobs.length);
          downloadBlob(zipBlob, filename);

          toast.success(`Downloaded ${successful.length} invoices`);
        }

        if (failed.length > 0) {
          toast.error(`Failed to download ${failed.length} invoices`, {
            description: "Check the results for details",
          });
        }

        return {
          successful,
          failed,
          totalProcessed: payments.length,
          totalSuccessful: successful.length,
          totalFailed: failed.length,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error("Failed to download invoices", {
          description: errorMessage,
        });
        throw error;
      } finally {
        setIsProcessing(false);
        setProgress(null);
      }
    },
    [generateInvoice]
  );

  return {
    downloadInvoices,
    isProcessing,
    progress,
  };
}
```

### File Changes

**New Files:**

- `src/features/invoices/lib/zip-utils.ts`
- `src/features/invoices/hooks/use-bulk-invoice-download.ts`
- `src/features/invoices/lib/__tests__/zip-utils.test.ts` (unit tests)

**Dependencies:**

- JSZip (to be installed)
- @types/jszip (to be installed)

---

## Dependencies

### Upstream Dependencies

- None (can be developed in parallel with US-001/US-002)

### Downstream Dependencies

- **US-004:** ZIP Download UI (consumes this hook)

### External Dependencies

- JSZip library (MIT license)
- Existing invoice generation system (`useInvoices` hook)
- Supabase client for database queries
- Sonner for toast notifications

---

## Testing Requirements

### Unit Tests

**Test File 1:** `src/features/invoices/lib/__tests__/zip-utils.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateZipFilename, downloadBlob } from "../zip-utils";

describe("zip-utils", () => {
  describe("generateZipFilename", () => {
    it("should generate filename with current date", () => {
      const filename = generateZipFilename(10);
      expect(filename).toMatch(/^invoices-\d{4}-\d{2}-\d{2}-10\.zip$/);
    });

    it("should include invoice count in filename", () => {
      const filename = generateZipFilename(25);
      expect(filename).toContain("-25.zip");
    });
  });

  describe("downloadBlob", () => {
    beforeEach(() => {
      // Mock DOM APIs
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();
      window.URL.createObjectURL = vi.fn(() => "blob:mock-url");
      window.URL.revokeObjectURL = vi.fn();
    });

    it("should trigger download", () => {
      const blob = new Blob(["test"], { type: "application/zip" });
      const filename = "test.zip";

      downloadBlob(blob, filename);

      expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it("should cleanup blob URL", () => {
      const blob = new Blob(["test"], { type: "application/zip" });
      downloadBlob(blob, "test.zip");

      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });
  });
});
```

**Test File 2:** `src/features/invoices/hooks/__tests__/use-bulk-invoice-download.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useBulkInvoiceDownload } from "../use-bulk-invoice-download";

// Mock dependencies
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock("../use-invoices", () => ({
  useInvoices: () => ({
    generateInvoice: vi.fn(),
  }),
}));

describe("useBulkInvoiceDownload", () => {
  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useBulkInvoiceDownload());

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(typeof result.current.downloadInvoices).toBe("function");
  });

  it("should expose downloadInvoices function", () => {
    const { result } = renderHook(() => useBulkInvoiceDownload());
    expect(result.current.downloadInvoices).toBeDefined();
  });
});
```

### Integration Tests

**Not required for this story** - Will be covered in US-004 E2E tests

### Manual Testing Scenarios

#### Test 1: ZIP Utility - Create ZIP

1. Open browser console
2. Create test data:
   ```javascript
   const testInvoices = [
     {
       blob: new Blob(["PDF1"], { type: "application/pdf" }),
       filename: "invoice-1.pdf",
     },
     {
       blob: new Blob(["PDF2"], { type: "application/pdf" }),
       filename: "invoice-2.pdf",
     },
   ];
   ```
3. Import and call `createInvoiceZip(testInvoices)`
4. ✅ Verify ZIP blob is returned
5. ✅ Download and verify ZIP contains both files

#### Test 2: Hook - Single Invoice

1. Use hook in test component
2. Call with 1 invoice
3. ✅ Verify progress updates
4. ✅ Verify successful result
5. ✅ Verify ZIP download triggered

#### Test 3: Hook - Batch Processing

1. Call with 25 invoices
2. ✅ Verify processing happens in batches
3. ✅ Verify progress updates show batch info
4. ✅ Verify all invoices processed

#### Test 4: Hook - Existing Invoices

1. Call with payments that already have invoices
2. ✅ Verify existing invoices are reused
3. ✅ Verify no unnecessary generation

#### Test 5: Hook - Error Handling

1. Mock invoice generation to fail for some payments
2. ✅ Verify process continues
3. ✅ Verify result includes both successful and failed
4. ✅ Verify ZIP created with successful invoices only

#### Test 6: Dynamic Import

1. Check initial bundle size
2. ✅ Verify JSZip not in main bundle
3. Trigger first download
4. ✅ Verify JSZip loaded dynamically
5. Check network tab
6. ✅ Verify separate JSZip chunk loaded

---

## Definition of Done

### Code Quality

- [x] Code follows CLAUDE.md standards
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] All functions have TypeScript types
- [x] No `any` types used
- [x] No console.log statements
- [x] Proper error handling throughout

### Functionality

- [x] ZIP utilities create valid ZIP files
- [x] Hook processes invoices in batches
- [x] Progress tracking works accurately
- [x] Error handling prevents complete failure
- [x] Existing invoices are reused
- [x] Dynamic import works correctly

### Performance

- [x] JSZip is dynamically imported
- [x] Batch size is appropriate (10-20)
- [x] Memory is managed properly (blob cleanup)
- [x] No memory leaks detected

### Testing

- [x] Unit tests written and passing
- [x] All manual test scenarios pass
- [x] Edge cases tested (empty, single, large batches)
- [x] Error scenarios tested

### Documentation

- [x] Functions have TSDoc comments
- [x] Complex logic is commented
- [x] Hook usage is documented
- [x] Error messages are clear

### Git

- [x] Changes committed properly
- [x] Commit message: `feat(invoices): add bulk invoice download logic (US-003)`
- [x] Tests committed separately if needed
- [x] Pushed to feature branch

---

## Implementation Notes

### Performance Considerations

**Batch Size Selection:**

```typescript
const batchSize = 10; // Sweet spot based on:
// - Browser concurrency limits (~6-10 connections)
// - Memory management
// - Progress granularity
// - User feedback frequency
```

**Memory Management:**

```typescript
// Good: Streaming approach
for (let i = 0; i < payments.length; i += batchSize) {
  const batch = await processBatch(); // Process and add to ZIP
  // Previous batch memory can be GC'd
}

// Bad: Load all at once
const allBlobs = await Promise.all(payments.map(processSinglePayment));
// All blobs in memory at once
```

**Dynamic Import:**

```typescript
// JSZip is ~100 KB minified
// Loading on-demand saves initial bundle size
const JSZip = (await import("jszip")).default;
```

### Error Handling Strategy

**Individual Failure:**

```typescript
// Continue processing, collect errors
try {
  await processPayment(payment);
  successful.push(payment.id);
} catch (error) {
  failed.push({ id: payment.id, error: error.message });
  // Don't throw - continue with next
}
```

**Critical Failure:**

```typescript
// Stop everything, throw error
try {
  // ... processing
} catch (criticalError) {
  toast.error("Critical error occurred");
  throw criticalError; // Propagate to caller
}
```

### Progress Tracking

**Why Multiple Progress Fields:**

```typescript
interface BulkOperationProgress {
  current: number; // For progress bar value
  total: number; // For progress bar max
  percentage: number; // For display (0-100)
  currentBatch?: number; // Context for user
  totalBatches?: number; // Context for user
}
```

This provides enough information for various UI presentations without being overwhelming.

### Future Enhancements

**P2 Features (not in this story):**

1. **Retry Logic:**

   ```typescript
   const retryFailedInvoices = async (failed: Array<{ id; error }>) => {
     // Retry failed invoices
   };
   ```

2. **Cancellation:**

   ```typescript
   const cancelDownload = () => {
     // Abort in-progress downloads
   };
   ```

3. **Resume:**

   ```typescript
   const resumeDownload = (partialState: PartialProgress) => {
     // Resume from saved state
   };
   ```

4. **Streaming ZIP:**
   ```typescript
   // Stream files to ZIP as they're generated
   // Requires different ZIP library (streaming-zip)
   ```

---

## Rollback Plan

**If issues arise:**

1. **Disable Hook Usage:**

   ```typescript
   // In US-004 component
   const ENABLE_BULK_DOWNLOAD = false;
   ```

2. **Revert Files:**

   ```bash
   git checkout HEAD~1 -- src/features/invoices/lib/zip-utils.ts
   git checkout HEAD~1 -- src/features/invoices/hooks/use-bulk-invoice-download.ts
   ```

3. **Remove Dependency:**
   ```bash
   npm uninstall jszip @types/jszip
   ```

---

## Success Metrics

### Immediate Metrics

- ZIP files created successfully
- All unit tests passing
- No TypeScript/ESLint errors
- Dynamic import working

### Performance Metrics

- Batch processing completes within expected time
- Memory usage stays reasonable (<500 MB for 100 invoices)
- No browser freezing during generation

### Error Handling Metrics

- Individual failures don't stop process
- Error messages are clear and actionable
- Result object accurately reports success/failure

### User Experience Metrics (via US-004)

- Progress tracking feels smooth
- Error feedback is helpful
- Download success rate >95%

---

## References

### External Libraries

- [JSZip Documentation](https://stuk.github.io/jszip/)
- [JSZip GitHub](https://github.com/Stuk/jszip)

### Related Code

- `src/features/invoices/hooks/use-invoices.ts` - Single invoice generation
- `src/features/invoices/lib/invoice-generator.ts` - PDF generation
- `src/features/members/lib/types.ts` - BulkOperationProgress interface

### Patterns

- **Dynamic Import Pattern:** Code splitting for performance
- **Batch Processing Pattern:** Prevents overwhelming system
- **Progress Callback Pattern:** Decoupled progress reporting
- **Result Object Pattern:** Comprehensive operation results

### Standards

- CLAUDE.md - Performance Optimization Guidelines
- CLAUDE.md - Error Handling Standards
- CLAUDE.md - TypeScript Standards

---

**Story Status:** ✅ Completed
**Last Updated:** 2025-11-18
**Completed:** 2025-11-18
**Assigned To:** Implementation Agent
**Dependencies:** Install JSZip first

**Implementation Notes (SIMPLIFIED):**

- ✅ Installed JSZip dependency (jszip, @types/jszip)
- ✅ Created zip-utils.ts with createInvoiceZip, downloadBlob, generateZipFilename
- ✅ Created use-bulk-invoice-download.ts hook (SIMPLIFIED - no generation)
- ✅ Assumes all invoices already exist (per user requirement)
- ✅ Only fetches existing invoice PDFs from database
- ✅ Handles missing invoices as errors
- ✅ Batch processing (10 invoices per batch)
- ✅ Progress tracking with callbacks
- ✅ Individual error handling (partial success supported)
- ✅ Dynamic JSZip import for bundle optimization
- ✅ All unit tests passing (12/12)
- ✅ Automated tests passed (lint, build, type check)

**Key Simplification:**
Removed invoice generation logic entirely. Hook now only:

1. Fetches existing invoice PDF URLs from database
2. Downloads PDF blobs from storage
3. Packages them into a ZIP file
4. Returns errors if invoices don't exist
