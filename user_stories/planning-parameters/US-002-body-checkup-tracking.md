# US-002: Body Checkup Tracking System

**Feature:** Studio Planning Parameters & Visual Indicators
**Story ID:** US-002
**Priority:** P0 (Must Have)
**Estimated Effort:** 2 days
**Dependencies:** None (can be implemented in parallel with US-001)
**Status:** ✅ Completed (2025-10-18)

---

## 📖 User Story

**As a** gym trainer or admin
**I want** to log and track member body checkups with dates, weights, and notes
**So that** I can monitor member progress, maintain checkup schedules, and provide personalized coaching

---

## 💼 Business Value

**Why This Matters:**

- **Member Engagement** - Regular checkups show members their progress, improving retention
- **Service Quality** - Systematic checkup tracking ensures no member is neglected
- **Health & Safety** - Weight and health tracking helps identify potential issues early
- **Competitive Advantage** - Professional tracking differentiates your gym from competitors

**Expected Outcomes:**

- Trainers can log a body checkup in under 1 minute
- Complete checkup history visible on member profile
- Data available for triggering checkup reminder icons (US-003)
- Historical tracking enables trend analysis and reporting

---

## ✅ Acceptance Criteria

### AC-001: Log Body Checkup

**Given** I am viewing a member's profile
**When** I click "Log Body Checkup"
**Then** a dialog should open with a form containing:

- Date picker (default: today)
- Weight input (optional, in kg)
- Notes textarea (optional, for observations/measurements)
- Save and Cancel buttons

**And** when I fill the form and click Save
**Then** the checkup should be saved to the database
**And** I should see a success notification
**And** the dialog should close
**And** the checkup should appear in the member's history

### AC-002: View Checkup History

**Given** a member has one or more body checkups logged
**When** I view their profile
**Then** I should see a "Body Checkup History" section displaying:

- Table with columns: Date, Weight, Notes, Logged By
- Checkups sorted by date (most recent first)
- "Log Checkup" button at the top

**And** if a member has no checkups
**Then** I should see a message: "No body checkups recorded yet"
**And** the "Log Checkup" button should still be visible

### AC-003: Latest Checkup Data

**Given** a member has logged checkups
**When** the system needs to calculate sessions since last checkup (for US-003)
**Then** it should use the most recent checkup date
**And** count only completed training sessions after that date

### AC-004: Validation

**Given** I am logging a body checkup
**When** I leave the date field empty and click Save
**Then** I should see a validation error: "Date is required"
**And** the form should not submit

**Given** I enter a future date
**When** I click Save
**Then** I should see a validation error: "Checkup date cannot be in the future"

**Given** I enter a negative weight
**When** I click Save
**Then** I should see a validation error: "Weight must be a positive number"

### AC-005: Permissions

**Given** I am logged in as an admin or trainer
**Then** I should be able to log body checkups for any member

**Given** I am logged in as a regular staff member (not admin/trainer)
**Then** I should NOT see the "Log Body Checkup" button
**And** I should only be able to view checkup history (read-only)

---

## 🎨 UI/UX Requirements

### Log Checkup Dialog

```
┌─────────────────────────────────────────────┐
│  Log Body Checkup - [Member Name]          │
├─────────────────────────────────────────────┤
│                                             │
│  Checkup Date *                             │
│  ┌─────────────────────────┐               │
│  │  2025-10-18     📅      │               │
│  └─────────────────────────┘               │
│                                             │
│  Weight (kg)                                │
│  ┌─────────────────────────┐               │
│  │  75.5                   │               │
│  └─────────────────────────┘               │
│                                             │
│  Notes (optional)                           │
│  ┌─────────────────────────┐               │
│  │ Good progress! Lost 2kg │               │
│  │ since last checkup.     │               │
│  │                         │               │
│  └─────────────────────────┘               │
│                                             │
│  ┌────────┐  ┌───────────┐                 │
│  │ Cancel │  │   Save    │                 │
│  └────────┘  └───────────┘                 │
│                                             │
└─────────────────────────────────────────────┘
```

### Checkup History Section (on Member Profile)

```
┌─────────────────────────────────────────────────────────┐
│  Body Checkup History              [Log Checkup]        │
├─────────────────────────────────────────────────────────┤
│  Date         │ Weight (kg) │ Notes         │ Logged By │
├───────────────┼─────────────┼───────────────┼───────────┤
│  2025-10-18   │    75.5     │ Good progress │ John Doe  │
│  2025-09-15   │    77.0     │ Starting plan │ Jane Smith│
│  2025-08-10   │    78.2     │ Initial       │ John Doe  │
└─────────────────────────────────────────────────────────┘
```

### Design Specifications

**Components to Use:**

- shadcn/ui Dialog
- shadcn/ui Form with react-hook-form
- shadcn/ui Calendar (date picker)
- shadcn/ui Input (number type for weight)
- shadcn/ui Textarea
- shadcn/ui Table (for history)
- shadcn/ui Button
- shadcn/ui Toast (success/error notifications)

**Styling:**

- Dialog width: `sm:max-w-md`
- Input fields: Full width within dialog
- Table: Responsive, scrollable on mobile
- Empty state: Centered with muted text

---

## 🔧 Technical Implementation

### Database Schema

**Table:** `member_body_checkups`

```sql
CREATE TABLE member_body_checkups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  checkup_date DATE NOT NULL,
  weight DECIMAL(5,2), -- Optional: weight in kg (max 999.99)
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) -- Admin/trainer who logged checkup
);

-- Indexes for performance
CREATE INDEX idx_body_checkups_member ON member_body_checkups(member_id);
CREATE INDEX idx_body_checkups_date ON member_body_checkups(checkup_date DESC);

-- Prevent duplicate checkups on same date for same member
CREATE UNIQUE INDEX idx_unique_member_checkup_date ON member_body_checkups(member_id, checkup_date);
```

**Function:** `get_latest_body_checkup(member_id UUID)`

```sql
CREATE OR REPLACE FUNCTION get_latest_body_checkup(p_member_id UUID)
RETURNS TABLE (
  checkup_date DATE,
  sessions_since_checkup INTEGER
) AS $$
DECLARE
  v_latest_checkup_date DATE;
  v_session_count INTEGER;
BEGIN
  -- Get latest checkup date
  SELECT bc.checkup_date INTO v_latest_checkup_date
  FROM member_body_checkups bc
  WHERE bc.member_id = p_member_id
  ORDER BY bc.checkup_date DESC
  LIMIT 1;

  -- Count sessions since that date
  IF v_latest_checkup_date IS NOT NULL THEN
    SELECT COUNT(*) INTO v_session_count
    FROM training_sessions ts
    WHERE ts.member_id = p_member_id
      AND ts.session_date > v_latest_checkup_date
      AND ts.status = 'completed'; -- Only count completed sessions
  ELSE
    -- No checkup found, count all completed sessions
    SELECT COUNT(*) INTO v_session_count
    FROM training_sessions ts
    WHERE ts.member_id = p_member_id
      AND ts.status = 'completed';
  END IF;

  RETURN QUERY SELECT v_latest_checkup_date, v_session_count;
END;
$$ LANGUAGE plpgsql;
```

### TypeScript Types

**File:** `src/features/members/types.ts` (add to existing file)

```typescript
export interface BodyCheckup {
  id: string;
  member_id: string;
  checkup_date: string; // YYYY-MM-DD format
  weight: number | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CreateBodyCheckupInput {
  member_id: string;
  checkup_date: string; // YYYY-MM-DD format
  weight?: number | null;
  notes?: string | null;
}

export interface BodyCheckupWithUser extends BodyCheckup {
  created_by_user?: {
    name: string;
    email: string;
  };
}
```

### Database Utilities

**File:** `src/features/members/lib/body-checkup-db.ts`

```typescript
import { supabase } from "@/lib/supabase";
import { formatForDatabase } from "@/lib/date-utils";
import type {
  BodyCheckup,
  CreateBodyCheckupInput,
  BodyCheckupWithUser,
} from "../types";

export async function getBodyCheckupHistory(
  memberId: string
): Promise<BodyCheckupWithUser[]> {
  const { data, error } = await supabase
    .from("member_body_checkups")
    .select(
      `
      *,
      created_by_user:auth.users!created_by(name, email)
    `
    )
    .eq("member_id", memberId)
    .order("checkup_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getLatestBodyCheckup(
  memberId: string
): Promise<BodyCheckup | null> {
  const { data, error } = await supabase
    .from("member_body_checkups")
    .select("*")
    .eq("member_id", memberId)
    .order("checkup_date", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error; // Ignore "no rows" error
  return data;
}

export async function createBodyCheckup(
  input: CreateBodyCheckupInput
): Promise<BodyCheckup> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("member_body_checkups")
    .insert({
      member_id: input.member_id,
      checkup_date: formatForDatabase(new Date(input.checkup_date)),
      weight: input.weight,
      notes: input.notes,
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSessionsSinceLastCheckup(
  memberId: string
): Promise<number> {
  const { data, error } = await supabase.rpc("get_latest_body_checkup", {
    p_member_id: memberId,
  });

  if (error) throw error;
  return data?.[0]?.sessions_since_checkup || 0;
}
```

### React Hooks

**File:** `src/features/members/hooks/use-body-checkups.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getBodyCheckupHistory,
  getLatestBodyCheckup,
  createBodyCheckup,
  getSessionsSinceLastCheckup,
} from "../lib/body-checkup-db";
import type { CreateBodyCheckupInput } from "../types";

export function useBodyCheckupHistory(memberId: string) {
  return useQuery({
    queryKey: ["body-checkups", memberId],
    queryFn: () => getBodyCheckupHistory(memberId),
    enabled: !!memberId,
  });
}

export function useLatestBodyCheckup(memberId: string) {
  return useQuery({
    queryKey: ["body-checkup-latest", memberId],
    queryFn: () => getLatestBodyCheckup(memberId),
    enabled: !!memberId,
  });
}

export function useCreateBodyCheckup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBodyCheckup,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["body-checkups", variables.member_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["body-checkup-latest", variables.member_id],
      });
      toast.success("Body checkup logged successfully");
    },
    onError: (error) => {
      toast.error("Failed to log checkup: " + error.message);
    },
  });
}

export function useSessionsSinceCheckup(memberId: string) {
  return useQuery({
    queryKey: ["sessions-since-checkup", memberId],
    queryFn: () => getSessionsSinceLastCheckup(memberId),
    enabled: !!memberId,
  });
}
```

### Components

**File:** `src/features/members/components/BodyCheckupDialog.tsx`

```typescript
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getLocalDateString, getStartOfDay } from "@/lib/date-utils";
import { useCreateBodyCheckup } from "../hooks/use-body-checkups";

const formSchema = z.object({
  checkup_date: z.date().max(new Date(), "Checkup date cannot be in the future"),
  weight: z.number().positive("Weight must be positive").optional().nullable(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BodyCheckupDialogProps {
  memberId: string;
  memberName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BodyCheckupDialog({
  memberId,
  memberName,
  open,
  onOpenChange,
}: BodyCheckupDialogProps) {
  const createCheckup = useCreateBodyCheckup();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      checkup_date: new Date(),
      weight: null,
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    await createCheckup.mutateAsync({
      member_id: memberId,
      checkup_date: getLocalDateString(values.checkup_date),
      weight: values.weight,
      notes: values.notes,
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Body Checkup - {memberName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="checkup_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Checkup Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className="w-full justify-start">
                          {field.value ? getLocalDateString(field.value) : "Select date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > getStartOfDay()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="75.5"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observations, measurements..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCheckup.isPending}>
                {createCheckup.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

**File:** `src/features/members/components/BodyCheckupHistory.tsx`

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBodyCheckupHistory } from "../hooks/use-body-checkups";
import { BodyCheckupDialog } from "./BodyCheckupDialog";

interface BodyCheckupHistoryProps {
  memberId: string;
  memberName: string;
}

export function BodyCheckupHistory({ memberId, memberName }: BodyCheckupHistoryProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: checkups, isLoading } = useBodyCheckupHistory(memberId);

  if (isLoading) return <div>Loading checkup history...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Body Checkup History</h3>
        <Button onClick={() => setDialogOpen(true)}>Log Checkup</Button>
      </div>

      {checkups && checkups.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Weight (kg)</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Logged By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checkups.map((checkup) => (
              <TableRow key={checkup.id}>
                <TableCell>{checkup.checkup_date}</TableCell>
                <TableCell>{checkup.weight || "-"}</TableCell>
                <TableCell>{checkup.notes || "-"}</TableCell>
                <TableCell>{checkup.created_by_user?.name || "Unknown"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground text-center py-4">
          No body checkups recorded yet
        </p>
      )}

      <BodyCheckupDialog
        memberId={memberId}
        memberName={memberName}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
```

---

## 🧪 Testing Requirements

### Unit Tests

**File:** `src/features/members/lib/__tests__/body-checkup-db.test.ts`

Test cases:

- ✅ `getBodyCheckupHistory` returns checkups for a member
- ✅ `getBodyCheckupHistory` returns empty array if no checkups
- ✅ `getLatestBodyCheckup` returns most recent checkup
- ✅ `getLatestBodyCheckup` returns null if no checkups
- ✅ `createBodyCheckup` creates checkup with all fields
- ✅ `createBodyCheckup` handles optional fields (weight, notes)
- ✅ `getSessionsSinceLastCheckup` counts correctly
- ✅ `getSessionsSinceLastCheckup` returns all sessions if no checkup exists

**File:** `src/features/members/hooks/__tests__/use-body-checkups.test.ts`

Test cases:

- ✅ `useBodyCheckupHistory` fetches checkups on mount
- ✅ `useCreateBodyCheckup` mutation creates checkup and invalidates queries
- ✅ Error handling shows toast notification

### Integration Tests

Manual testing checklist:

1. Open a member profile
2. Click "Log Body Checkup"
3. Fill date, weight, notes
4. Click Save
5. Verify success toast
6. Verify checkup appears in history table
7. Refresh page, verify checkup persists
8. Log another checkup
9. Verify both appear in history, sorted by date

Edge cases:

- Date validation: Try future date → Should show error
- Weight validation: Try negative number → Should show error
- Duplicate date: Try logging checkup on same date twice → Should show error
- Optional fields: Log checkup with only date → Should work

---

## 📋 Definition of Done

- [ ] Database migration created and applied successfully
- [ ] `member_body_checkups` table exists with correct schema
- [ ] `get_latest_body_checkup()` function works
- [ ] All database utilities implemented and tested
- [ ] All hooks implemented and tested
- [ ] `BodyCheckupDialog` component implemented and tested
- [ ] `BodyCheckupHistory` component implemented and tested
- [ ] Components integrated into member profile page
- [ ] All unit tests pass (100% coverage)
- [ ] Manual testing completed successfully
- [ ] Code reviewed and approved
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

---

## 🔗 Related User Stories

- **Depends on:** None
- **Blocks:** US-003 (Calendar Visual Indicators - needs checkup data)
- **Related to:** US-001 (Planning Settings - can be done in parallel)

---

## 📝 Notes

- Use `date-utils.ts` for all date handling (especially `formatForDatabase`)
- Member profile page location: Likely `src/app/members/[id]/page.tsx`
- Consider adding permission check (admin/trainer only can log checkups)
- Future enhancement: Allow editing/deleting checkups
- Future enhancement: Charts/graphs of weight progression

---

**Ready to implement?** → See AGENT-GUIDE.md for step-by-step implementation workflow!
