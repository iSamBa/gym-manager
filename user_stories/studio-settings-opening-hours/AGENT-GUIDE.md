# AGENT-GUIDE: Studio Settings - Opening Hours Implementation Workflow

## 🤖 Purpose

This guide provides **step-by-step instructions** for AI agents (Claude, GPT, etc.) to systematically implement the Studio Settings - Opening Hours feature.

**Follow this workflow exactly** to ensure:

- ✅ Correct dependency order (no breaking changes)
- ✅ Incremental testing (catch issues early)
- ✅ Complete implementation (nothing missed)
- ✅ CLAUDE.md compliance (performance, quality standards)

---

## 📋 Pre-Implementation Checklist

Before starting **ANY** user story, verify:

- [ ] Read `START-HERE.md` completely
- [ ] Read `CLAUDE.md` performance optimization guidelines
- [ ] Check `STATUS.md` for current progress
- [ ] Understand dependency chain (see below)
- [ ] Have access to all required tools (Supabase MCP, file operations)

---

## 🔗 User Story Dependency Chain

```
US-001 (Database Schema)
   ↓
US-002 (Settings Page Foundation)
   ↓
US-003 (Weekly Grid Editor)
   ↓
US-004 (Effective Date Handling)
   ↓
US-005 (Conflict Detection)
   ↓
US-006 (Session Integration)
   ↓
US-007 (Testing & Edge Cases)
```

**CRITICAL**: Each story MUST be completed and tested before moving to the next!

---

## 🚀 Implementation Workflow

### PHASE 1: User Story US-001 - Database Schema

**Command**: `/implement-userstory US-001`

**Goal**: Create `studio_settings` table and supporting database functions

**Steps**:

1. **Create Migration File**
   - File: `src/features/database/migrations/[timestamp]_create_studio_settings.sql`
   - Create table: `studio_settings` with columns:
     - `id` (uuid, primary key)
     - `setting_key` (text, unique)
     - `setting_value` (jsonb)
     - `effective_from` (date, not null)
     - `is_active` (boolean, default true)
     - `created_at`, `updated_at` (timestamps)
   - Add RLS policies for admin-only access

2. **Create Database Functions**
   - `get_active_opening_hours(target_date DATE)`
     - Returns opening hours effective on target date
     - Finds latest setting where `effective_from <= target_date`
   - `validate_opening_hours_json(hours JSONB)`
     - Validates structure (all 7 days, valid times)
     - Returns boolean

3. **Apply Migration**
   - Use Supabase MCP: `mcp__supabase__apply_migration`
   - Name: `create_studio_settings`
   - Verify table created: `mcp__supabase__list_tables`

4. **Insert Default Data**
   - Insert default opening hours:
     - Key: `"opening_hours"`
     - Value: Current hardcoded hours (9 AM - 12 AM, all days open)
     - Effective from: Today's date

5. **Test**
   - Query: `SELECT * FROM studio_settings WHERE setting_key = 'opening_hours'`
   - Call: `SELECT get_active_opening_hours(CURRENT_DATE)`
   - Verify: Returns expected JSONB structure

**Acceptance Criteria** (from US-001.md):

- [ ] Table created with correct schema
- [ ] RLS policies enforced (admin-only)
- [ ] Functions work correctly
- [ ] Default data inserted
- [ ] All tests pass

**Update**: Mark US-001 as COMPLETED in `STATUS.md`

---

### PHASE 2: User Story US-002 - Settings Page Foundation

**Command**: `/implement-userstory US-002`

**Goal**: Create settings page with routing and basic layout

**Steps**:

1. **Create Feature Folder Structure**

   ```
   src/features/settings/
   ├── components/
   │   ├── StudioSettingsLayout.tsx
   │   └── __tests__/
   ├── hooks/
   │   ├── use-studio-settings.ts
   │   └── __tests__/
   ├── lib/
   │   ├── types.ts
   │   └── settings-api.ts
   └── index.ts
   ```

2. **Create TypeScript Types**
   - File: `src/features/settings/lib/types.ts`
   - Types:
     - `OpeningHoursDay` - Single day config
     - `OpeningHoursWeek` - Full week config
     - `StudioSettings` - Full settings object

3. **Create Settings Page**
   - File: `src/app/settings/studio/page.tsx`
   - Server component
   - Check auth (admin only)
   - Render `StudioSettingsLayout` client component

4. **Create Layout Component**
   - File: `src/features/settings/components/StudioSettingsLayout.tsx`
   - Tabbed interface using shadcn Tabs component
   - Tabs: "Opening Hours" (active), "General" (disabled), "Payment" (disabled)
   - Content area for tab panels

5. **Update Sidebar** (if needed)
   - File: `src/components/layout/sidebar.tsx`
   - Verify "Settings" link exists and routes to `/settings/studio`
   - If not, add to bottom utilities section

6. **Create Settings Hook**
   - File: `src/features/settings/hooks/use-studio-settings.ts`
   - Use React Query for caching
   - Methods: `fetchSettings()`, `updateSettings()`
   - Use Supabase client

7. **Test**
   - Navigate to `/settings/studio`
   - Verify page loads with tabbed layout
   - Verify "Opening Hours" tab is active
   - Verify admin-only access (test with non-admin user)

**Acceptance Criteria** (from US-002.md):

- [ ] Settings page accessible from sidebar
- [ ] Tabbed layout renders correctly
- [ ] Admin-only access enforced
- [ ] Hook fetches settings successfully
- [ ] All tests pass

**Update**: Mark US-002 as COMPLETED in `STATUS.md`

---

### PHASE 3: User Story US-003 - Weekly Opening Hours Editor

**Command**: `/implement-userstory US-003`

**Goal**: Build custom weekly grid editor with time pickers

**Steps**:

1. **Create Component Structure**
   - `WeeklyOpeningHoursGrid.tsx` - Main grid wrapper
   - `DayOpeningHoursRow.tsx` - Single day row
   - `BulkActionsToolbar.tsx` - Bulk action buttons

2. **Implement WeeklyOpeningHoursGrid**
   - Props: `value`, `onChange`, `disabled`
   - State: Weekly config object
   - Render 7 `DayOpeningHoursRow` components (Mon-Sun)
   - Include `BulkActionsToolbar` above grid

3. **Implement DayOpeningHoursRow**
   - Layout: `[Day Label] [Toggle] [Open Time] [Close Time]`
   - Use shadcn: Switch, TimePicker (existing component)
   - When toggled off: Disable time pickers, clear times
   - Validation: Close time > Open time (show inline error)

4. **Implement BulkActionsToolbar**
   - Actions:
     - "Apply to Weekdays" - Copy Monday hours to Tue-Fri
     - "Apply to All Days" - Copy Monday hours to all days
     - "Reset to Defaults" - Load default hours
   - Use shadcn: Button with dropdown menu

5. **Implement Validation**
   - Real-time validation on each row
   - Error states:
     - "Closing time must be after opening time"
     - "Times must be within same day (no overnight)"
   - Prevent save if any validation errors

6. **Styling**
   - Use consistent spacing (shadcn Card component)
   - Responsive layout (stack on mobile)
   - Clear visual hierarchy

7. **Test**
   - Toggle days on/off
   - Set various time combinations
   - Test bulk actions
   - Verify validation errors display
   - Test mobile responsiveness

**Performance Checks** (from CLAUDE.md):

- [ ] Component uses `React.memo`
- [ ] Event handlers use `useCallback`
- [ ] No unnecessary re-renders (check with React DevTools)

**Acceptance Criteria** (from US-003.md):

- [ ] Grid displays all 7 days
- [ ] Toggle on/off works per day
- [ ] Time pickers work correctly
- [ ] Bulk actions apply correctly
- [ ] Validation prevents invalid states
- [ ] Mobile responsive
- [ ] All tests pass

**Update**: Mark US-003 as COMPLETED in `STATUS.md`

---

### PHASE 4: User Story US-004 - Effective Date Handling

**Command**: `/implement-userstory US-004`

**Goal**: Add effective date picker and preview

**Steps**:

1. **Add Effective Date Field**
   - Add to `OpeningHoursTab` component
   - Use shadcn DatePicker component
   - Label: "Changes effective from"
   - Constraint: Minimum date = today

2. **Create Preview Component**
   - File: `EffectiveDatePreview.tsx`
   - Show:
     - "Changes will apply from [DATE] onwards"
     - "Available slots per day" table
     - "Existing sessions before this date remain unchanged"
   - Calculate slots: `(close_hour - open_hour) * 2` (30-min slots)

3. **Update Save Logic**
   - Include `effective_from` in save payload
   - Show confirmation dialog with preview before saving

4. **Test**
   - Select various future dates
   - Verify preview updates correctly
   - Try selecting past date (should be disabled)
   - Verify slots calculation matches expected

**Acceptance Criteria** (from US-004.md):

- [ ] Date picker only allows today or future dates
- [ ] Preview displays correctly
- [ ] Slots calculation accurate
- [ ] Save includes effective_from
- [ ] All tests pass

**Update**: Mark US-004 as COMPLETED in `STATUS.md`

---

### PHASE 5: User Story US-005 - Conflict Detection

**Command**: `/implement-userstory US-005`

**Goal**: Detect and display booking conflicts before save

**Steps**:

1. **Create Conflict Detection Hook**
   - File: `hooks/use-conflict-detection.ts`
   - Function: `checkConflicts(newHours, effectiveDate)`
   - Query: Find future sessions outside new hours
   - Return: Array of conflicting sessions with details

2. **Create Conflict Dialog**
   - File: `components/ConflictDetectionDialog.tsx`
   - Use shadcn AlertDialog component
   - Display:
     - "Found X conflicting sessions"
     - Table: Date, Time, Member, Machine
     - Actions: "Cancel Changes", "View Sessions"
   - Block save if conflicts exist

3. **Add to Save Flow**
   - Before saving, call `checkConflicts()`
   - If conflicts found → Show dialog
   - If no conflicts → Proceed with save

4. **Create Conflict Resolution Guide**
   - In dialog, show instructions:
     - "To proceed, cancel or reschedule conflicting sessions"
     - Link to Training Sessions page with date filter

5. **Test**
   - Create test sessions outside new hours
   - Try saving with conflicts
   - Verify dialog shows all conflicts
   - Verify save is blocked
   - Clear conflicts and verify save works

**Acceptance Criteria** (from US-005.md):

- [ ] Conflict detection works correctly
- [ ] All conflicts displayed in dialog
- [ ] Save blocked when conflicts exist
- [ ] Resolution instructions clear
- [ ] All tests pass

**Update**: Mark US-005 as COMPLETED in `STATUS.md`

---

### PHASE 6: User Story US-006 - Session Integration

**Command**: `/implement-userstory US-006`

**Goal**: Update session booking to use dynamic opening hours

**Steps**:

1. **Refactor slot-generator.ts**
   - Change `TIME_SLOT_CONFIG` to function: `getTimeSlotConfig(date)`
   - Function logic:

     ```typescript
     async function getTimeSlotConfig(date: Date) {
       const dayOfWeek = format(date, "eeee").toLowerCase();
       const hours = await getActiveOpeningHours(date);
       const dayConfig = hours[dayOfWeek];

       if (!dayConfig.is_open) return null; // Closed day

       return {
         START_HOUR: parseHour(dayConfig.open_time),
         END_HOUR: parseHour(dayConfig.close_time),
         SLOT_DURATION_MINUTES: 30,
       };
     }
     ```

2. **Update generateTimeSlots()**
   - Make async: `async function generateTimeSlots(date)`
   - Call `getTimeSlotConfig(date)` at start
   - If null (closed day), return empty array
   - Use dynamic hours instead of hardcoded values

3. **Update All Callers**
   - `MachineSlotGrid.tsx` - Add async/await
   - `SessionBookingDialog.tsx` - Handle loading state
   - Any other components using `generateTimeSlots()`

4. **Add Caching**
   - Use React Query to cache opening hours per day
   - Cache key: `['opening-hours', date]`
   - Stale time: 5 minutes

5. **Handle Closed Days**
   - In `TrainingSessionsView`, show "Studio Closed" message
   - Disable booking for closed days
   - Show in calendar with distinct styling

6. **Test**
   - Set various opening hours in settings
   - Navigate to Training Sessions view
   - Verify slots match new hours
   - Test closed day (should show "Studio Closed")
   - Test edge case: Midnight closing

**Performance Checks** (from CLAUDE.md):

- [ ] Opening hours cached to avoid repeated DB queries
- [ ] Slot generation memoized
- [ ] No unnecessary re-renders

**Acceptance Criteria** (from US-006.md):

- [ ] Slots generated dynamically from settings
- [ ] Closed days handled correctly
- [ ] Session booking respects new hours
- [ ] Caching works (verify with Network tab)
- [ ] All tests pass

**Update**: Mark US-006 as COMPLETED in `STATUS.md`

---

### PHASE 7: User Story US-007 - Testing & Edge Cases

**Command**: `/implement-userstory US-007`

**Goal**: Comprehensive testing and edge case handling

**Steps**:

1. **Unit Tests**
   - `settings-api.test.ts` - API functions
   - `use-studio-settings.test.ts` - Settings hook
   - `use-conflict-detection.test.ts` - Conflict detection
   - `slot-generator.test.ts` - Update for dynamic config
   - `validate-opening-hours.test.ts` - Validation logic

2. **Integration Tests**
   - `settings-flow.test.tsx` - Full save flow
   - `conflict-detection-integration.test.tsx` - Conflict workflow
   - `session-booking-integration.test.tsx` - Booking with new hours

3. **Edge Cases to Test**
   - All days closed (should show error)
   - Midnight closing time (23:59 or 00:00)
   - Same open/close time (should validate error)
   - Very short hours (< 1 hour)
   - Leap year date as effective date
   - Timezone edge cases (DST transition)

4. **E2E Tests** (if E2E framework exists)
   - Complete workflow: Login → Settings → Edit → Save → Verify
   - Conflict resolution workflow

5. **Performance Testing**
   - Measure slot generation time (should be < 50ms)
   - Check for memory leaks (React DevTools Profiler)
   - Verify no unnecessary re-renders

6. **Run Full Test Suite**
   - `npm test` - All tests
   - `npm run test:coverage` - Verify coverage > 90%
   - `npm run lint` - No linting errors

**Acceptance Criteria** (from US-007.md):

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All edge cases covered
- [ ] Test coverage > 90%
- [ ] No performance regressions
- [ ] All linting rules pass

**Update**: Mark US-007 as COMPLETED in `STATUS.md`

---

## ✅ Post-Implementation Checklist

After completing all 7 user stories:

### Code Quality

- [ ] All files follow CLAUDE.md standards
- [ ] No `any` types used
- [ ] All components use React.memo where appropriate
- [ ] All event handlers use useCallback
- [ ] No console.log statements remain

### Testing

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Coverage > 90%: `npm run test:coverage`

### Documentation

- [ ] All user stories marked COMPLETED in STATUS.md
- [ ] Code comments added where needed
- [ ] README.md updated if architecture changed

### User Acceptance

- [ ] Feature demo to stakeholder
- [ ] Gather feedback and create follow-up tickets if needed
- [ ] Update project roadmap

---

## 🚨 Troubleshooting

### Common Issues and Solutions

**Issue**: Migration fails with permission error

- **Solution**: Verify Supabase connection, check RLS policies

**Issue**: Slot generation returns empty array

- **Solution**: Check if `get_active_opening_hours()` returns valid data

**Issue**: Conflict detection misses sessions

- **Solution**: Verify query includes correct date range and timezone

**Issue**: Performance slow when loading settings

- **Solution**: Check React Query caching, verify no unnecessary re-fetches

**Issue**: Tests fail after slot-generator refactor

- **Solution**: Update test mocks to handle async `getTimeSlotConfig()`

---

## 📞 Support

**For AI Agents**:

- If stuck, re-read relevant user story file
- Check CLAUDE.md for coding standards
- Review similar existing components for patterns

**For Humans**:

- Check STATUS.md for blockers
- Review commit history for context
- Ask team for clarification on business rules

---

## 🎯 Success Metrics

Feature is considered successfully implemented when:

1. **Functional**: All acceptance criteria met for all 7 user stories
2. **Tested**: 100% of critical paths covered, > 90% overall coverage
3. **Performant**: No regressions, meets CLAUDE.md performance standards
4. **Documented**: All documentation up to date
5. **Approved**: Stakeholder sign-off received

---

**Generated**: 2025-10-16
**Last Updated**: 2025-10-16
**Version**: 1.0
