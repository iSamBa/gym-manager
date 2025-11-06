# Session-Subscription Consistency Fix - Status Tracking

**Last Updated**: 2025-10-31
**Feature Branch**: `feature/session-subscription-consistency-fix`
**Overall Status**: 🔴 Not Started

---

## Quick Status Overview

| Phase                         | Status         | Progress | Est. Hours | Actual Hours |
| ----------------------------- | -------------- | -------- | ---------- | ------------ |
| Phase 1: Data Audit           | 🔴 Not Started | 0%       | 3          | -            |
| Phase 2: Database Migrations  | 🔴 Not Started | 0%       | 6          | -            |
| Phase 3: Business Logic Fixes | 🔴 Not Started | 0%       | 8          | -            |
| Phase 4: UI Consistency       | 🔴 Not Started | 0%       | 4          | -            |
| Phase 5: Validation System    | 🔴 Not Started | 0%       | 5          | -            |

**Total Progress**: 0% (0/5 phases complete)
**Total Estimated**: 26 hours
**Total Actual**: - hours

---

## User Story Status

### US-001: Data Audit & Discovery

- **Status**: 🔴 Not Started
- **Assigned**: TBD
- **Started**: -
- **Completed**: -
- **Progress**: 0%

**Acceptance Criteria**:

- [ ] Audit script created and runs successfully
- [ ] Identifies members with multiple active subscriptions
- [ ] Reports session count mismatches
- [ ] Generates severity assessment
- [ ] Provides repair recommendations
- [ ] No database modifications made

**Blockers**: None

**Notes**:

- First step - read-only audit
- Results will inform Phase 2 approach
- Estimated 2-3 hours

---

### US-002: Database Schema Migrations

- **Status**: 🔴 Not Started
- **Assigned**: TBD
- **Started**: -
- **Completed**: -
- **Progress**: 0%
- **Dependencies**: US-001 (need audit results first)

**Acceptance Criteria**:

- [ ] subscription_id column added to training_sessions
- [ ] Existing sessions backfilled with correct subscription_id
- [ ] Unique constraint: one active subscription per member
- [ ] Check constraints: used_sessions validation
- [ ] Check constraints: remaining_sessions >= 0
- [ ] TypeScript types updated
- [ ] Down migrations tested

**Migration Checklist**:

- [ ] Migration 1: Add subscription_id column (nullable)
- [ ] Data backfill: Populate subscription_id for existing sessions
- [ ] Migration 2: Add session_subscription_required constraint
- [ ] Migration 3: Add idx_one_active_subscription_per_member index
- [ ] Migration 4: Add used_sessions_within_total constraint
- [ ] Migration 5: Add remaining_sessions_nonnegative constraint
- [ ] Test migrations on dev branch
- [ ] Verify constraint violations are blocked

**Blockers**: None (pending US-001 completion)

**Notes**:

- High-risk phase - careful testing required
- Test on development branch first
- Verify backfill results before proceeding
- Estimated 5-6 hours

---

### US-003: Business Logic Fixes

- **Status**: 🔴 Not Started
- **Assigned**: TBD
- **Started**: -
- **Completed**: -
- **Progress**: 0%
- **Dependencies**: US-002 (needs subscription_id column)

**Acceptance Criteria**:

- [ ] Session creation stores subscription_id
- [ ] Transaction prevents race conditions
- [ ] Session deletion restores to original subscription
- [ ] Session counting filters by type (exclude trial/guest)
- [ ] Contractual counting handles missing trial session
- [ ] use-training-sessions.ts updated
- [ ] use-member-dialog-data.ts updated
- [ ] subscription-utils.ts updated
- [ ] All tests pass

**Files to Modify**:

- [ ] `src/features/training-sessions/hooks/use-training-sessions.ts`
  - [ ] Update createSession (lines 264-392)
  - [ ] Update deleteSession (lines 688-808)
- [ ] `src/features/training-sessions/hooks/use-member-dialog-data.ts`
  - [ ] Add session_type filtering (line 83-89, 106-112)
  - [ ] Query subscription for remaining_sessions
- [ ] `src/features/memberships/lib/subscription-utils.ts`
  - [ ] Fix contractual counting (lines 66-103)
- [ ] `src/features/database/lib/types.ts`
  - [ ] Add subscription_id to TrainingSession interface

**Test Coverage**:

- [ ] Unit test: session creation stores subscription_id
- [ ] Unit test: session deletion restores to original subscription
- [ ] Unit test: session type filtering works
- [ ] Integration test: concurrent bookings handled correctly
- [ ] Integration test: credit restoration accuracy

**Blockers**: None (pending US-002 completion)

**Notes**:

- Largest phase in terms of code changes
- Focus on transaction safety
- Estimated 7-8 hours

---

### US-004: UI Consistency Updates

- **Status**: 🔴 Not Started
- **Assigned**: TBD
- **Started**: -
- **Completed**: -
- **Progress**: 0%
- **Dependencies**: US-003 (needs fixed logic)

**Acceptance Criteria**:

- [ ] SessionStatsCards queries subscription directly
- [ ] MemberDetailsTab uses standardized logic
- [ ] All components show consistent counts
- [ ] Session type filtering applied consistently
- [ ] Manual UI testing completed
- [ ] No console errors

**Files to Modify**:

- [ ] `src/features/training-sessions/components/SessionStatsCards.tsx`
- [ ] `src/features/training-sessions/components/forms/MemberDetailsTab.tsx`
- [ ] `src/features/members/components/MemberSessionsTable.tsx` (if needed)

**Manual Testing Checklist**:

- [ ] Member with active subscription shows correct counts
- [ ] Member without subscription shows "N/A"
- [ ] Completed + scheduled + remaining = total (verified on screen)
- [ ] Creating session updates counts in real-time
- [ ] Deleting session updates counts in real-time
- [ ] Trial session doesn't affect subscription count
- [ ] Guest session doesn't affect subscription count
- [ ] Cancelled session doesn't appear in counts
- [ ] Edge case: No active subscription handled gracefully
- [ ] Edge case: Zero remaining sessions displays correctly

**Blockers**: None (pending US-003 completion)

**Notes**:

- Primarily data source changes, minimal visual changes
- Focus on consistency across all views
- Estimated 3-4 hours

---

### US-005: Validation & Monitoring System

- **Status**: 🔴 Not Started
- **Assigned**: TBD
- **Started**: -
- **Completed**: -
- **Progress**: 0%
- **Dependencies**: US-002 (structure), US-003 (logic)

**Acceptance Criteria**:

- [ ] Validation utility created (validateSessionIntegrity)
- [ ] Validation hook created (useSessionIntegrityValidator)
- [ ] Database function created (check_session_integrity)
- [ ] Integration tests pass
- [ ] Validation runs without performance issues
- [ ] Admin can view integrity status

**Files to Create**:

- [ ] `src/features/training-sessions/lib/session-validator.ts`
- [ ] `src/features/training-sessions/hooks/use-session-integrity-validator.ts`
- [ ] `src/features/training-sessions/__tests__/session-integrity.test.ts`

**Database Objects to Create**:

- [ ] Function: `check_session_integrity(member_id UUID) RETURNS JSON`

**Test Coverage**:

- [ ] Test: Validation detects count mismatch
- [ ] Test: Validation passes with correct data
- [ ] Test: Edge case - no active subscription
- [ ] Test: Edge case - multiple session types
- [ ] Integration: End-to-end validation on test data

**Blockers**: None (pending US-002, US-003 completion)

**Notes**:

- Monitoring/prevention phase
- Non-blocking - doesn't prevent operations
- Can be deployed gradually
- Estimated 4-5 hours

---

## Milestones

### Milestone 1: Foundation Complete

- **Target Date**: TBD
- **Status**: 🔴 Not Complete
- **Requirements**:
  - [ ] US-001 completed (audit done)
  - [ ] US-002 completed (migrations applied)
  - [ ] Database constraints in place
  - [ ] All sessions have subscription_id

### Milestone 2: Logic Fixes Complete

- **Target Date**: TBD
- **Status**: 🔴 Not Complete
- **Requirements**:
  - [ ] US-003 completed (business logic fixed)
  - [ ] All tests passing
  - [ ] No TypeScript errors
  - [ ] Session creation/deletion working correctly

### Milestone 3: UI Consistency Complete

- **Target Date**: TBD
- **Status**: 🔴 Not Complete
- **Requirements**:
  - [ ] US-004 completed (UI updated)
  - [ ] Manual testing passed
  - [ ] Session counts consistent across all views
  - [ ] Edge cases handled gracefully

### Milestone 4: Feature Complete

- **Target Date**: TBD
- **Status**: 🔴 Not Complete
- **Requirements**:
  - [ ] US-005 completed (validation system)
  - [ ] All user stories done
  - [ ] Full test suite passing
  - [ ] Ready for staging deployment

---

## Blockers & Issues

### Active Blockers

_None currently_

### Resolved Blockers

_None yet_

### Known Issues

_None currently_

---

## Testing Status

### Unit Tests

- **Total**: 0 new tests
- **Passing**: -
- **Failing**: -
- **Coverage**: -%

### Integration Tests

- **Total**: 0 new tests
- **Passing**: -
- **Failing**: -

### Manual Testing

- **Sessions Tested**: 0
- **Edge Cases Tested**: 0
- **Issues Found**: 0

### Build Status

- **TypeScript**: ⚪ Not Run
- **Linting**: ⚪ Not Run
- **Tests**: ⚪ Not Run

---

## Deployment Readiness

### Pre-Deployment Checklist

- [ ] All user stories completed
- [ ] All tests passing (100%)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Manual testing complete
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Rollback plan tested

### Staging Deployment

- **Date**: -
- **Status**: 🔴 Not Ready
- **Verification**: Pending
- **Issues**: None

### Production Deployment

- **Date**: -
- **Status**: 🔴 Not Ready
- **Verification**: Pending
- **Issues**: None

---

## Audit Findings

### Data Inconsistencies Discovered

_To be filled after US-001 completion_

**Summary**:

- Members with multiple active subscriptions: TBD
- Sessions without subscription attribution: TBD
- Session count mismatches: TBD
- Negative remaining_sessions: TBD
- Orphaned sessions: TBD

**Severity Breakdown**:

- Critical: TBD
- High: TBD
- Medium: TBD
- Low: TBD

---

## Metrics & KPIs

### Before Fix (Baseline)

- **Session count mismatches**: Unknown
- **Multiple active subscriptions**: Unknown
- **Sessions without subscription_id**: 100%
- **Constraint violations possible**: Yes

### After Fix (Target)

- **Session count mismatches**: 0%
- **Multiple active subscriptions**: 0% (prevented by constraint)
- **Sessions without subscription_id**: 0% (for member/makeup types)
- **Constraint violations possible**: No (database enforced)

### Actual Results

_To be measured after deployment_

---

## Notes & Decisions

### Key Decisions Made

_Document important decisions here_

**Example**:

- 2025-10-31: Decided to add subscription_id column instead of maintaining implicit linking
- 2025-10-31: Decided to exclude cancelled sessions from all counts
- 2025-10-31: Decided on incremental rollout approach (5 phases)

### Questions & Answers

_Document Q&A here_

**Example**:

- Q: Should cancelled sessions count toward total?
- A: No - they are excluded from all counts and credits are restored when cancelled

---

## Communication Log

### Status Updates

_Log major status updates here_

**2025-10-31**: Feature documentation created, ready to begin implementation

### Stakeholder Communication

_Log stakeholder discussions here_

---

## Next Steps

### Immediate Next Actions

1. Review all documentation (START-HERE, AGENT-GUIDE, README, user stories)
2. Create feature branch: `feature/session-subscription-consistency-fix`
3. Begin US-001: Data Audit & Discovery
4. Generate audit report
5. Review findings and proceed to US-002

### Upcoming Milestones

- Complete US-001 by: TBD
- Complete US-002 by: TBD
- Complete US-003 by: TBD
- Feature complete by: TBD

---

**Status Legend**:

- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed
- 🔵 Blocked
- ⚪ Not Applicable

**Last Updated**: 2025-10-31
**Updated By**: System (initial creation)
