# AGENT-GUIDE: Session-Subscription Consistency Fix Implementation Workflow

This guide provides step-by-step instructions for systematically implementing the Session-Subscription Consistency Fix feature.

---

## Pre-Implementation Checklist

### MANDATORY: Git Branch Verification

**BEFORE ANY WORK**, verify you are on the correct feature branch:

```bash
git branch --show-current
```

**Required branch**: `feature/session-subscription-consistency-fix`

**If not on this branch**:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/session-subscription-consistency-fix
git branch --show-current  # Verify
```

**NEVER proceed without feature branch verification!**

### Environment Setup

- [ ] Node.js 18+ installed
- [ ] Dependencies up to date: `npm install`
- [ ] Development server runs: `npm run dev`
- [ ] Tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Supabase MCP server configured

---

## Implementation Workflow

### General Process for Each User Story

1. **Read User Story**: Understand acceptance criteria and scope
2. **Update STATUS.md**: Mark story as "In Progress"
3. **Implement**: Follow story-specific steps below
4. **Test**: Run tests specified in story
5. **Verify**: Check acceptance criteria met
6. **Update STATUS.md**: Mark story as "Completed"
7. **Commit**: Meaningful commit message with story reference

### Commit Message Format

```
type(scope): description [US-XXX]

Examples:
- feat(database): add subscription_id to training_sessions [US-002]
- fix(sessions): restore credits to original subscription [US-003]
- refactor(ui): standardize session counting logic [US-004]
```

---

## US-001: Data Audit & Discovery

### Goal

Understand current data inconsistencies without making changes (read-only).

### Steps

1. **Create audit script**:

   ```bash
   # Create script file
   touch scripts/audit-session-subscription-consistency.ts
   ```

2. **Implement audit queries**:
   - Query members with multiple active subscriptions
   - Find sessions without clear subscription attribution
   - Calculate session count mismatches
   - Identify negative remaining_sessions
   - Check for orphaned sessions

3. **Generate report**:
   - Summarize findings by category
   - Count affected records
   - Assess severity (critical/high/medium/low)
   - Provide repair recommendations

4. **Review findings**:
   - Document in STATUS.md under "Audit Findings"
   - Discuss any unexpected issues
   - Adjust plan if necessary

### Testing

- Manual review of audit output
- Verify no database modifications occurred
- Check query performance on large datasets

### Completion Criteria

- [ ] Audit script runs successfully
- [ ] Report generated with all categories
- [ ] Findings documented in STATUS.md
- [ ] No database changes made

### Commit

```bash
git add scripts/audit-session-subscription-consistency.ts
git commit -m "feat(audit): add session-subscription consistency audit script [US-001]"
```

---

## US-002: Database Schema Migrations

### Goal

Add structural integrity constraints and subscription_id column.

### Steps

1. **Migration 1: Add subscription_id column**:

   ```typescript
   // Use Supabase MCP: mcp__supabase__apply_migration
   // Name: add_subscription_id_to_training_sessions
   // Query:
   ALTER TABLE training_sessions
   ADD COLUMN subscription_id UUID REFERENCES member_subscriptions(id);

   COMMENT ON COLUMN training_sessions.subscription_id IS
   'Direct reference to the subscription this session is associated with';
   ```

2. **Backfill existing sessions**:

   ```typescript
   // Use Supabase MCP: mcp__supabase__execute_sql
   // Query to backfill subscription_id for existing sessions
   UPDATE training_sessions ts
   SET subscription_id = (
     SELECT ms.id
     FROM member_subscriptions ms
     WHERE ms.member_id = ts.member_id
       AND ms.status = 'active'
     ORDER BY ms.created_at DESC
     LIMIT 1
   )
   WHERE ts.subscription_id IS NULL
     AND ts.session_type IN ('member', 'makeup', 'contractual');
   ```

3. **Migration 2: Make subscription_id NOT NULL** (for relevant session types):

   ```sql
   -- Add constraint: subscription_id required for member/makeup/contractual sessions
   ALTER TABLE training_sessions
   ADD CONSTRAINT session_subscription_required
   CHECK (
     (session_type IN ('member', 'makeup', 'contractual') AND subscription_id IS NOT NULL)
     OR (session_type IN ('trial', 'guest'))
   );
   ```

4. **Migration 3: Unique active subscription constraint**:

   ```sql
   CREATE UNIQUE INDEX idx_one_active_subscription_per_member
   ON member_subscriptions(member_id)
   WHERE status = 'active';
   ```

5. **Migration 4: Check constraints**:

   ```sql
   ALTER TABLE member_subscriptions
   ADD CONSTRAINT used_sessions_within_total
   CHECK (used_sessions <= total_sessions_snapshot);

   ALTER TABLE member_subscriptions
   ADD CONSTRAINT remaining_sessions_nonnegative
   CHECK (remaining_sessions >= 0);
   ```

6. **Create down migrations** for each (rollback capability)

7. **Update TypeScript types**:
   ```typescript
   // src/features/database/lib/types.ts
   export interface TrainingSession {
     // ... existing fields
     subscription_id: string | null; // Add this
   }
   ```

### Testing

- Test on development branch first
- Try creating 2nd active subscription → should fail
- Try creating session without subscription_id → should fail (for member type)
- Verify backfill correctly attributed sessions
- Run: `npm run build` (type checking)

### Completion Criteria

- [ ] All migrations applied successfully
- [ ] Existing sessions have subscription_id (where applicable)
- [ ] Unique constraint prevents multiple active subscriptions
- [ ] Check constraints validate data integrity
- [ ] TypeScript types updated
- [ ] Down migrations tested

### Commit

```bash
git add src/features/database/lib/types.ts
git commit -m "feat(database): add subscription_id column and integrity constraints [US-002]"
```

---

## US-003: Business Logic Fixes

### Goal

Fix session creation, deletion, and counting logic to use new subscription_id and prevent race conditions.

### Steps

1. **Update session creation** (`use-training-sessions.ts`):
   - Store `subscription_id` when creating member/makeup sessions
   - Use transaction to prevent race conditions:

     ```typescript
     // Pseudo-code
     const subscription = await getActiveSubscription(memberId);
     if (!subscription || subscription.remaining_sessions <= 0) {
       throw new Error("No remaining sessions");
     }

     const { data: session } = await supabase
       .from("training_sessions")
       .insert({
         ...sessionData,
         subscription_id: subscription.id, // Store reference
       })
       .select()
       .single();

     // Consume session (within same transaction if possible)
     await consumeSession(subscription.id);
     ```

2. **Fix session deletion credit restoration** (`use-training-sessions.ts`):
   - Restore to original subscription (via subscription_id):
     ```typescript
     // Lines 735-778 refactor
     if (session.subscription_id) {
       await restoreSessionCredit(session.subscription_id);
     } else {
       // Fallback: restore to current active (log warning)
       console.warn(
         "Session missing subscription_id, using active subscription"
       );
       const activeSub = await getActiveSubscription(session.member_id);
       if (activeSub) await restoreSessionCredit(activeSub.id);
     }
     ```

3. **Filter session counts by type** (`use-member-dialog-data.ts`):
   - Exclude trial/guest/cancelled from subscription counts:
     ```typescript
     // Lines 83-89 update
     .eq("booking_status", "confirmed")
     .eq("training_sessions.status", "completed")
     .in("session_type", ["member", "makeup", "contractual"]) // Add filter
     ```

4. **Fix contractual session counting** (`subscription-utils.ts`):
   - Handle missing trial session edge case (lines 66-103):
     ```typescript
     // If no trial session, use member's join_date or subscription start_date
     const startDate =
       trialSession?.scheduled_start ||
       member.join_date ||
       subscription.start_date;
     ```

5. **Update remaining_sessions query** (`use-member-dialog-data.ts`):
   - Fetch from subscription table directly:
     ```typescript
     const { data: subscription } = await supabase
       .from("member_subscriptions")
       .select("remaining_sessions")
       .eq("member_id", memberId)
       .eq("status", "active")
       .maybeSingle();
     ```

### Testing

- Unit tests for session creation/deletion
- Test race condition scenario (concurrent bookings)
- Test credit restoration to correct subscription
- Verify session type filtering
- Run: `npm test` (all tests must pass)

### Completion Criteria

- [ ] Session creation stores subscription_id
- [ ] Transaction prevents race conditions
- [ ] Deletion restores to original subscription
- [ ] Session counting filters by type
- [ ] Contractual counting handles edge cases
- [ ] All tests pass

### Commit

```bash
git add src/features/training-sessions/ src/features/memberships/
git commit -m "fix(sessions): implement subscription_id tracking and fix credit restoration [US-003]"
```

---

## US-004: UI Consistency Updates

### Goal

Ensure all UI components display accurate, consistent session data.

### Steps

1. **Update SessionStatsCards**:
   - Query subscription directly for remaining_sessions
   - Remove reliance on session data having it

2. **Update MemberDetailsTab**:
   - Use standardized counting logic from use-member-dialog-data
   - Ensure consistency with SessionStatsCards

3. **Update MemberSessionsTable** (if needed):
   - Filter by subscription_id for clarity
   - Show subscription reference in session details

4. **Manual UI testing checklist**:
   - [ ] Member with active subscription shows correct counts
   - [ ] Member without subscription shows "N/A" appropriately
   - [ ] Completed + scheduled + remaining = total
   - [ ] Creating session updates counts immediately
   - [ ] Deleting session updates counts immediately
   - [ ] Trial/guest sessions don't affect subscription counts

### Testing

- Manual testing in development environment
- Test edge cases: no subscription, expired subscription, zero remaining
- Verify UI updates in real-time after session operations

### Completion Criteria

- [ ] All components use consistent data source
- [ ] Session counts accurate across all views
- [ ] Edge cases handled gracefully
- [ ] No console errors
- [ ] TypeScript build succeeds

### Commit

```bash
git add src/features/training-sessions/components/ src/features/members/components/
git commit -m "refactor(ui): standardize session count display across components [US-004]"
```

---

## US-005: Validation & Monitoring System

### Goal

Create automated validation to detect and alert on data inconsistencies.

### Steps

1. **Create validation utility** (`session-validator.ts`):

   ```typescript
   export async function validateSessionIntegrity(memberId: string) {
     const subscription = await getActiveSubscription(memberId);
     if (!subscription)
       return { valid: true, message: "No active subscription" };

     const completed = await countCompletedSessions(memberId, subscription.id);
     const scheduled = await countScheduledSessions(memberId, subscription.id);
     const remaining = subscription.remaining_sessions;

     const expected = subscription.total_sessions_snapshot;
     const actual = completed + scheduled + remaining;

     return {
       valid: actual === expected,
       expected,
       actual,
       breakdown: { completed, scheduled, remaining },
       message:
         actual === expected
           ? "Integrity check passed"
           : "Session count mismatch",
     };
   }
   ```

2. **Create validation hook** (`use-session-integrity-validator.ts`):
   - Hook to check integrity when viewing member details
   - Return validation result for UI display

3. **Create database function**:

   ```sql
   CREATE OR REPLACE FUNCTION check_session_integrity(p_member_id UUID)
   RETURNS JSON AS $$
   -- Implementation
   $$ LANGUAGE SQL;
   ```

4. **Add integration tests** (`session-integrity.test.ts`):
   - Test validation detects mismatches
   - Test validation passes with correct data
   - Test edge cases

### Testing

- Run validation on test members
- Verify detects known inconsistencies
- Run end-to-end validation tests
- Run: `npm test` (all tests pass)

### Completion Criteria

- [ ] Validation utility implemented
- [ ] Hook integrated in member details view
- [ ] Database function created
- [ ] Integration tests pass
- [ ] Validation runs without performance issues

### Commit

```bash
git add src/features/training-sessions/lib/session-validator.ts
git add src/features/training-sessions/hooks/use-session-integrity-validator.ts
git add src/features/training-sessions/__tests__/session-integrity.test.ts
git commit -m "feat(validation): add session integrity validation system [US-005]"
```

---

## Final Verification

### Before Creating PR

- [ ] All 5 user stories completed
- [ ] All tests pass: `npm test`
- [ ] No TypeScript errors: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Manual UI testing completed
- [ ] STATUS.md updated with "Completed" status
- [ ] All commits follow message format

### Create Pull Request

```bash
# Push feature branch
git push -u origin feature/session-subscription-consistency-fix

# Create PR to dev
gh pr create --title "Session-Subscription Consistency Fix" --body "$(cat <<'EOF'
## Summary
Comprehensive fix for session-subscription relationship issues including:
- Database constraints for data integrity
- Direct subscription_id foreign key relationship
- Fixed session counting logic (completed + scheduled + remaining = total)
- Eliminated race conditions in booking/deletion
- Standardized UI display across all components
- Validation system for ongoing monitoring

## User Stories Completed
- US-001: Data Audit & Discovery
- US-002: Database Schema Migrations
- US-003: Business Logic Fixes
- US-004: UI Consistency Updates
- US-005: Validation & Monitoring System

## Testing
- [x] All unit tests pass
- [x] Integration tests added and passing
- [x] Manual UI testing completed
- [x] Database migrations tested on dev branch
- [x] Validation system verified

## Breaking Changes
- Database schema changes (backward compatible with migration)
- Session creation now requires active subscription for member/makeup types

## Deployment Notes
- Run migrations before deploying code
- Verify backfill completed successfully on staging
- Monitor validation results after deployment

EOF
)"
```

---

## Rollback Procedures

### If Issues Arise

1. **During US-002** (migrations):

   ```bash
   # Run down migrations
   # Via Supabase MCP or SQL console
   ```

2. **During US-003** (logic):

   ```bash
   git revert <commit-hash>
   git push
   ```

3. **Production issues**:
   - Revert PR merge to dev
   - Investigate root cause
   - Fix and retest before re-merging

---

## Post-Deployment Monitoring

### Week 1 After Deployment

- [ ] Monitor validation results daily
- [ ] Check for constraint violation errors
- [ ] Verify session counts accurate
- [ ] Review user-reported issues

### Ongoing

- [ ] Run integrity validation monthly
- [ ] Monitor for new inconsistencies
- [ ] Update documentation as needed

---

**Remember**: Follow this guide systematically. Don't skip steps. Update STATUS.md as you progress. Test thoroughly at each phase.
