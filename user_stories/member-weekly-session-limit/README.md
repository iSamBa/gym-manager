# Member Weekly Session Limit Enforcement - Technical Documentation

## 📋 Overview

This feature enforces the business rule that members can book a maximum of 1 "Member" type session per week, while allowing unlimited "Makeup" sessions and other session types.

**Feature Status**: 🚧 In Development

**Branch**: `feature/member-weekly-session-limit`

**Priority**: P0 (Must Have)

**Timeline**: 2-3 days estimated

---

## 🎯 Business Requirements

### The Problem

**Current State**:

- Members can book unlimited "Member" sessions per week
- Business rule exists in documentation but is not enforced
- Type guard function `bypassesWeeklyLimit()` exists but is never called
- No database or application-level validation

**Impact**:

- Revenue loss (members using regular sessions instead of makeup sessions)
- Scheduling conflicts and capacity management issues
- Business rule violations
- Data integrity concerns

### The Solution

**Implement two-layer validation**:

1. **Database Layer**: RPC function for data integrity
2. **Application Layer**: Real-time validation with user feedback

**Session Type Rules**:

| Session Type      | Weekly Limit | Bypass Validation |
| ----------------- | ------------ | ----------------- |
| **Member**        | 1 per week   | ❌ No             |
| **Makeup**        | Unlimited    | ✅ Yes            |
| **Trial**         | Unlimited    | ✅ Yes            |
| **Contractual**   | Unlimited    | ✅ Yes            |
| **Collaboration** | Unlimited    | ✅ Yes            |

**Week Definition**: Sunday to Saturday in local timezone

---

## 🏗️ Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                          │
│  (Session Booking Form - TrainingSessionsView.tsx)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Application Layer                              │
│                                                             │
│  useCreateTrainingSession Hook                             │
│  └─ Validation Logic                                       │
│     ├─ Check: bypassesWeeklyLimit(sessionType)            │
│     ├─ If "member" type → Check weekly limit              │
│     └─ Call: checkMemberWeeklyLimit()                     │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Helper Utilities                               │
│                                                             │
│  session-limit-utils.ts                                    │
│  └─ checkMemberWeeklyLimit(memberId, weekStart, weekEnd)  │
│                                                             │
│  type-guards.ts                                            │
│  └─ bypassesWeeklyLimit(sessionType)                      │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Database Layer (Supabase)                      │
│                                                             │
│  RPC Function: check_member_weekly_session_limit()         │
│  ├─ Count "member" sessions for member in week            │
│  ├─ Exclude cancelled sessions                            │
│  └─ Return: { can_book, current_count, max_allowed }      │
│                                                             │
│  Index: (member_id, session_type, scheduled_start)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation Details

### 1. Database Layer (US-001)

**RPC Function Signature**:

```sql
CREATE OR REPLACE FUNCTION check_member_weekly_session_limit(
  p_member_id UUID,
  p_week_start DATE,
  p_week_end DATE,
  p_session_type TEXT
) RETURNS JSONB
```

**Function Logic**:

```sql
-- Count existing "member" sessions for this member this week
SELECT COUNT(*) FROM training_sessions
WHERE member_id = p_member_id
  AND session_type = 'member'
  AND status != 'cancelled'
  AND DATE(scheduled_start) >= p_week_start
  AND DATE(scheduled_start) <= p_week_end;

-- Return validation result
RETURN jsonb_build_object(
  'can_book', (p_session_type != 'member') OR (count < 1),
  'current_member_sessions', count,
  'max_allowed', 1,
  'message', ...
);
```

**Performance Index**:

```sql
CREATE INDEX IF NOT EXISTS idx_training_sessions_member_weekly_limit
ON training_sessions(member_id, session_type, scheduled_start)
WHERE status != 'cancelled';
```

**Return Type**:

```typescript
interface MemberWeeklyLimitResult {
  can_book: boolean;
  current_member_sessions: number;
  max_allowed: number;
  message: string;
}
```

---

### 2. Application Layer (US-002)

**Helper Function** (`session-limit-utils.ts`):

```typescript
export async function checkMemberWeeklyLimit(
  memberId: string,
  scheduledStart: Date
): Promise<MemberWeeklyLimitResult> {
  const weekRange = getWeekRange(scheduledStart);

  const { data, error } = await supabase.rpc(
    "check_member_weekly_session_limit",
    {
      p_member_id: memberId,
      p_week_start: formatForDatabase(weekRange.start),
      p_week_end: formatForDatabase(weekRange.end),
      p_session_type: "member",
    }
  );

  if (error) throw error;
  return data;
}
```

**Integration in Hook** (`use-training-sessions.ts`):

```typescript
// In useCreateTrainingSession mutation
async mutationFn(data: CreateSessionInput) {
  // MEMBER SESSION: Validate weekly limit
  if (data.session_type === 'member' && data.member_id) {
    const result = await checkMemberWeeklyLimit(
      data.member_id,
      new Date(data.scheduled_start)
    );

    if (!result.can_book) {
      throw new Error(result.message);
    }
  }

  // Continue with session creation...
}
```

**Type Guard Usage**:

```typescript
import { bypassesWeeklyLimit } from "@/features/training-sessions/lib/type-guards";

// Use existing type guard
if (!bypassesWeeklyLimit(data.session_type)) {
  // Run validation for member sessions
}
```

---

### 3. Date Handling

**Week Range Calculation**:

```typescript
import { getLocalDateString, formatForDatabase } from "@/lib/date-utils";

function getWeekRange(date: Date) {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  // Start of week (Sunday)
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  // End of week (Saturday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return {
    start: weekStart,
    end: weekEnd,
  };
}
```

**Timezone Handling**:

- All date operations use local timezone (NOT UTC)
- Use `getLocalDateString()` for date comparisons
- Use `formatForDatabase()` for PostgreSQL `date` columns

---

## 🧪 Testing Strategy (US-003)

### Test Categories

**1. Unit Tests** (`member-weekly-limit.test.ts`):

```typescript
describe("checkMemberWeeklyLimit", () => {
  it("allows booking when member has 0 sessions");
  it("blocks booking when member has 1 member session");
  it("allows makeup session when member has 1 member session");
  it("excludes cancelled sessions from count");
  it("handles week boundaries correctly");
  it("handles different timezones correctly");
});
```

**2. Integration Tests**:

```typescript
describe("Session Booking with Weekly Limit", () => {
  it("prevents booking 2nd member session in same week");
  it("allows unlimited makeup sessions");
  it("allows trial sessions regardless of member sessions");
  it("shows proper error message on limit exceeded");
});
```

**3. Edge Cases**:

- Member has cancelled member session (should not count)
- Member has member session from previous week (should allow new one)
- Member books session on Sunday vs Saturday (week boundaries)
- Member in different timezone
- Concurrent booking attempts
- Member with no subscription (should fail for different reason)

---

## 📊 Data Model

### Training Sessions Table

**Relevant Columns**:

```sql
training_sessions (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  session_type TEXT CHECK (session_type IN ('member', 'makeup', 'trial', 'contractual', 'collaboration')),
  scheduled_start TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  ...
)
```

**New Index**:

```sql
CREATE INDEX idx_training_sessions_member_weekly_limit
ON training_sessions(member_id, session_type, scheduled_start)
WHERE status != 'cancelled';
```

**Query Performance**:

- **Before**: Full table scan (~1000ms for 10k rows)
- **After**: Index seek (~10ms with index)

---

## 🔒 Security Considerations

### Row Level Security (RLS)

**Existing RLS Policies** (no changes needed):

- Users can only book sessions for their gym
- Admins/trainers can book for any member in their gym
- Members can only view their own sessions

### Input Validation

**Validation Points**:

1. **Zod Schema** (`validation.ts`):
   - Session type must be valid enum
   - Member ID required for member/makeup sessions
   - Scheduled start must be future date

2. **Database Constraint**:
   - Session type CHECK constraint
   - Foreign key on member_id

3. **RPC Function**:
   - Parameterized query (SQL injection prevention)
   - SECURITY DEFINER for consistent permissions

---

## 📈 Performance Considerations

### Query Performance

**Before Optimization**:

```sql
-- Full table scan
SELECT COUNT(*) FROM training_sessions
WHERE member_id = ? AND session_type = 'member'
-- ~1000ms for 10k rows
```

**After Optimization**:

```sql
-- Index seek with partial index
-- Uses idx_training_sessions_member_weekly_limit
-- ~10ms for 10k rows
```

### Application Performance

**Validation Overhead**:

- Additional RPC call per "member" session booking: ~10-50ms
- No impact on makeup/trial/collaboration bookings (bypassed)
- No impact on session list/view operations (only booking)

**Bundle Size**:

- No new dependencies added
- Uses existing utilities and type guards
- No bundle size impact

---

## 🚨 Error Handling

### Error Scenarios

**1. Weekly Limit Exceeded**:

```typescript
Error: "This member already has 1 member session booked this week. Please use the 'Makeup' session type for additional sessions.";
```

**2. Database Error**:

```typescript
Error: "Unable to validate session limit. Please try again.";
// + Log full error for debugging
```

**3. Network Error**:

```typescript
Error: "Connection error. Please check your internet connection and try again.";
```

### User Feedback

**Toast Notifications**:

- ❌ Error toast for limit exceeded (red)
- ℹ️ Info toast suggesting makeup session alternative
- ✅ Success toast on successful booking (green)

---

## 🔄 Migration Strategy

### Backward Compatibility

**No Breaking Changes**:

- ✅ Existing sessions unaffected
- ✅ No schema changes to `training_sessions` table (only new index)
- ✅ No changes to existing API contracts
- ✅ Makeup/trial/collaboration sessions work as before

**Rollback Plan**:

```sql
-- If needed, rollback is safe:
DROP FUNCTION IF EXISTS check_member_weekly_session_limit;
DROP INDEX IF EXISTS idx_training_sessions_member_weekly_limit;
-- Application still works (just no validation)
```

---

## 📚 Related Documentation

- [START-HERE.md](./START-HERE.md) - Feature overview and getting started
- [AGENT-GUIDE.md](./AGENT-GUIDE.md) - Implementation workflow
- [STATUS.md](./STATUS.md) - Current progress tracking
- [CLAUDE.md](../../CLAUDE.md) - Project coding standards
- [Session Types Expansion](../session-types-expansion/README.md) - Original session type definitions
- [RPC Signatures](../../docs/RPC_SIGNATURES.md) - Database function documentation
- [Date Handling Standards](../../docs/DATE-HANDLING-MIGRATION.md) - Date utilities documentation

---

## 🎯 Success Metrics

**Feature is successful when**:

- ✅ 0% of members able to book 2+ member sessions in same week
- ✅ 100% of makeup bookings unaffected
- ✅ <100ms average validation query time
- ✅ <0.1% error rate on booking attempts
- ✅ 100% test coverage on validation logic
- ✅ 0 production incidents related to this feature

---

## 🤝 Contributing

**Before making changes**:

1. Read [AGENT-GUIDE.md](./AGENT-GUIDE.md) for workflow
2. Check [STATUS.md](./STATUS.md) for current progress
3. Follow [CLAUDE.md](../../CLAUDE.md) coding standards
4. Run tests before committing: `npm run lint && npm test`

**Questions?** Refer to individual user story files for detailed acceptance criteria.

---

**Last Updated**: 2025-11-18

**Maintainers**: Development Team

**Status**: 🚧 In Development
