# US-005: Automatic Member Inactivation

**Feature:** Studio Planning Parameters & Visual Indicators
**Story ID:** US-005
**Priority:** P0 (Must Have)
**Estimated Effort:** 2-3 days
**Dependencies:** US-001 (Planning Settings)
**Status:** Not Started

---

## 📖 User Story

**As a** gym administrator
**I want** to automatically mark members as inactive if they haven't attended any training sessions for a configured number of months
**So that** I can maintain an accurate active member list, focus retention efforts, and keep the database clean

---

## 💼 Business Value

**Why This Matters:**

- **Data Accuracy** - Active member count reflects reality, not hope
- **Focused Retention** - Identify truly inactive members for re-engagement campaigns
- **Reporting Accuracy** - Analytics based on accurate active/inactive status
- **Administrative Efficiency** - Reduce time spent manually updating member statuses
- **Audit Trail** - Documented reason for status change

**Expected Outcomes:**

- 100% accurate active/inactive member status
- Reduced manual administrative work (save 2-3 hours/week)
- Better targeted marketing and retention campaigns
- Clear documentation of when and why members became inactive

---

## ✅ Acceptance Criteria

### AC-001: Automatic Inactivation Logic

**Given** a member has status 'active'
**And** they have NOT attended any training sessions in the last X months (X = configured in US-001)
**When** the auto-inactivation process runs
**Then** the member's status should be changed to 'inactive'
**And** a system comment should be added to their profile documenting the action
**And** the `last_activity_check` timestamp should be updated

**Given** a member has attended at least 1 session in the last X months
**When** the auto-inactivation process runs
**Then** the member's status should remain 'active'

### AC-002: System Comment Documentation

**Given** a member is auto-inactivated
**Then** a comment should be added to their profile with:

- Text: "Automatically marked as inactive due to [X] months of no attendance."
- `created_by_system` flag: `true`
- `created_at` timestamp: current time

**And** this comment should be visible in the member's comment history
**And** it should be distinguishable from user-created comments (e.g., with a badge or icon)

### AC-003: Manual Trigger (Phase 1)

**Given** I am logged in as an admin
**And** I navigate to Studio Settings → Planning tab
**When** I click "Run Auto-Inactivation"
**Then** a confirmation dialog should appear showing:

- "This will inactivate members with no attendance in the last [X] months"
- Preview: "[N] members will be affected"
- List of member names to be inactivated (optional: show first 10)

**And** when I confirm
**Then** the process should run
**And** I should see a success message: "[N] members marked as inactive"
**And** affected members should have status 'inactive' with system comments

### AC-004: Dry Run Mode

**Given** I am viewing the Auto-Inactivation section
**When** I click "Preview Affected Members"
**Then** I should see a list of members who WOULD be inactivated
**And** their last session dates
**And** NO changes should be made to the database
**And** I can review before running the actual process

### AC-005: Manual Reactivation

**Given** a member was auto-inactivated
**And** I am viewing their profile
**When** I click "Reactivate Member"
**Then** a confirmation dialog should appear
**And** when I confirm
**Then** the member's status should be changed to 'active'
**And** a comment should be added: "Member reactivated by [Admin Name] on [Date]"

### AC-006: Scheduled Job (Phase 2 - Optional)

**Given** the scheduled auto-inactivation job is configured
**When** the job runs (e.g., daily at midnight)
**Then** it should automatically inactivate dormant members
**And** log the results for admin review
**And** optionally send a summary email to admins

### AC-007: Edge Cases

**Given** a member has NEVER attended any sessions
**And** they have been a member for more than X months
**When** the auto-inactivation process runs
**Then** they SHOULD be inactivated

**Given** a member was auto-inactivated previously
**And** the job runs again
**Then** their status should remain 'inactive'
**And** NO new comment should be added (avoid duplicate comments)

---

## 🎨 UI/UX Requirements

### Auto-Inactivation Section (Studio Settings)

```
┌─────────────────────────────────────────────────────┐
│  Automatic Member Inactivation                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                     │
│  Automatically mark members as inactive if they     │
│  haven't attended sessions for the configured       │
│  period (currently: 6 months).                      │
│                                                     │
│  Last Run: Never                                    │
│  Last Run Result: -                                 │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────────┐    │
│  │ Preview Affected │  │ Run Auto-Inactivation│    │
│  └──────────────────┘  └──────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Preview Dialog

```
┌─────────────────────────────────────────────────────┐
│  Preview: Members to be Inactivated                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Based on 6 months of inactivity:                   │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Name            │ Last Session │ Days Inactive│ │
│  ├───────────────────────────────────────────────┤ │
│  │ John Doe        │ 2025-02-15   │ 245 days     │ │
│  │ Jane Smith      │ 2025-01-10   │ 281 days     │ │
│  │ Mike Johnson    │ Never        │ N/A          │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Total: 3 members will be inactivated               │
│                                                     │
│  ┌────────┐  ┌──────────────────────┐              │
│  │ Cancel │  │ Run Auto-Inactivation│              │
│  └────────┘  └──────────────────────┘              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Reactivation Dialog

```
┌─────────────────────────────────────────────────────┐
│  Reactivate Member                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Are you sure you want to reactivate John Doe?      │
│                                                     │
│  This member was automatically inactivated on       │
│  2025-10-18 due to 6 months of no attendance.       │
│                                                     │
│  ┌────────┐  ┌──────────────┐                      │
│  │ Cancel │  │   Reactivate │                      │
│  └────────┘  └──────────────┘                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### System Comment Display

```
┌─────────────────────────────────────────────────────┐
│  Comments                                           │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐ │
│  │ [SYSTEM] 2025-10-18                           │ │
│  │ Automatically marked as inactive due to 6     │ │
│  │ months of no attendance.                      │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │ Admin User - 2025-10-19                       │ │
│  │ Member reactivated by John Admin              │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Design Specifications

**Components to Use:**

- shadcn/ui Button
- shadcn/ui Dialog
- shadcn/ui Table
- shadcn/ui Alert
- shadcn/ui Badge (for system comments)
- shadcn/ui Card

**Styling:**

- System comments: Light gray background, "SYSTEM" badge
- Preview table: Highlight members with "Never" attended
- Success message: Green toast notification
- Error message: Red toast notification

---

## 🔧 Technical Implementation

### Database Schema Changes

**Modify `members` table:**

```sql
ALTER TABLE members ADD COLUMN IF NOT EXISTS last_activity_check TIMESTAMPTZ;

COMMENT ON COLUMN members.last_activity_check IS 'Timestamp of last auto-inactivation check';
```

**Modify `member_comments` table:**

```sql
ALTER TABLE member_comments ADD COLUMN IF NOT EXISTS created_by_system BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN member_comments.created_by_system IS 'True if comment was created by automated system';
```

### Database Function

**Function:** `auto_inactivate_dormant_members()`

```sql
CREATE OR REPLACE FUNCTION auto_inactivate_dormant_members()
RETURNS TABLE (
  inactivated_count INTEGER,
  member_ids UUID[],
  member_names TEXT[]
) AS $$
DECLARE
  v_inactivity_months INTEGER;
  v_threshold_date DATE;
  v_member_record RECORD;
  v_inactivated_count INTEGER := 0;
  v_member_ids UUID[] := ARRAY[]::UUID[];
  v_member_names TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get inactivity threshold from settings
  SELECT inactivity_months INTO v_inactivity_months
  FROM studio_planning_settings
  LIMIT 1;

  -- Calculate threshold date
  v_threshold_date := CURRENT_DATE - (v_inactivity_months || ' months')::INTERVAL;

  -- Find and update dormant members
  FOR v_member_record IN
    SELECT m.id, m.name
    FROM members m
    WHERE m.status = 'active'
      AND m.id NOT IN (
        -- Members who have attended sessions after threshold
        SELECT DISTINCT ts.member_id
        FROM training_sessions ts
        WHERE ts.session_date > v_threshold_date
          AND ts.status = 'completed'
      )
      -- Exclude members who were just checked (within last 24 hours)
      AND (m.last_activity_check IS NULL OR m.last_activity_check < NOW() - INTERVAL '24 hours')
  LOOP
    -- Update member status
    UPDATE members
    SET status = 'inactive',
        last_activity_check = NOW()
    WHERE id = v_member_record.id;

    -- Add system comment documenting auto-inactivation
    INSERT INTO member_comments (member_id, comment, created_by_system, created_at)
    VALUES (
      v_member_record.id,
      'Automatically marked as inactive due to ' || v_inactivity_months || ' months of no attendance.',
      TRUE,
      NOW()
    );

    v_inactivated_count := v_inactivated_count + 1;
    v_member_ids := array_append(v_member_ids, v_member_record.id);
    v_member_names := array_append(v_member_names, v_member_record.name);
  END LOOP;

  RETURN QUERY SELECT v_inactivated_count, v_member_ids, v_member_names;
END;
$$ LANGUAGE plpgsql;
```

**Function:** `get_inactivation_candidates()` (Dry Run)

```sql
CREATE OR REPLACE FUNCTION get_inactivation_candidates()
RETURNS TABLE (
  member_id UUID,
  member_name TEXT,
  last_session_date DATE,
  days_inactive INTEGER
) AS $$
DECLARE
  v_inactivity_months INTEGER;
  v_threshold_date DATE;
BEGIN
  -- Get inactivity threshold
  SELECT inactivity_months INTO v_inactivity_months
  FROM studio_planning_settings
  LIMIT 1;

  v_threshold_date := CURRENT_DATE - (v_inactivity_months || ' months')::INTERVAL;

  RETURN QUERY
  SELECT
    m.id AS member_id,
    m.name AS member_name,
    last_session.session_date AS last_session_date,
    CASE
      WHEN last_session.session_date IS NOT NULL
      THEN (CURRENT_DATE - last_session.session_date)::INTEGER
      ELSE NULL
    END AS days_inactive
  FROM members m
  LEFT JOIN LATERAL (
    SELECT session_date
    FROM training_sessions
    WHERE member_id = m.id AND status = 'completed'
    ORDER BY session_date DESC
    LIMIT 1
  ) last_session ON true
  WHERE m.status = 'active'
    AND (
      last_session.session_date IS NULL
      OR last_session.session_date < v_threshold_date
    );
END;
$$ LANGUAGE plpgsql;
```

### TypeScript Types

**File:** `src/features/members/types.ts` (add to existing)

```typescript
export interface AutoInactivationResult {
  inactivated_count: number;
  member_ids: string[];
  member_names: string[];
}

export interface InactivationCandidate {
  member_id: string;
  member_name: string;
  last_session_date: string | null;
  days_inactive: number | null;
}
```

### Database Utilities

**File:** `src/features/members/lib/auto-inactivation-utils.ts`

```typescript
import { supabase } from "@/lib/supabase";
import type { AutoInactivationResult, InactivationCandidate } from "../types";

export async function runAutoInactivation(): Promise<AutoInactivationResult> {
  const { data, error } = await supabase.rpc("auto_inactivate_dormant_members");

  if (error) throw error;

  return data[0] || { inactivated_count: 0, member_ids: [], member_names: [] };
}

export async function getInactivationCandidates(): Promise<
  InactivationCandidate[]
> {
  const { data, error } = await supabase.rpc("get_inactivation_candidates");

  if (error) throw error;

  return data || [];
}

export async function reactivateMember(
  memberId: string,
  adminName: string
): Promise<void> {
  // Update member status
  const { error: updateError } = await supabase
    .from("members")
    .update({ status: "active" })
    .eq("id", memberId);

  if (updateError) throw updateError;

  // Add comment
  const { error: commentError } = await supabase
    .from("member_comments")
    .insert({
      member_id: memberId,
      comment: `Member reactivated by ${adminName} on ${new Date().toLocaleDateString()}`,
      created_by_system: false,
    });

  if (commentError) throw commentError;
}
```

### React Hooks

**File:** `src/features/members/hooks/use-auto-inactivation.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  runAutoInactivation,
  getInactivationCandidates,
  reactivateMember,
} from "../lib/auto-inactivation-utils";

export function useInactivationCandidates() {
  return useQuery({
    queryKey: ["inactivation-candidates"],
    queryFn: getInactivationCandidates,
  });
}

export function useRunAutoInactivation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runAutoInactivation,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["inactivation-candidates"] });
      toast.success(`${result.inactivated_count} members marked as inactive`);
    },
    onError: (error) => {
      toast.error("Failed to run auto-inactivation: " + error.message);
    },
  });
}

export function useReactivateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      adminName,
    }: {
      memberId: string;
      adminName: string;
    }) => reactivateMember(memberId, adminName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member-comments"] });
      toast.success("Member reactivated successfully");
    },
    onError: (error) => {
      toast.error("Failed to reactivate member: " + error.message);
    },
  });
}
```

### UI Components

**File:** `src/features/members/components/AutoInactivationSection.tsx`

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PreviewInactivationDialog } from "./PreviewInactivationDialog";
import { useRunAutoInactivation } from "../hooks/use-auto-inactivation";

export function AutoInactivationSection() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const runInactivation = useRunAutoInactivation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automatic Member Inactivation</CardTitle>
        <CardDescription>
          Automatically mark members as inactive if they haven't attended
          sessions for the configured period.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Last Run: Never
            <br />
            Last Run Result: -
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            Preview Affected Members
          </Button>
          <Button onClick={() => setPreviewOpen(true)}>
            Run Auto-Inactivation
          </Button>
        </div>

        <PreviewInactivationDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          onConfirm={async () => {
            await runInactivation.mutateAsync();
            setPreviewOpen(false);
          }}
        />
      </CardContent>
    </Card>
  );
}
```

**File:** `src/features/members/components/PreviewInactivationDialog.tsx`

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInactivationCandidates } from "../hooks/use-auto-inactivation";

interface PreviewInactivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function PreviewInactivationDialog({
  open,
  onOpenChange,
  onConfirm,
}: PreviewInactivationDialogProps) {
  const { data: candidates, isLoading } = useInactivationCandidates();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preview: Members to be Inactivated</DialogTitle>
          <DialogDescription>
            Based on configured inactivity period
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p>Loading...</p>
        ) : candidates && candidates.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Last Session</TableHead>
                  <TableHead>Days Inactive</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.member_id}>
                    <TableCell>{candidate.member_name}</TableCell>
                    <TableCell>
                      {candidate.last_session_date || "Never"}
                    </TableCell>
                    <TableCell>
                      {candidate.days_inactive
                        ? `${candidate.days_inactive} days`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground">
              Total: {candidates.length} members will be inactivated
            </p>
          </>
        ) : (
          <p className="text-center py-4">No members meet the criteria</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!candidates || candidates.length === 0}
          >
            Run Auto-Inactivation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**File:** `src/features/members/components/ReactivateMemberButton.tsx`

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReactivateMember } from "../hooks/use-auto-inactivation";
import { useAuth } from "@/hooks/use-auth";

interface ReactivateMemberButtonProps {
  memberId: string;
  memberName: string;
  inactivatedDate?: string;
}

export function ReactivateMemberButton({
  memberId,
  memberName,
  inactivatedDate,
}: ReactivateMemberButtonProps) {
  const [open, setOpen] = useState(false);
  const reactivate = useReactivateMember();
  const { user } = useAuth();

  const handleReactivate = async () => {
    await reactivate.mutateAsync({
      memberId,
      adminName: user?.name || "Admin",
    });
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Reactivate Member</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to reactivate {memberName}?
            </DialogDescription>
          </DialogHeader>
          {inactivatedDate && (
            <p className="text-sm text-muted-foreground">
              This member was automatically inactivated on {inactivatedDate}.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReactivate} disabled={reactivate.isPending}>
              {reactivate.isPending ? "Reactivating..." : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## 🧪 Testing Requirements

### Unit Tests

**File:** `src/features/members/lib/__tests__/auto-inactivation-utils.test.ts`

Test cases:

- ✅ `runAutoInactivation` inactivates dormant members
- ✅ `runAutoInactivation` doesn't affect active members
- ✅ `runAutoInactivation` adds system comments
- ✅ `getInactivationCandidates` returns correct list
- ✅ `getInactivationCandidates` includes members with no sessions
- ✅ `reactivateMember` changes status to active
- ✅ `reactivateMember` adds reactivation comment

### Integration Tests

Manual testing checklist:

1. Configure inactivity threshold to 1 month (for testing)
2. Create test members:
   - Member A: Last session 2 months ago
   - Member B: Last session 15 days ago
   - Member C: Never attended
   - Member D: Already inactive
3. Click "Preview Affected Members"
4. Verify Members A and C appear in preview (not B or D)
5. Click "Run Auto-Inactivation"
6. Verify Members A and C status changed to 'inactive'
7. Verify system comments added
8. View Member A profile
9. Click "Reactivate Member"
10. Verify status changed to 'active'
11. Verify reactivation comment added

Edge cases:

- Run auto-inactivation twice → Should not create duplicate comments
- Member with sessions exactly at threshold → Should/shouldn't be inactivated
- Member with only cancelled sessions → Should be inactivated

---

## 📋 Definition of Done

- [ ] Database schema changes applied (last_activity_check, created_by_system)
- [ ] `auto_inactivate_dormant_members()` function created and tested
- [ ] `get_inactivation_candidates()` function created and tested
- [ ] All utilities implemented and tested
- [ ] All hooks implemented and tested
- [ ] `AutoInactivationSection` component implemented
- [ ] `PreviewInactivationDialog` component implemented
- [ ] `ReactivateMemberButton` component implemented
- [ ] System comments distinguishable from user comments
- [ ] All unit tests pass (100% coverage)
- [ ] Manual testing completed successfully
- [ ] Code reviewed and approved
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

---

## 🔗 Related User Stories

- **Depends on:** US-001 (Planning Settings)
- **Blocks:** None
- **Related to:** US-002 (Body Checkup - similar comment mechanism)

---

## 📝 Notes

- Phase 1: Manual trigger only
- Phase 2: Scheduled job (cron/edge function)
- Consider email notification to affected members (Phase 3)
- Future enhancement: Auto-reactivation when member books a session
- Future enhancement: Customizable inactivation reasons

---

**Ready to implement?** → See AGENT-GUIDE.md for step-by-step implementation workflow!
