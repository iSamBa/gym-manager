# Invoice Generation System - START HERE

## 🎯 Feature Overview

This feature adds a complete invoice management system to the gym management application. It enables automatic generation of professional A4-format invoices for all payments, with admin-configurable business settings and automated daily invoice numbering.

## 📋 Quick Start

**New to this feature?** Follow these steps:

1. **Read this file** - Understand the feature scope and structure
2. **Read [AGENT-GUIDE.md](./AGENT-GUIDE.md)** - Systematic implementation workflow
3. **Review [README.md](./README.md)** - Technical architecture and design
4. **Check [STATUS.md](./STATUS.md)** - Current progress and next steps
5. **Start implementing** - Use `/implement-userstory US-001` command

## 🎭 User Personas

### Primary User: Gym Administrator

**Goals:**

- Configure business information (logo, address, tax details) once
- Have invoices automatically generated for all payments
- Download and view invoices for accounting purposes
- Customize invoice settings (VAT rate, footer notes)

**Pain Points:**

- Currently no way to generate invoices for payments
- Need professional invoices for accounting compliance
- Manual invoice creation is time-consuming

### Secondary User: Gym Member

**Goals:**

- Receive professional invoices for payments made
- Download invoices for personal records

## 📦 What's Already Done

### ✅ Database Infrastructure (Completed)

- `invoices` table created with all fields
- Daily invoice counter system (`invoice_counters` table)
- RPC functions: `generate_invoice_number()`, `get_next_invoice_number()`
- Indexes for performance on member_id, payment_id, issue_date

### ✅ Storage Infrastructure (Completed)

- Supabase Storage bucket `business-assets` created
- Storage policies for logo (public read, admin write)
- Storage policies for invoices (authenticated read, admin write)
- Folder structure: `company-logo.png` + `invoices/YYYY/MM/`

### ✅ TypeScript Types (Completed)

- `Invoice`, `InvoiceWithMember`, `InvoiceWithPayment` interfaces
- `GeneralSettings` interface (business info)
- `InvoiceSettings` interface (VAT rate, footer notes, auto-generate)
- `BusinessAddress` interface
- `InvoiceStatus` enum type

## 📚 User Stories Breakdown

### US-001: General Settings Tab

**Status:** Not Started
**Priority:** P0 (Must Have)
**Complexity:** Medium
**Dependencies:** None

Create the General Settings tab where admins can configure reusable business information: company name, address, tax ID, phone, email, and logo upload.

**Key Deliverables:**

- GeneralTab component with form
- Logo upload with preview
- Settings persistence using existing studio_settings infrastructure

[👉 Read Full Story](./US-001-general-settings-tab.md)

---

### US-002: Invoice Settings Tab

**Status:** Not Started
**Priority:** P0 (Must Have)
**Complexity:** Small
**Dependencies:** None

Create the Invoice Settings tab where admins can configure invoice-specific options: VAT rate, footer notes, and auto-generation toggle.

**Key Deliverables:**

- InvoiceSettingsTab component
- VAT rate percentage input
- Invoice footer notes textarea
- Auto-generate toggle

[👉 Read Full Story](./US-002-invoice-settings-tab.md)

---

### US-003: Invoice PDF Generation Engine

**Status:** Not Started
**Priority:** P0 (Must Have)
**Complexity:** Large
**Dependencies:** US-001, US-002

Build the core invoice PDF generation engine that creates A4-format invoices matching the provided design template.

**Key Deliverables:**

- `generateInvoicePDF()` function in pdf-generator.ts
- A4 layout with logo, business info, invoice table
- Amount in words conversion
- Invoice creation utilities

[👉 Read Full Story](./US-003-invoice-pdf-generation.md)

---

### US-004: Automatic Invoice Generation on Payment

**Status:** Not Started
**Priority:** P1 (Should Have)
**Complexity:** Medium
**Dependencies:** US-003

Integrate invoice generation into the payment recording flow, with automatic generation based on settings and manual trigger option.

**Key Deliverables:**

- Auto-generate on payment recording
- Manual "Generate Invoice" button
- Invoice storage in Supabase
- Link invoice to payment record

[👉 Read Full Story](./US-004-automatic-invoice-generation.md)

---

### US-005: Invoice Viewing in Payment History

**Status:** Not Started
**Priority:** P0 (Must Have)
**Complexity:** Small
**Dependencies:** US-004

Add invoice viewing and download capabilities to the payment history table.

**Key Deliverables:**

- "View Invoice" button in PaymentHistoryTable
- Invoice PDF download
- Invoice preview dialog (optional)

[👉 Read Full Story](./US-005-invoice-viewing.md)

---

### US-006: Testing & Edge Cases

**Status:** Not Started
**Priority:** P1 (Should Have)
**Complexity:** Medium
**Dependencies:** US-001, US-002, US-003, US-004, US-005

Comprehensive testing and edge case handling for the invoice system.

**Key Deliverables:**

- Unit tests for all utilities
- Component tests
- Integration tests
- Edge case handling

[👉 Read Full Story](./US-006-testing-edge-cases.md)

---

## 🗺️ Implementation Roadmap

### Phase 1: Foundation (US-001, US-002)

**Goal:** Settings infrastructure ready
**Duration:** ~2-3 hours
**Output:** Admins can configure business and invoice settings

### Phase 2: Core Engine (US-003)

**Goal:** Invoice PDF generation working
**Duration:** ~3-4 hours
**Output:** Can generate invoice PDFs programmatically

### Phase 3: Integration (US-004, US-005)

**Goal:** End-to-end invoice flow working
**Duration:** ~2-3 hours
**Output:** Invoices auto-generate on payment and are viewable

### Phase 4: Quality (US-006)

**Goal:** Production-ready with tests
**Duration:** ~2-3 hours
**Output:** Fully tested, edge cases handled

**Total Estimated Duration:** 9-13 hours

## 🎯 Success Criteria

This feature is complete when:

- ✅ Admins can configure business info and logo in General tab
- ✅ Admins can configure invoice settings in Invoice tab
- ✅ Invoices auto-generate for all payments (if enabled)
- ✅ Invoice number format: DDMMYYYY-XX (daily counter reset)
- ✅ PDF matches provided design (A4, logo, table, footer)
- ✅ Invoices stored in Supabase Storage (organized by year/month)
- ✅ Invoices viewable/downloadable from payment history
- ✅ All tests passing
- ✅ Edge cases handled (missing settings, upload failures, etc.)

## 📖 Next Steps

1. **Read [AGENT-GUIDE.md](./AGENT-GUIDE.md)** - Understand the implementation workflow
2. **Review [README.md](./README.md)** - Study the technical architecture
3. **Run** `/implement-userstory US-001` - Start with General Settings Tab
4. **Update [STATUS.md](./STATUS.md)** - Track your progress

## 🆘 Need Help?

- **Architecture questions?** → See [README.md](./README.md)
- **Implementation stuck?** → Check [AGENT-GUIDE.md](./AGENT-GUIDE.md)
- **Progress tracking?** → Update [STATUS.md](./STATUS.md)
- **Specific user story?** → Read the individual US-XXX files

---

**Ready to start?** Run `/implement-userstory US-001` to begin! 🚀
