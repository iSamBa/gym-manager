# Planning Parameters Feature - Technical Documentation

## 📖 Overview

The Planning Parameters feature provides gym administrators with configurable automation and visual indicators to proactively manage member care, studio capacity, and operational workflows.

**Key Capabilities:**

1. **Subscription Expiration Warnings** - Visual alerts when member subscriptions are near expiration
2. **Body Checkup Reminders** - Track and remind staff when members need checkups
3. **Payment Reminders** - Alert staff when payment is due based on last payment date
4. **Studio Session Limits** - Enforce weekly booking capacity across the entire studio
5. **Auto-Inactivation** - Automatically mark dormant members as inactive with documentation

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Studio Settings UI                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Planning Settings Form (US-001)               │ │
│  │  - Subscription warning days                           │ │
│  │  - Body checkup session threshold                      │ │
│  │  - Payment reminder days                               │ │
│  │  - Max sessions per week                               │ │
│  │  - Inactivity months threshold                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │ studio_planning│  │ member_body_   │  │ members        ││
│  │ _settings      │  │ checkups       │  │ (modified)     ││
│  └────────────────┘  └────────────────┘  └────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Calendar Visual Indicators (US-003)                   │ │
│  │  - Planning indicators calculation                     │ │
│  │  - Icon rendering logic                                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Session Limit Enforcement (US-004)                    │ │
│  │  - Weekly session count aggregation                    │ │
│  │  - Booking validation                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Auto-Inactivation Service (US-005)                    │ │
│  │  - Dormancy detection                                  │ │
│  │  - Status update + comment documentation               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      UI Components                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Calendar     │  │ Body Checkup │  │ Session Limit│      │
│  │ Event Icons  │  │ Dialog       │  │ Warning      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### New Tables

#### `studio_planning_settings`

Stores global configuration for planning parameters.

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

-- Constraint: Only one settings row allowed
ALTER TABLE studio_planning_settings ADD CONSTRAINT single_settings_row CHECK (id IS NOT NULL);
CREATE UNIQUE INDEX idx_single_settings ON studio_planning_settings ((id IS NOT NULL));
```

#### `member_body_checkups`

Tracks member body checkup history.

```sql
CREATE TABLE member_body_checkups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  checkup_date DATE NOT NULL,
  weight DECIMAL(5,2), -- Optional: in kg
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) -- Admin who logged checkup
);

CREATE INDEX idx_body_checkups_member ON member_body_checkups(member_id);
CREATE INDEX idx_body_checkups_date ON member_body_checkups(checkup_date DESC);
```

### Modified Tables

#### `members`

Add tracking field for auto-inactivation.

```sql
ALTER TABLE members ADD COLUMN last_activity_check TIMESTAMPTZ;
```

---

## 🔧 Database Functions

### `get_active_planning_settings()`

Returns the active planning settings (there should only be one row).

```sql
CREATE OR REPLACE FUNCTION get_active_planning_settings()
RETURNS TABLE (
  subscription_warning_days INTEGER,
  body_checkup_sessions INTEGER,
  payment_reminder_days INTEGER,
  max_sessions_per_week INTEGER,
  inactivity_months INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
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

### `get_latest_body_checkup(member_id UUID)`

Fetch the most recent body checkup for a member.

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
    -- No checkup found, count all sessions
    SELECT COUNT(*) INTO v_session_count
    FROM training_sessions ts
    WHERE ts.member_id = p_member_id
      AND ts.status = 'completed';
  END IF;

  RETURN QUERY SELECT v_latest_checkup_date, v_session_count;
END;
$$ LANGUAGE plpgsql;
```

### `check_studio_session_limit(week_start DATE, week_end DATE)`

Check if studio has reached weekly session limit.

```sql
CREATE OR REPLACE FUNCTION check_studio_session_limit(
  p_week_start DATE,
  p_week_end DATE
)
RETURNS TABLE (
  current_count INTEGER,
  max_allowed INTEGER,
  can_book BOOLEAN
) AS $$
DECLARE
  v_current_count INTEGER;
  v_max_allowed INTEGER;
BEGIN
  -- Get max allowed from settings
  SELECT max_sessions_per_week INTO v_max_allowed
  FROM studio_planning_settings
  LIMIT 1;

  -- Count sessions in this week
  SELECT COUNT(*) INTO v_current_count
  FROM training_sessions
  WHERE session_date >= p_week_start
    AND session_date <= p_week_end
    AND status != 'cancelled'; -- Exclude cancelled sessions

  RETURN QUERY SELECT
    v_current_count,
    v_max_allowed,
    (v_current_count < v_max_allowed) AS can_book;
END;
$$ LANGUAGE plpgsql;
```

### `auto_inactivate_dormant_members()`

Automatically inactivate members with no attendance for configured months.

```sql
CREATE OR REPLACE FUNCTION auto_inactivate_dormant_members()
RETURNS TABLE (
  inactivated_count INTEGER,
  member_ids UUID[]
) AS $$
DECLARE
  v_inactivity_months INTEGER;
  v_threshold_date DATE;
  v_member_record RECORD;
  v_inactivated_count INTEGER := 0;
  v_member_ids UUID[] := ARRAY[]::UUID[];
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
  LOOP
    -- Update member status
    UPDATE members
    SET status = 'inactive',
        last_activity_check = NOW()
    WHERE id = v_member_record.id;

    -- Add system comment documenting auto-inactivation
    INSERT INTO member_comments (member_id, comment, created_by_system)
    VALUES (
      v_member_record.id,
      'Automatically marked as inactive due to ' || v_inactivity_months || ' months of no attendance.',
      TRUE
    );

    v_inactivated_count := v_inactivated_count + 1;
    v_member_ids := array_append(v_member_ids, v_member_record.id);
  END LOOP;

  RETURN QUERY SELECT v_inactivated_count, v_member_ids;
END;
$$ LANGUAGE plpgsql;
```

---

## 📂 File Structure

```
src/
├── features/
│   ├── studio-settings/
│   │   ├── components/
│   │   │   ├── PlanningSettingsForm.tsx       # US-001
│   │   │   └── __tests__/
│   │   ├── hooks/
│   │   │   ├── use-planning-settings.ts       # US-001
│   │   │   └── __tests__/
│   │   └── lib/
│   │       ├── planning-settings-db.ts        # US-001
│   │       └── __tests__/
│   │
│   ├── members/
│   │   ├── components/
│   │   │   ├── BodyCheckupDialog.tsx          # US-002
│   │   │   ├── BodyCheckupHistory.tsx         # US-002
│   │   │   └── __tests__/
│   │   ├── hooks/
│   │   │   ├── use-body-checkups.ts           # US-002
│   │   │   └── __tests__/
│   │   └── lib/
│   │       ├── body-checkup-db.ts             # US-002
│   │       ├── auto-inactivation-utils.ts     # US-005
│   │       └── __tests__/
│   │
│   ├── calendar/
│   │   ├── components/
│   │   │   ├── PlanningIndicatorIcons.tsx     # US-003
│   │   │   └── __tests__/
│   │   ├── hooks/
│   │   │   ├── use-calendar-sessions.ts       # Modified for US-003
│   │   │   └── __tests__/
│   │   └── lib/
│   │       ├── planning-indicators.ts         # US-003
│   │       └── __tests__/
│   │
│   └── training-sessions/
│       ├── components/
│       │   ├── SessionLimitWarning.tsx        # US-004
│       │   └── __tests__/
│       ├── hooks/
│       │   ├── use-studio-session-limit.ts    # US-004
│       │   └── __tests__/
│       └── lib/
│           ├── session-limit-utils.ts         # US-004
│           └── __tests__/
│
└── lib/
    └── cron-jobs/
        └── auto-inactivation-job.ts           # US-005
```

---

## 🎨 UI Components

### PlanningSettingsForm (US-001)

**Location:** `src/features/studio-settings/components/PlanningSettingsForm.tsx`

**Props:**

```typescript
interface PlanningSettingsFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}
```

**Features:**

- Form validation with React Hook Form + Zod
- Number inputs for all 5 parameters
- Icon previews next to each input
- Save/Cancel buttons
- Success toast on save
- Error handling

### BodyCheckupDialog (US-002)

**Location:** `src/features/members/components/BodyCheckupDialog.tsx`

**Props:**

```typescript
interface BodyCheckupDialogProps {
  memberId: string;
  memberName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
```

**Features:**

- Date picker (default: today)
- Weight input (optional, in kg)
- Notes textarea (optional)
- Form validation
- Success notification

### PlanningIndicatorIcons (US-003)

**Location:** `src/features/calendar/components/PlanningIndicatorIcons.tsx`

**Props:**

```typescript
interface PlanningIndicatorIconsProps {
  member: Member;
  session: TrainingSession;
  settings: PlanningSettings;
}
```

**Features:**

- Render up to 3 icons per session
- Tooltip with detailed information
- Conditional rendering based on thresholds
- Performance optimized (React.memo)

### SessionLimitWarning (US-004)

**Location:** `src/features/training-sessions/components/SessionLimitWarning.tsx`

**Props:**

```typescript
interface SessionLimitWarningProps {
  currentCount: number;
  maxAllowed: number;
  canBook: boolean;
}
```

**Features:**

- Alert component showing limit status
- Progress bar visual
- Disable booking when limit reached

---

## 🔗 API Endpoints

All database operations use Supabase client directly. No custom API endpoints needed.

**Example Usage:**

```typescript
import { supabase } from "@/lib/supabase";

// Fetch planning settings
const { data: settings } = await supabase
  .from("studio_planning_settings")
  .select("*")
  .single();

// Update settings
const { error } = await supabase
  .from("studio_planning_settings")
  .update({ subscription_warning_days: 30 })
  .eq("id", settings.id);

// Log body checkup
const { error } = await supabase.from("member_body_checkups").insert({
  member_id: memberId,
  checkup_date: formatForDatabase(new Date()),
  weight: 75.5,
  notes: "Great progress!",
});
```

---

## 🧪 Testing Strategy

### Unit Tests

**Coverage Requirements:**

- All utility functions: 100%
- All hooks: 100%
- Components: 80%+

**Test Files:**

- `planning-settings-db.test.ts` - Database utility tests
- `use-planning-settings.test.ts` - Hook tests
- `planning-indicators.test.ts` - Calculation logic tests
- `session-limit-utils.test.ts` - Booking limit tests

### Integration Tests

Test complete workflows:

1. **Settings → Calendar Icons**
   - Update settings
   - Verify icons update in calendar

2. **Body Checkup → Icon Display**
   - Log checkup
   - Verify icon appears after threshold

3. **Session Booking → Limit Enforcement**
   - Book sessions up to limit
   - Verify booking blocked when limit reached

### Manual Testing

See AGENT-GUIDE.md for detailed manual testing checklists.

---

## 🚀 Performance Considerations

### Calendar Icon Rendering

**Challenge:** Rendering icons for 100+ sessions can cause lag

**Solutions:**

- Use `React.memo` for `PlanningIndicatorIcons`
- Use `useMemo` for indicator calculations
- Batch database queries (1 query for all session data)
- Use SQL aggregations instead of client-side calculations

### Session Limit Checking

**Challenge:** Concurrent bookings could exceed limit

**Solutions:**

- Database-level constraints
- Transaction locks during booking
- Pessimistic locking on session count

### Auto-Inactivation Job

**Challenge:** Processing thousands of members

**Solutions:**

- Run during off-peak hours (midnight)
- Batch process in chunks of 100 members
- Use database-level batch updates
- Add timeout protection

---

## 🔒 Security Considerations

### Access Control

- **Planning Settings:** Admin only
- **Body Checkup Logging:** Admin and trainers
- **Auto-Inactivation:** Admin only (manual trigger)
- **Calendar Icons:** Visible to all staff

### Data Validation

- All number inputs: Minimum 1, Maximum 999
- Date inputs: Use `date-utils.ts` for consistency
- Database constraints prevent invalid data

### Audit Trail

- All setting changes logged with `updated_at` timestamp
- Body checkups include `created_by` reference
- Auto-inactivation creates comment for documentation

---

## 📊 Analytics & Monitoring

**Metrics to Track:**

- Number of auto-inactivated members per month
- Session limit reached frequency
- Body checkup compliance rate
- Subscription renewal rate after warnings

**Potential Dashboards:**

- Planning parameter effectiveness report
- Member activity trends
- Studio capacity utilization

---

## 🛠️ Maintenance & Future Enhancements

### Potential Improvements

**Phase 2 Features:**

- Email/SMS notifications for payment reminders
- Customizable icon types and colors
- Per-membership-type planning parameters
- Historical settings tracking (audit log)
- Auto-renewal for subscriptions
- Bulk body checkup import

### Known Limitations

- Week definition is hardcoded (Monday-Sunday)
- Icons may overlap if all 3 appear simultaneously
- Auto-inactivation requires manual trigger initially (scheduled job is phase 2)

---

## 📚 Related Documentation

- `START-HERE.md` - Entry point for implementation
- `AGENT-GUIDE.md` - Step-by-step implementation workflow
- `STATUS.md` - Progress tracking
- Individual user stories: `US-001.md` through `US-005.md`

---

**Questions or issues?** Refer to AGENT-GUIDE.md or consult CLAUDE.md for project standards.
