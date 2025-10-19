# AGENT-GUIDE: Planning Parameters Implementation

This guide provides a systematic, step-by-step workflow for implementing the Planning Parameters feature. Follow this guide in order to ensure complete, high-quality implementation.

---

## 🎯 Implementation Philosophy

**Core Principles:**

1. **Feature branch workflow** - Always work on `feature/planning-parameters` branch
2. **Test-driven** - Write tests alongside implementation
3. **Incremental delivery** - Complete one user story fully before moving to next
4. **Quality gates** - Every story must pass linting, tests, and manual verification

---

## 📋 Pre-Implementation Checklist

Before starting ANY implementation work:

- [ ] Read START-HERE.md completely
- [ ] Read README.md for technical architecture
- [ ] Check current branch: `git branch --show-current`
- [ ] Create feature branch if needed: `git checkout -b feature/planning-parameters`
- [ ] Pull latest dev changes: `git pull origin dev`
- [ ] Verify test suite passes: `npm test`
- [ ] Verify build succeeds: `npm run build`

---

## 🚀 Implementation Sequence

### Story 1: Planning Settings UI & CRUD (US-001)

**Goal:** Create the settings management interface for all 5 planning parameters.

**Estimated Time:** 2-3 days

**Steps:**

1. **Database Schema (Day 1 - Morning)**
   - [ ] Create migration for `studio_planning_settings` table
   - [ ] Define columns: `id`, `subscription_warning_days`, `body_checkup_sessions`, `payment_reminder_days`, `max_sessions_per_week`, `inactivity_months`, `created_at`, `updated_at`
   - [ ] Add unique constraint (only 1 settings row allowed)
   - [ ] Create `get_active_planning_settings()` function
   - [ ] Test migration: Verify table created correctly

2. **Database Utilities (Day 1 - Afternoon)**
   - [ ] Create `src/features/studio-settings/lib/planning-settings-db.ts`
   - [ ] Implement `getPlanningSettings()` - Fetch active settings
   - [ ] Implement `updatePlanningSettings()` - Update settings
   - [ ] Implement `initializeDefaultSettings()` - Create default row if missing
   - [ ] Write unit tests in `__tests__/planning-settings-db.test.ts`

3. **React Hook (Day 2 - Morning)**
   - [ ] Create `src/features/studio-settings/hooks/use-planning-settings.ts`
   - [ ] Implement with React Query (useQuery + useMutation)
   - [ ] Add optimistic updates
   - [ ] Handle loading/error states
   - [ ] Write unit tests

4. **UI Components (Day 2 - Afternoon → Day 3 - Morning)**
   - [ ] Create `src/features/studio-settings/components/PlanningSettingsForm.tsx`
   - [ ] Use shadcn/ui Form components
   - [ ] Add validation (minimum values, required fields)
   - [ ] Implement icon previews next to inputs
   - [ ] Add success/error toast notifications
   - [ ] Write component tests

5. **Integration (Day 3 - Afternoon)**
   - [ ] Add "Planning" tab to Studio Settings page
   - [ ] Integrate `PlanningSettingsForm` into tab
   - [ ] Test full CRUD flow manually
   - [ ] Verify form validation
   - [ ] Verify database updates

6. **Quality Assurance**
   - [ ] Run `npm run lint` - Must pass with 0 errors
   - [ ] Run `npm test` - All tests must pass
   - [ ] Run `npm run build` - Must build successfully
   - [ ] Manual testing checklist (see US-001.md)
   - [ ] Update STATUS.md - Mark US-001 as complete

---

### Story 2: Body Checkup Tracking System (US-002)

**Goal:** Enable admins to log and track member body checkups.

**Estimated Time:** 2 days

**Steps:**

1. **Database Schema (Day 1 - Morning)**
   - [ ] Create migration for `member_body_checkups` table
   - [ ] Define columns: `id`, `member_id` (FK), `checkup_date` (date), `weight`, `notes`, `created_at`, `created_by` (FK to users)
   - [ ] Add indexes on `member_id` and `checkup_date`
   - [ ] Create `get_latest_body_checkup(member_id)` function
   - [ ] Create `count_sessions_since_checkup(member_id)` function

2. **Database Utilities (Day 1 - Afternoon)**
   - [ ] Create `src/features/members/lib/body-checkup-db.ts`
   - [ ] Implement `getBodyCheckupHistory(memberId)` - Fetch all checkups
   - [ ] Implement `getLatestBodyCheckup(memberId)` - Fetch most recent
   - [ ] Implement `createBodyCheckup(data)` - Log new checkup
   - [ ] Implement `getSessionsSinceLastCheckup(memberId)` - Count sessions
   - [ ] Write unit tests

3. **React Hooks (Day 2 - Morning)**
   - [ ] Create `src/features/members/hooks/use-body-checkups.ts`
   - [ ] Implement query hooks (useBodyCheckupHistory, useLatestCheckup)
   - [ ] Implement mutation hook (useCreateBodyCheckup)
   - [ ] Write unit tests

4. **UI Components (Day 2 - Afternoon)**
   - [ ] Create `src/features/members/components/BodyCheckupDialog.tsx`
   - [ ] Form fields: Date picker, Weight input, Notes textarea
   - [ ] Validation: Date required, weight optional, notes optional
   - [ ] Create `src/features/members/components/BodyCheckupHistory.tsx`
   - [ ] Display table with date, weight, notes, created_by
   - [ ] Add "Log Checkup" button to member profile
   - [ ] Write component tests

5. **Integration (Day 2 - Evening)**
   - [ ] Add "Body Checkup" section to member profile
   - [ ] Integrate dialog and history components
   - [ ] Test full workflow: Log checkup → View history → Verify database

6. **Quality Assurance**
   - [ ] Run linting and tests
   - [ ] Manual testing checklist (see US-002.md)
   - [ ] Update STATUS.md - Mark US-002 as complete

---

### Story 3: Calendar Visual Indicators (US-003)

**Goal:** Display planning icons in calendar view based on configured thresholds.

**Estimated Time:** 3 days

**Dependencies:** US-001 (settings), US-002 (body checkup data)

**Steps:**

1. **Calculation Utilities (Day 1 - Morning)**
   - [ ] Create `src/features/calendar/lib/planning-indicators.ts`
   - [ ] Implement `shouldShowSubscriptionWarning(member, session, settings)` - Check if within threshold
   - [ ] Implement `shouldShowBodyCheckupReminder(member, session, settings)` - Check sessions count
   - [ ] Implement `shouldShowPaymentReminder(member, session, settings)` - Check days since payment
   - [ ] Write comprehensive unit tests (edge cases, null values, timezone handling)

2. **Data Fetching (Day 1 - Afternoon)**
   - [ ] Modify calendar query to include:
     - Member subscription end_date
     - Latest body checkup date
     - Latest payment date
     - Session count since last checkup
   - [ ] Update `src/features/calendar/hooks/use-calendar-sessions.ts`
   - [ ] Ensure efficient query (use SQL joins, not multiple queries)

3. **Icon Components (Day 2 - Morning)**
   - [ ] Create `src/features/calendar/components/PlanningIndicatorIcons.tsx`
   - [ ] Render three icon types with tooltips:
     - Hourglass (pink/red) - Subscription warning
     - Scale/Weight (gold/yellow) - Body checkup reminder
     - Coins (green) - Payment reminder
   - [ ] Use shadcn/ui Tooltip component
   - [ ] Tooltip content: Show exact date/count/reason
   - [ ] Apply React.memo for performance

4. **Calendar Integration (Day 2 - Afternoon → Day 3 - Morning)**
   - [ ] Integrate `PlanningIndicatorIcons` into calendar event rendering
   - [ ] Position icons appropriately (top-right corner of event)
   - [ ] Ensure icons don't overlap with existing UI
   - [ ] Handle multiple icons (show all 3 if all conditions met)
   - [ ] Test with various calendar views (day, week, month)

5. **Performance Optimization (Day 3 - Afternoon)**
   - [ ] Use useMemo for indicator calculations
   - [ ] Batch database queries
   - [ ] Verify no unnecessary re-renders (React DevTools)
   - [ ] Test with large dataset (100+ sessions)

6. **Quality Assurance**
   - [ ] Run linting and tests
   - [ ] Manual testing checklist (see US-003.md)
   - [ ] Verify icons appear correctly for each scenario
   - [ ] Test edge cases: No subscription, no checkup history, no payments
   - [ ] Update STATUS.md - Mark US-003 as complete

---

### Story 4: Global Studio Session Limit (US-004)

**Goal:** Enforce weekly booking limits across the entire studio.

**Estimated Time:** 2 days

**Dependencies:** US-001 (settings)

**Steps:**

1. **Database Function (Day 1 - Morning)**
   - [ ] Create `check_studio_session_limit(week_start, week_end)` SQL function
   - [ ] Function returns: current_count, max_allowed, can_book (boolean)
   - [ ] Use efficient COUNT query with date range filter
   - [ ] Add indexes if needed for performance

2. **Database Utilities (Day 1 - Afternoon)**
   - [ ] Create `src/features/training-sessions/lib/session-limit-utils.ts`
   - [ ] Implement `checkStudioSessionLimit(date)` - Check if booking allowed
   - [ ] Implement `getStudioSessionCount(weekStart, weekEnd)` - Get current count
   - [ ] Handle week boundaries (Monday-Sunday logic using date-utils)
   - [ ] Write unit tests

3. **React Hook (Day 2 - Morning)**
   - [ ] Create `src/features/training-sessions/hooks/use-studio-session-limit.ts`
   - [ ] Implement useQuery hook to check limit before booking
   - [ ] Add real-time validation (revalidate on mutation)
   - [ ] Write unit tests

4. **UI Components (Day 2 - Afternoon)**
   - [ ] Create `src/features/training-sessions/components/SessionLimitWarning.tsx`
   - [ ] Display alert when limit is reached
   - [ ] Show: "Studio capacity reached for this week (250/250 sessions)"
   - [ ] Disable booking button when limit exceeded
   - [ ] Add informational tooltip

5. **Integration (Day 2 - Evening)**
   - [ ] Integrate limit check into session booking flow
   - [ ] Add validation to booking API endpoint
   - [ ] Show warning in booking UI
   - [ ] Test concurrent booking scenarios
   - [ ] Verify database constraint prevents over-booking

6. **Quality Assurance**
   - [ ] Run linting and tests
   - [ ] Manual testing checklist (see US-004.md)
   - [ ] Test edge cases: Exactly at limit, multiple users booking simultaneously
   - [ ] Verify error messages are user-friendly
   - [ ] Update STATUS.md - Mark US-004 as complete

---

### Story 5: Automatic Member Inactivation (US-005)

**Goal:** Auto-inactivate members with no attendance for X months, with documentation.

**Estimated Time:** 2-3 days

**Dependencies:** US-001 (settings)

**Steps:**

1. **Database Function (Day 1 - Morning)**
   - [ ] Create `auto_inactivate_dormant_members()` SQL function
   - [ ] Function logic:
     - Find members with no sessions in last X months
     - Update status to 'inactive'
     - Insert comment documenting auto-inactivation
     - Return count of affected members
   - [ ] Add `last_activity_check` column to members table (timestamptz)

2. **Database Utilities (Day 1 - Afternoon)**
   - [ ] Create `src/features/members/lib/auto-inactivation-utils.ts`
   - [ ] Implement `runAutoInactivation()` - Trigger function
   - [ ] Implement `getInactivationCandidates()` - Preview who would be affected
   - [ ] Write unit tests

3. **Manual Trigger UI (Day 2 - Morning)**
   - [ ] Add "Run Auto-Inactivation" button to Studio Settings
   - [ ] Create confirmation dialog with preview list
   - [ ] Show: "X members will be marked as inactive"
   - [ ] Display success message: "X members auto-inactivated"
   - [ ] Write component tests

4. **Scheduled Job Setup (Day 2 - Afternoon)**
   - [ ] Create `src/lib/cron-jobs/auto-inactivation-job.ts`
   - [ ] Use Supabase Edge Function or similar scheduling mechanism
   - [ ] Configure to run daily at midnight
   - [ ] Add logging for audit trail
   - [ ] Test job execution manually

5. **Admin Reactivation Flow (Day 3 - Morning)**
   - [ ] Add "Reactivate Member" button to inactive member profiles
   - [ ] Create confirmation dialog
   - [ ] Update member status back to 'active'
   - [ ] Add comment documenting manual reactivation
   - [ ] Write component tests

6. **Documentation & Testing (Day 3 - Afternoon)**
   - [ ] Document auto-inactivation logic in README
   - [ ] Create manual testing guide
   - [ ] Test full cycle: Auto-inactivate → Verify comment → Reactivate → Verify

7. **Quality Assurance**
   - [ ] Run linting and tests
   - [ ] Manual testing checklist (see US-005.md)
   - [ ] Verify comment is added with correct format
   - [ ] Test edge cases: Member with exactly X months, member with 1 day less
   - [ ] Update STATUS.md - Mark US-005 as complete

---

## 🧪 Testing Strategy

### Unit Tests (Required for ALL utilities and hooks)

```bash
# Test a specific file
npm test src/features/studio-settings/lib/__tests__/planning-settings-db.test.ts

# Run all tests for a feature
npm test src/features/studio-settings

# Run with coverage
npm run test:coverage
```

**Coverage Requirements:**

- All utility functions: 100% coverage
- All hooks: 100% coverage
- Components: 80%+ coverage

### Integration Tests

Test complete workflows:

1. Settings CRUD → Calendar icons update
2. Log body checkup → Icons appear in calendar
3. Booking session → Session limit decreases
4. Auto-inactivation → Comment added

### Manual Testing Checklist

**For Each User Story:**

- [ ] Happy path works as expected
- [ ] Edge cases handled gracefully
- [ ] Error messages are user-friendly
- [ ] Loading states display correctly
- [ ] Success notifications appear
- [ ] Database updates persist correctly

---

## 🚧 Common Pitfalls & Solutions

### Date Handling Issues

**Problem:** Icons showing for wrong dates due to timezone issues
**Solution:** Always use `date-utils.ts` functions, never manual date math

### Performance Issues

**Problem:** Calendar becomes slow with many sessions
**Solution:** Use React.memo, useMemo, and database-level aggregations

### Concurrent Booking Issues

**Problem:** Session limit exceeded when multiple users book simultaneously
**Solution:** Use database-level constraints and transaction locks

### Auto-Inactivation Accidents

**Problem:** Members incorrectly marked as inactive
**Solution:** Add dry-run mode, admin confirmation, and clear documentation

---

## 📊 Progress Tracking

**Update STATUS.md after completing each milestone:**

```bash
# After completing US-001
Update STATUS.md:
- US-001: Completed
- Current Story: US-002
- Overall Progress: 20%
```

**Commit Frequently:**

```bash
git add .
git commit -m "feat(planning): Complete US-001 - Planning Settings UI"
git push origin feature/planning-parameters
```

---

## 🎉 Feature Completion

**When all 5 user stories are complete:**

1. **Final Testing**
   - [ ] Run full test suite: `npm test`
   - [ ] Run build: `npm run build`
   - [ ] Run linting: `npm run lint`
   - [ ] Manual end-to-end testing of all features

2. **Documentation**
   - [ ] Update STATUS.md to 100% complete
   - [ ] Add usage instructions to README.md
   - [ ] Document any known limitations or edge cases

3. **Code Review Preparation**
   - [ ] Create pull request: `feature/planning-parameters → dev`
   - [ ] Fill out PR template with:
     - Summary of changes
     - Testing performed
     - Screenshots of new UI
     - Migration instructions (if applicable)

4. **Deployment**
   - [ ] After PR approval, merge to dev
   - [ ] Test on staging environment
   - [ ] Monitor for any issues
   - [ ] Deploy to production when stable

---

**Good luck with the implementation! Remember to work systematically, test thoroughly, and ask for help if blocked.**
