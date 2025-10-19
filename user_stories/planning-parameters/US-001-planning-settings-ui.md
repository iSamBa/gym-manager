# US-001: Planning Settings UI & CRUD

**Feature:** Studio Planning Parameters & Visual Indicators
**Story ID:** US-001
**Priority:** P0 (Must Have)
**Estimated Effort:** 2-3 days
**Dependencies:** None
**Status:** ✅ Completed
**Completed:** 2025-10-18
**Implementation Notes:** Database schema created, all utilities and components implemented. All automated tests passing (11/11). Planning tab integrated into Studio Settings. Manual testing instructions provided for user verification.

---

## 📖 User Story

**As a** gym administrator
**I want** to configure planning parameters for subscription warnings, body checkups, payment reminders, session limits, and auto-inactivation
**So that** I can customize operational workflows to match my studio's policies and improve member care automation

---

## 💼 Business Value

**Why This Matters:**

- **Operational Flexibility** - Different studios have different policies (e.g., 30-day vs 45-day subscription warnings)
- **Revenue Protection** - Configurable payment reminders ensure timely collections
- **Scalability** - Session limits prevent overbooking and maintain service quality
- **Member Retention** - Proactive reminders improve member experience and reduce churn

**Expected Outcomes:**

- Admins can set and update planning parameters in under 2 minutes
- All 5 parameters configurable from a single, intuitive interface
- Changes take effect immediately across the system
- Settings persist and survive database migrations

---

## ✅ Acceptance Criteria

### AC-001: Settings Management Interface

**Given** I am logged in as an admin
**When** I navigate to Studio Settings and click the "Planning" tab
**Then** I should see a form with 5 configurable parameters:

1. Subscription expiration warning (days before end)
2. Body checkup reminder (sessions since last checkup)
3. Payment reminder (days since last payment)
4. Maximum sessions per week (studio-wide limit)
5. Auto-inactivation threshold (months without attendance)

**And** each parameter should have:

- Clear label with descriptive text
- Number input field with current value
- Validation (minimum 1, maximum 999)

**And** parameters 1-3 (subscription, body checkup, payment) should have:

- Icon preview showing what icon will appear in calendar next to the input

### AC-002: Update Settings

**Given** I have modified one or more planning parameters
**When** I click the "Save" button
**Then** the settings should be saved to the database
**And** I should see a success notification
**And** the form should display the updated values

### AC-003: Validation

**Given** I enter an invalid value (e.g., 0, negative number, or non-numeric)
**When** I try to save
**Then** I should see a validation error message
**And** the form should not submit
**And** the invalid field should be highlighted

### AC-004: Initial Settings

**Given** the studio has never configured planning parameters
**When** I open the Planning tab for the first time
**Then** the form should display sensible default values:

- Subscription warning: 35 days
- Body checkup: 5 sessions
- Payment reminder: 27 days
- Max sessions/week: 250
- Inactivity threshold: 6 months

### AC-005: Error Handling

**Given** a database error occurs while saving
**When** I click save
**Then** I should see a user-friendly error message
**And** the form should remain editable
**And** my unsaved changes should still be visible

---

## 🎨 UI/UX Requirements

### Layout

```
┌─────────────────────────────────────────────────────────┐
│                    Studio Settings                       │
├─────────────────────────────────────────────────────────┤
│  General | Opening Hours | [Planning] | ...             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Planning Parameters                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  Subscription Expiration Warning                         │
│  ┌─────────┐  🏜️                                       │
│  │   35    │  Hourglass icon                            │
│  └─────────┘                                            │
│  Show warning this many days before subscription ends   │
│                                                          │
│  Body Checkup Reminder                                   │
│  ┌─────────┐  ⚖️                                        │
│  │    5    │  Scale icon                                │
│  └─────────┘                                            │
│  Sessions after last checkup to show reminder           │
│                                                          │
│  Payment Reminder                                        │
│  ┌─────────┐  💰                                         │
│  │   27    │  Coins icon                                │
│  └─────────┘                                            │
│  Days after last payment to show reminder               │
│                                                          │
│  Maximum Sessions Per Week                               │
│  ┌─────────┐                                            │
│  │   250   │  (Studio-wide booking limit)               │
│  └─────────┘                                            │
│                                                          │
│  Auto-Inactivation Threshold                             │
│  ┌─────────┐                                            │
│  │    6    │  Months without attendance                 │
│  └─────────┘                                            │
│                                                          │
│  ┌────────┐  ┌────────┐                                 │
│  │ Cancel │  │  Save  │                                 │
│  └────────┘  └────────┘                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Design Specifications

**Components to Use:**

- shadcn/ui Form components
- shadcn/ui Input (type="number")
- shadcn/ui Label
- shadcn/ui Button
- shadcn/ui Card (for section grouping)
- shadcn/ui Toast (for notifications)

**Styling:**

- Follow existing Studio Settings layout pattern
- Use consistent spacing (gap-4 between fields)
- Icon previews (for subscription, body checkup, payment parameters only): 24x24px, positioned to the right of input
- Responsive: Stack vertically on mobile

---

## 🔧 Technical Implementation

### Database Schema

**Table:** `studio_planning_settings`

```sql
CREATE TABLE studio_planning_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_warning_days INTEGER NOT NULL DEFAULT 35,
  body_checkup_sessions INTEGER NOT NULL DEFAULT 5,
  payment_reminder_days INTEGER NOT NULL DEFAULT 27,
  max_sessions_per_week INTEGER NOT NULL DEFAULT 250,
  inactivity_months INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure only one settings row exists
ALTER TABLE studio_planning_settings ADD CONSTRAINT single_settings_row CHECK (id IS NOT NULL);
CREATE UNIQUE INDEX idx_single_settings ON studio_planning_settings ((id IS NOT NULL));

-- Initialize with default values
INSERT INTO studio_planning_settings DEFAULT VALUES;
```

**Function:** `get_active_planning_settings()`

```sql
CREATE OR REPLACE FUNCTION get_active_planning_settings()
RETURNS TABLE (
  id UUID,
  subscription_warning_days INTEGER,
  body_checkup_sessions INTEGER,
  payment_reminder_days INTEGER,
  max_sessions_per_week INTEGER,
  inactivity_months INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.subscription_warning_days,
    s.body_checkup_sessions,
    s.payment_reminder_days,
    s.max_sessions_per_week,
    s.inactivity_months
  FROM studio_planning_settings s
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
```

### TypeScript Types

**File:** `src/features/studio-settings/types.ts`

```typescript
export interface PlanningSettings {
  id: string;
  subscription_warning_days: number;
  body_checkup_sessions: number;
  payment_reminder_days: number;
  max_sessions_per_week: number;
  inactivity_months: number;
  created_at: string;
  updated_at: string;
}

export interface UpdatePlanningSettingsInput {
  subscription_warning_days?: number;
  body_checkup_sessions?: number;
  payment_reminder_days?: number;
  max_sessions_per_week?: number;
  inactivity_months?: number;
}
```

### Database Utilities

**File:** `src/features/studio-settings/lib/planning-settings-db.ts`

```typescript
import { supabase } from "@/lib/supabase";
import type { PlanningSettings, UpdatePlanningSettingsInput } from "../types";

export async function getPlanningSettings(): Promise<PlanningSettings | null> {
  const { data, error } = await supabase
    .from("studio_planning_settings")
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updatePlanningSettings(
  id: string,
  updates: UpdatePlanningSettingsInput
): Promise<PlanningSettings> {
  const { data, error } = await supabase
    .from("studio_planning_settings")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function initializeDefaultSettings(): Promise<PlanningSettings> {
  // Check if settings already exist
  const existing = await getPlanningSettings();
  if (existing) return existing;

  // Create default settings
  const { data, error } = await supabase
    .from("studio_planning_settings")
    .insert({})
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### React Hook

**File:** `src/features/studio-settings/hooks/use-planning-settings.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getPlanningSettings,
  updatePlanningSettings,
  initializeDefaultSettings,
} from "../lib/planning-settings-db";
import type { UpdatePlanningSettingsInput } from "../types";

export function usePlanningSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["planning-settings"],
    queryFn: async () => {
      const settings = await getPlanningSettings();
      return settings || (await initializeDefaultSettings());
    },
  });

  const mutation = useMutation({
    mutationFn: (updates: UpdatePlanningSettingsInput) => {
      if (!query.data?.id) throw new Error("Settings not loaded");
      return updatePlanningSettings(query.data.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning-settings"] });
      toast.success("Planning settings updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update settings: " + error.message);
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
```

### Component

**File:** `src/features/studio-settings/components/PlanningSettingsForm.tsx`

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { usePlanningSettings } from "../hooks/use-planning-settings";

const formSchema = z.object({
  subscription_warning_days: z.number().min(1).max(999),
  body_checkup_sessions: z.number().min(1).max(999),
  payment_reminder_days: z.number().min(1).max(999),
  max_sessions_per_week: z.number().min(1).max(9999),
  inactivity_months: z.number().min(1).max(99),
});

type FormValues = z.infer<typeof formSchema>;

export function PlanningSettingsForm() {
  const { settings, isLoading, updateSettings, isUpdating } = usePlanningSettings();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: settings ? {
      subscription_warning_days: settings.subscription_warning_days,
      body_checkup_sessions: settings.body_checkup_sessions,
      payment_reminder_days: settings.payment_reminder_days,
      max_sessions_per_week: settings.max_sessions_per_week,
      inactivity_months: settings.inactivity_months,
    } : undefined,
  });

  const onSubmit = async (values: FormValues) => {
    await updateSettings(values);
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="subscription_warning_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subscription Expiration Warning</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                  <span className="text-2xl">🏜️</span>
                </div>
              </FormControl>
              <FormDescription>
                Show warning this many days before subscription ends
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Similar fields for other parameters... */}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 🧪 Testing Requirements

### Unit Tests

**File:** `src/features/studio-settings/lib/__tests__/planning-settings-db.test.ts`

Test cases:

- ✅ `getPlanningSettings` returns settings
- ✅ `getPlanningSettings` returns null if no settings exist
- ✅ `updatePlanningSettings` updates values correctly
- ✅ `initializeDefaultSettings` creates default row
- ✅ `initializeDefaultSettings` doesn't duplicate if settings exist

**File:** `src/features/studio-settings/hooks/__tests__/use-planning-settings.test.ts`

Test cases:

- ✅ Hook fetches settings on mount
- ✅ Hook initializes defaults if no settings exist
- ✅ Mutation updates settings and invalidates query
- ✅ Error handling shows toast notification

### Integration Tests

Manual testing checklist:

1. Navigate to Studio Settings → Planning tab
2. Verify form loads with default values (or existing values)
3. Change all 5 parameters to new values
4. Click Save
5. Verify success toast appears
6. Refresh page
7. Verify new values persist

Edge cases:

- Enter 0 → Should show validation error
- Enter negative number → Should show validation error
- Enter non-numeric value → Should show validation error
- Database error during save → Should show error toast

---

## 📋 Definition of Done

- [ ] Database migration created and applied successfully
- [ ] `studio_planning_settings` table exists with correct schema
- [ ] `get_active_planning_settings()` function works
- [ ] All database utilities implemented and tested
- [ ] `usePlanningSettings` hook implemented and tested
- [ ] `PlanningSettingsForm` component implemented
- [ ] Component integrated into Studio Settings page
- [ ] All unit tests pass (100% coverage)
- [ ] Manual testing completed successfully
- [ ] Code reviewed and approved
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated (if needed)

---

## 🔗 Related User Stories

- **Depends on:** None (foundation story)
- **Blocks:** US-003 (Calendar Visual Indicators), US-004 (Session Limit), US-005 (Auto-Inactivation)
- **Related to:** US-002 (Body Checkup Tracking - can be done in parallel)

---

## 📝 Notes

- This is the foundation story - all other planning features depend on these settings
- Use existing Studio Settings layout as reference
- Ensure proper TypeScript types for all database operations
- Follow date-utils standards if any date handling is needed
- Icon previews (subscription, body checkup, payment only) should match the icons that will appear in calendar (US-003)
- Max sessions/week and inactivity threshold do NOT have calendar icons - they are configuration-only parameters

---

**Ready to implement?** → See AGENT-GUIDE.md for step-by-step implementation workflow!
