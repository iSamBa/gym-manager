# Database RPC Function Signatures

This document catalogs all PostgreSQL RPC (Remote Procedure Call) functions in the gym management system, their parameters, return types, and any field mappings required when using them from the frontend.

## Purpose

RPC functions often return different field names than base database tables. This reference ensures developers:

- Know exactly what fields to expect from each RPC function
- Understand required field mappings (e.g., `session_id` → `id`)
- Have a central source of truth for function signatures

## Field Mapping Convention

**Rule:** When an RPC function returns a field name different from the TypeScript interface, use a mapper utility.

**Example:**

```typescript
// RPC returns session_id, interface expects id
import { mapSessionRpcResponse } from '@/features/training-sessions/lib/rpc-mappers';

const { data } = await supabase.rpc('get_sessions_with_planning_indicators', {...});
const sessions = mapSessionRpcResponse<TrainingSession>(data || []);
```

---

## Training Sessions

### `get_sessions_with_planning_indicators(p_start_date DATE, p_end_date DATE)`

**Purpose:** Fetch training sessions with planning indicator data (subscription end dates, payment dates, checkup dates). **Includes ALL session types**, including non-bookable sessions (no member required).

**Parameters:**

- `p_start_date` (DATE) - Start of date range (format: 'YYYY-MM-DD')
- `p_end_date` (DATE) - End of date range (format: 'YYYY-MM-DD')

**Returns:** Array of records with:

```typescript
{
  session_id: string; // ⚠️ Maps to TrainingSession.id
  scheduled_start: string; // ISO timestamp
  scheduled_end: string; // ISO timestamp
  session_date: string; // Date only (YYYY-MM-DD)
  status: SessionStatus;
  session_type: SessionType; // member | trial | contractual | multi_site | collaboration | makeup | non_bookable
  machine_id: string;
  member_id: string | null; // NULL for non-bookable, multi_site, collaboration sessions
  member_name: string | null; // NULL for sessions without members
  subscription_end_date: string | null;
  latest_payment_date: string | null;
  latest_checkup_date: string | null;
  sessions_since_checkup: number;
  outstanding_balance: number; // Outstanding amount owed (total_amount_snapshot - paid_amount)
  participants: Array<{
    // JSON array (empty for non-bookable sessions)
    id: string;
    name: string;
    email: string;
  }>;
  // Guest session fields (for multi_site and collaboration)
  guest_first_name: string | null;
  guest_last_name: string | null;
  guest_gym_name: string | null;
  collaboration_details: string | null;
  trainer_id: string | null;
  notes: string | null;
}
```

**Important Notes:**

- **Uses LEFT JOINs** - Sessions without members (non_bookable, guest sessions) are included
- `member_id`, `member_name`, and `participants` will be NULL/empty for non-bookable sessions
- Guest session fields populated for multi_site and collaboration session types
- Non-bookable sessions have empty participants array: `[]`

**Field Mappings Required:**

- `session_id` → `id` (use `mapSessionRpcResponse<TrainingSession>()`)

**Usage:**

```typescript
const { data } = await supabase.rpc("get_sessions_with_planning_indicators", {
  p_start_date: "2025-01-01",
  p_end_date: "2025-01-31",
});
const sessions = mapSessionRpcResponse<TrainingSession>(data || []);
```

---

### `create_training_session_with_members(...)`

**Purpose:** Create a training session with member bookings in a single transaction.

**Parameters:**

- `p_machine_id` (UUID) - Machine/equipment ID
- `p_trainer_id` (UUID | null) - Trainer ID (nullable)
- `p_scheduled_start` (TIMESTAMPTZ) - Session start time
- `p_scheduled_end` (TIMESTAMPTZ) - Session end time
- `p_member_ids` (UUID[]) - Array of member IDs (max 1 per session)
- `p_session_type` ('trail' | 'standard') - Session type
- `p_notes` (TEXT | null) - Optional notes

**Returns:** JSON object

```typescript
{
  success: boolean;
  id?: string;           // Session ID if successful
  message?: string;      // Success message
  error?: string;        // Error message if failed
}
```

**Validation Rules:**

- Only 1 member allowed per session
- Machine must exist and be available
- Studio session limit checked automatically

**Usage:**

```typescript
const { data, error } = await supabase.rpc(
  "create_training_session_with_members",
  {
    p_machine_id: machineId,
    p_trainer_id: trainerId || null,
    p_scheduled_start: startTime.toISOString(),
    p_scheduled_end: endTime.toISOString(),
    p_member_ids: [memberId],
    p_session_type: "standard",
    p_notes: null,
  }
);

if (data?.success) {
  // Session created successfully
} else {
  throw new Error(data?.error);
}
```

---

### `check_studio_session_limit(p_week_start DATE, p_week_end DATE)`

**Purpose:** Check if studio capacity allows booking more sessions for a given week.

**Parameters:**

- `p_week_start` (DATE) - Monday of the week
- `p_week_end` (DATE) - Sunday of the week

**Returns:** Record

```typescript
{
  current_count: number; // Sessions already booked this week
  max_allowed: number; // Maximum sessions per week (from settings)
  can_book: boolean; // True if under limit
  percentage: number; // Utilization percentage
}
```

**Usage:**

```typescript
const { data } = await supabase.rpc("check_studio_session_limit", {
  p_week_start: "2025-01-20",
  p_week_end: "2025-01-26",
});

if (!data.can_book) {
  alert(`Studio capacity full (${data.current_count}/${data.max_allowed})`);
}
```

---

### `check_session_availability(p_member_id UUID, p_session_type TEXT)`

**Purpose:** Check if member has sessions remaining in their subscription.

**Parameters:**

- `p_member_id` (UUID) - Member ID
- `p_session_type` ('trail' | 'standard') - Session type

**Returns:** JSONB

```typescript
{
  can_book: boolean;
  is_trial: boolean;
  sessions_remaining: number | null;
  message: string;
}
```

**Special Cases:**

- Trial sessions always return `can_book: true` (no subscription required)
- Standard sessions require active subscription with remaining credits

**Usage:**

```typescript
const { data } = await supabase.rpc("check_session_availability", {
  p_member_id: memberId,
  p_session_type: "standard",
});

if (!data.can_book) {
  alert(data.message); // User-friendly error
}
```

---

## Members

### `get_members_with_details(...)`

**Purpose:** Fetch members with subscription, session stats, and payment information.

**Parameters:**

- `p_status` (TEXT[] | null) - Filter by status(es)
- `p_member_type` (TEXT | null) - Filter by member type
- `p_search` (TEXT | null) - Search in name, email, phone
- `p_has_active_subscription` (BOOLEAN | null) - Filter by subscription status
- `p_has_upcoming_sessions` (BOOLEAN | null) - Filter by session bookings
- `p_has_outstanding_balance` (BOOLEAN | null) - Filter by balance
- `p_order_by` (TEXT) - Sort field ('name', 'join_date', 'email', 'status')
- `p_order_direction` (TEXT) - Sort direction ('asc', 'desc')
- `p_limit` (INTEGER) - Page size
- `p_offset` (INTEGER) - Page offset

**Returns:** Array of MemberWithEnhancedDetails

```typescript
{
  // Basic member fields
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: Gender;
  status: MemberStatus;
  join_date: string;
  member_type: string;
  profile_picture_url: string;
  created_at: string;
  updated_at: string;

  // Subscription data (from active subscription)
  subscription_end_date: string | null;
  remaining_sessions: number | null;
  balance_due: number | null;

  // Session stats
  last_session_date: string | null;
  next_session_date: string | null;
  scheduled_sessions_count: number | null;

  // Payment data
  last_payment_date: string | null;
}
```

**No Field Mappings Required** - Returns interface-compatible structure.

**Usage:**

```typescript
const { data } = await supabase.rpc("get_members_with_details", {
  p_status: ["active", "inactive"],
  p_member_type: null,
  p_search: "john",
  p_has_active_subscription: true,
  p_has_upcoming_sessions: null,
  p_has_outstanding_balance: null,
  p_order_by: "name",
  p_order_direction: "asc",
  p_limit: 50,
  p_offset: 0,
});
```

---

### `auto_inactivate_dormant_members()`

**Purpose:** Automatically mark dormant members as inactive based on inactivity threshold.

**Parameters:** None

**Returns:** Array with single record

```typescript
{
  inactivated_count: number;      // Number of members inactivated
  member_ids: string[];           // UUIDs of affected members
  member_names: string[];         // Full names of affected members
}
```

**Side Effects:**

- Updates `members.status` to 'inactive'
- Updates `members.last_activity_check` to NOW()
- Inserts system comment documenting auto-inactivation
- Only processes members not checked in last 24 hours

**Usage:**

```typescript
const { data, error } = await supabase.rpc("auto_inactivate_dormant_members");

const result = data[0] || {
  inactivated_count: 0,
  member_ids: [],
  member_names: [],
};
console.log(`Inactivated ${result.inactivated_count} members`);
```

---

### `get_inactivation_candidates()`

**Purpose:** Preview which members would be inactivated (dry run, no data modification).

**Parameters:** None

**Returns:** Array of records

```typescript
{
  member_id: string;
  member_name: string;
  last_session_date: string | null;
  days_inactive: number | null;
}
```

**No Side Effects** - Read-only query.

**Usage:**

```typescript
const { data } = await supabase.rpc("get_inactivation_candidates");

// Preview list before running auto-inactivation
data.forEach((candidate) => {
  console.log(
    `${candidate.member_name}: ${candidate.days_inactive} days inactive`
  );
});
```

---

### `get_member_session_stats(member_uuid UUID)`

**Purpose:** Get comprehensive session statistics for a member.

**Parameters:**

- `member_uuid` (UUID) - Member ID

**Returns:** JSON object

```typescript
{
  total_sessions: number;
  attended_sessions: number;
  upcoming_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  attendance_rate: number; // Percentage (0-100)
  favorite_trainer: {
    id: string | null;
    name: string | null;
  }
  avg_session_duration_minutes: number;
  total_training_hours: number;
  monthly_trend: {
    direction: "up" | "down" | "stable";
    this_month: number;
    last_month: number;
    change: number;
  }
}
```

**Usage:**

```typescript
const { data } = await supabase.rpc("get_member_session_stats", {
  member_uuid: memberId,
});

console.log(`Attendance rate: ${data.attendance_rate}%`);
```

---

### `get_member_status_distribution()`

**Purpose:** Get count and percentage of members by status.

**Parameters:** None

**Returns:** Array of records

```typescript
{
  status: string; // Member status
  count: number; // Count of members with this status
  percentage: number; // Percentage of total members
}
```

**Usage:**

```typescript
const { data } = await supabase.rpc("get_member_status_distribution");

// [
//   { status: 'active', count: 150, percentage: 75.00 },
//   { status: 'inactive', count: 40, percentage: 20.00 },
//   { status: 'suspended', count: 10, percentage: 5.00 }
// ]
```

---

## Planning & Settings

### `get_active_planning_settings()`

**Purpose:** Get current planning configuration (warning thresholds, limits).

**Parameters:** None

**Returns:** Single record

```typescript
{
  id: string;
  subscription_warning_days: number;
  body_checkup_sessions: number;
  payment_reminder_days: number;
  max_sessions_per_week: number;
  inactivity_months: number;
  created_at: string;
  updated_at: string;
}
```

**Usage:**

```typescript
const { data } = await supabase.rpc("get_active_planning_settings");

const settings = data[0]; // Single row expected
console.log(`Payment reminder after ${settings.payment_reminder_days} days`);
```

---

### `get_active_opening_hours(target_date DATE)`

**Purpose:** Get studio opening hours effective on a specific date.

**Parameters:**

- `target_date` (DATE) - Date to check (format: 'YYYY-MM-DD')

**Returns:** JSONB

```typescript
{
  monday: {
    is_open: boolean;
    open_time: string | null;
    close_time: string | null;
  }
  tuesday: {
    is_open: boolean;
    open_time: string | null;
    close_time: string | null;
  }
  wednesday: {
    is_open: boolean;
    open_time: string | null;
    close_time: string | null;
  }
  thursday: {
    is_open: boolean;
    open_time: string | null;
    close_time: string | null;
  }
  friday: {
    is_open: boolean;
    open_time: string | null;
    close_time: string | null;
  }
  saturday: {
    is_open: boolean;
    open_time: string | null;
    close_time: string | null;
  }
  sunday: {
    is_open: boolean;
    open_time: string | null;
    close_time: string | null;
  }
}
```

**Effective Date Logic:**

- Returns settings with most recent `effective_from` ≤ `target_date`
- `effective_from = NULL` means immediate effect (highest priority)

**Usage:**

```typescript
const { data } = await supabase.rpc("get_active_opening_hours", {
  target_date: "2025-01-20",
});

if (data.monday.is_open) {
  console.log(`Open ${data.monday.open_time} - ${data.monday.close_time}`);
}
```

---

## Trainers

### `create_trainer_with_profile(...)`

**Purpose:** Create trainer and user profile in a single transaction.

**Parameters:**

- `p_first_name` (TEXT)
- `p_last_name` (TEXT)
- `p_email` (TEXT) - Must be unique
- `p_phone` (TEXT | null)
- `p_date_of_birth` (DATE | null)
- `p_hourly_rate` (NUMERIC | null)
- `p_commission_rate` (NUMERIC)
- `p_max_clients_per_session` (INTEGER)
- `p_years_experience` (INTEGER | null)
- `p_certifications` (TEXT[] | null)
- `p_specializations` (TEXT[] | null)
- `p_languages` (TEXT[])
- `p_availability` (JSONB | null)
- `p_is_accepting_new_clients` (BOOLEAN)
- `p_emergency_contact` (JSONB | null)
- `p_insurance_policy_number` (TEXT | null)
- `p_background_check_date` (DATE | null)
- `p_cpr_certification_expires` (DATE | null)
- `p_notes` (TEXT | null)

**Returns:** JSON object

```typescript
{
  trainer: {
    id: string;
    // ... all trainer fields
  }
  user_profile: {
    id: string;
    email: string;
    role: "trainer";
    // ... all user_profile fields
  }
}
```

**Access Control:** Requires admin privileges (`is_admin()`)

**Exceptions:**

- `unique_violation` → Email already exists
- `foreign_key_violation` → Invalid data
- Others → Generic failure message

**Usage:**

```typescript
const { data, error } = await supabase.rpc("create_trainer_with_profile", {
  p_first_name: "John",
  p_last_name: "Doe",
  p_email: "john@example.com",
  // ... other params
});
```

---

### `get_trainer_analytics(p_trainer_id UUID)`

**Purpose:** Get performance analytics for a trainer.

**Parameters:**

- `p_trainer_id` (UUID) - Trainer ID

**Returns:** Record

```typescript
{
  trainer_id: string;
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number; // Percentage (0-100)
  total_revenue: number;
  avg_revenue_per_session: number;
  unique_members: number;
  total_hours: number;
  avg_utilization: number; // Percentage (0-100)
}
```

**Usage:**

```typescript
const { data } = await supabase.rpc("get_trainer_analytics", {
  p_trainer_id: trainerId,
});

console.log(`${data.completion_rate}% completion rate`);
```

---

### `get_trainer_day_schedule(p_trainer_id UUID, p_date DATE)`

**Purpose:** Get all sessions for a trainer on a specific day.

**Parameters:**

- `p_trainer_id` (UUID) - Trainer ID
- `p_date` (DATE) - Date (format: 'YYYY-MM-DD')

**Returns:** JSONB

```typescript
{
  trainer_id: string;
  date: string;
  sessions: Array<{
    id: string;
    scheduled_start: string;
    scheduled_end: string;
    location: string;
    max_participants: number;
    current_participants: number;
    status: SessionStatus;
    notes: string;
  }>;
  total_sessions: number;
}
```

**Usage:**

```typescript
const { data } = await supabase.rpc("get_trainer_day_schedule", {
  p_trainer_id: trainerId,
  p_date: "2025-01-20",
});

data.sessions.forEach((session) => {
  console.log(`${session.scheduled_start} - ${session.scheduled_end}`);
});
```

---

## Dashboard

### `get_dashboard_stats()`

**Purpose:** Get high-level dashboard statistics.

**Parameters:** None

**Returns:** Record

```typescript
{
  total_members: number;
  active_members: number;
  total_revenue: number;
  sessions_today: number;
  sessions_this_week: number;
  monthly_revenue: number;
  member_retention_rate: number; // Percentage (0-100)
}
```

**Usage:**

```typescript
const { data } = await supabase.rpc("get_dashboard_stats");

const stats = data[0];
console.log(`${stats.active_members} active members`);
```

---

## Transactions & Payments

### `create_subscription_with_payment(...)`

**Purpose:** Atomically creates a subscription and payment record in a single transaction. Automatically converts trial members to full members.

**Parameters:**

- `p_member_id` (UUID) - Member ID
- `p_plan_id` (UUID) - Subscription plan ID
- `p_payment_amount` (DECIMAL) - Payment amount
- `p_payment_method` (VARCHAR) - Payment method ('cash', 'card', 'bank_transfer', 'online', 'check')
- `p_payment_date` (DATE) - Payment date (default: CURRENT_DATE)

**Returns:** JSON object

```typescript
{
  success: boolean;
  subscription_id: string;
  payment_id: string;
  message: string;
}
```

**Transaction Operations:**

1. Creates subscription with plan session count
2. Records payment with 'completed' status
3. Updates member status to 'active'
4. Converts trial members to 'full' type
5. All operations succeed together or rollback on any failure

**Access Control:** Uses SECURITY DEFINER for admin-level access

**Usage:**

```typescript
const { data, error } = await supabase.rpc("create_subscription_with_payment", {
  p_member_id: memberId,
  p_plan_id: planId,
  p_payment_amount: 150.0,
  p_payment_method: "card",
  p_payment_date: "2025-01-15",
});

if (error) throw new Error(`Transaction failed: ${error.message}`);
console.log(`Created subscription: ${data.subscription_id}`);
```

---

### `process_refund_with_transaction(...)`

**Purpose:** Atomically processes a refund by creating a negative payment entry and optionally canceling the subscription.

**Parameters:**

- `p_payment_id` (UUID) - Original payment ID to refund
- `p_refund_amount` (DECIMAL) - Refund amount (must be ≤ remaining refundable amount)
- `p_refund_reason` (TEXT) - Reason for refund
- `p_cancel_subscription` (BOOLEAN) - Cancel associated subscription (default: false)

**Returns:** JSON object

```typescript
{
  success: boolean;
  refund_id: string;
  payment_id: string;
  refund_amount: number;
  subscription_cancelled: boolean;
  message: string;
}
```

**Transaction Operations:**

1. Validates payment exists and is not already a refund
2. Calculates total refunded to ensure refund amount is valid
3. Creates refund entry with negative amount
4. Updates subscription paid_amount
5. Optionally cancels subscription
6. All operations succeed together or rollback on any failure

**Validation Rules:**

- Payment must exist
- Payment must not be a refund entry itself
- Refund amount must be > 0
- Refund amount must not exceed remaining refundable amount
- Row locking prevents concurrent modifications

**Access Control:** Uses SECURITY DEFINER for admin-level access

**Usage:**

```typescript
// Full refund with subscription cancellation
const { data, error } = await supabase.rpc("process_refund_with_transaction", {
  p_payment_id: paymentId,
  p_refund_amount: 150.0,
  p_refund_reason: "Customer request",
  p_cancel_subscription: true,
});

// Partial refund without cancellation
const { data, error } = await supabase.rpc("process_refund_with_transaction", {
  p_payment_id: paymentId,
  p_refund_amount: 50.0,
  p_refund_reason: "Partial refund for service issue",
  p_cancel_subscription: false,
});

if (error) throw new Error(`Refund failed: ${error.message}`);
console.log(`Refund entry created: ${data.refund_id}`);
```

---

## Body Checkups

### `get_latest_body_checkup(p_member_id UUID)`

**Purpose:** Get most recent body checkup for a member.

**Parameters:**

- `p_member_id` (UUID) - Member ID

**Returns:** Record

```typescript
{
  id: string;
  member_id: string;
  checkup_date: string;
  weight: number;
  notes: string;
  created_at: string;
  created_by: string;
}
```

**Returns:** Single row or no rows if no checkups exist.

**Usage:**

```typescript
const { data } = await supabase.rpc("get_latest_body_checkup", {
  p_member_id: memberId,
});

if (data?.length > 0) {
  const checkup = data[0];
  console.log(`Latest checkup: ${checkup.checkup_date}`);
}
```

---

## Helper Functions (Trigger/Validation)

These functions are called automatically by database triggers:

- `generate_equipment_number()` - Auto-generates equipment IDs (EQ20250001)
- `generate_receipt_number()` - Auto-generates receipt numbers (RCPT-2025-0001)
- `generate_trainer_code()` - Auto-generates trainer codes (TR20250001)
- `update_updated_at_column()` - Updates `updated_at` timestamp on row changes
- `validate_opening_hours_json(hours JSONB)` - Validates opening hours structure
- `validate_first_payment()` - Ensures first payment ≥ 1200 MAD (signup fee + minimum)
- `handle_training_session_completion()` - Deducts session credits when session completed
- `update_class_counts()` - Updates `current_participants` and `waitlist_count` on bookings

**Note:** These are not called directly from application code - they're database-managed.

---

## Field Mapping Quick Reference

| RPC Function                            | Field Mismatch       | TypeScript Mapper                          |
| --------------------------------------- | -------------------- | ------------------------------------------ |
| `get_sessions_with_planning_indicators` | `session_id` → `id`  | `mapSessionRpcResponse<TrainingSession>()` |
| `get_members_with_details`              | ✅ No mapping needed | N/A                                        |
| `auto_inactivate_dormant_members`       | ✅ No mapping needed | N/A                                        |
| `get_inactivation_candidates`           | ✅ No mapping needed | N/A                                        |

---

## Best Practices

1. **Always use type-safe RPC calls:**

   ```typescript
   const { data, error } = await supabase.rpc("function_name", params);
   if (error) throw error;
   ```

2. **Use mapper utilities for field mismatches:**

   ```typescript
   import { mapSessionRpcResponse } from "@/features/training-sessions/lib/rpc-mappers";
   const sessions = mapSessionRpcResponse<TrainingSession>(data || []);
   ```

3. **Check return value structure:**
   - Some return arrays: `data[0]` to access first record
   - Some return single JSON: `data` is the object directly
   - Always handle null/undefined cases

4. **Validate parameters:**
   - Date strings must be 'YYYY-MM-DD' format
   - Timestamps must be ISO 8601 format
   - Arrays must be properly typed (UUID[], TEXT[], etc.)

5. **Handle errors gracefully:**
   ```typescript
   try {
     const { data, error } = await supabase.rpc("function_name", params);
     if (error) throw error;
     // Process data
   } catch (error) {
     console.error("RPC call failed:", error);
     // Show user-friendly message
   }
   ```

---

## Adding New RPC Functions

When creating new RPC functions:

1. **Document immediately** - Add to this file with signature and field mappings
2. **Create mapper if needed** - Add to `/src/features/[feature]/lib/rpc-mappers.ts`
3. **Export TypeScript types** - Define return type in `types.ts`
4. **Test thoroughly** - Verify field names match TypeScript interfaces
5. **Update Quick Reference** - Add to table if field mapping required

---

**Last Updated:** 2025-10-19
**Maintainer:** Development Team
**Related:** `/src/features/training-sessions/lib/rpc-mappers.ts`, `/src/features/database/lib/types.ts`
