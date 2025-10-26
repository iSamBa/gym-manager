# AGENT-GUIDE: Training Session Weekly Calendar View

This guide provides a **step-by-step workflow** for implementing the Training Session Weekly Calendar View feature. Follow this systematically to ensure complete and correct implementation.

## Prerequisites Checklist

Before starting ANY user story implementation:

- [ ] Read `START-HERE.md` completely
- [ ] Review `README.md` for technical architecture
- [ ] Read `CLAUDE.md` project standards (especially Performance section)
- [ ] **CHECK GIT BRANCH** - Must be on `feature/training-session-weekly-calendar`
- [ ] Verify development server is running (`npm run dev`)
- [ ] Ensure all existing tests pass (`npm test`)

## Git Branch Setup (CRITICAL - DO THIS FIRST)

```bash
# 1. Check current branch
git branch --show-current

# 2. If not on feature branch, create it from dev
git checkout dev
git pull origin dev
git checkout -b feature/training-session-weekly-calendar

# 3. Verify branch created
git branch --show-current  # Should show: feature/training-session-weekly-calendar
```

**⚠️ STOP if not on feature branch - DO NOT proceed without it!**

## Implementation Workflow

### Phase 1: US-001 - Weekly Day Tabs UI Component

**Command**: `/implement-userstory US-001`

**Goal**: Create basic weekly tab interface with day selection

**Steps**:

1. Read US-001 user story completely
2. Create `WeeklyDayTabs.tsx` component
   - Use shadcn/ui Tabs component
   - Display Monday through Sunday
   - Accept `selectedDate` and `onDateSelect` props
   - Calculate current week from selectedDate
   - Highlight today with visual indicator
3. Create test file `__tests__/WeeklyDayTabs.test.tsx`
   - Test tab rendering (7 tabs)
   - Test today highlighting
   - Test date selection callback
   - Test week calculation
4. Integrate into `TrainingSessionsView.tsx`
   - Import WeeklyDayTabs
   - Place between date picker and MachineSlotGrid
   - Pass selectedDate and setSelectedDate
5. Run tests: `npm test WeeklyDayTabs`
6. Visual verification in browser
7. Commit changes

**Acceptance Criteria**:

- [x] 7 tabs display (Monday-Sunday)
- [x] Current day highlighted
- [x] Clicking tab updates selectedDate
- [x] Tests pass with 100% coverage
- [x] No console errors

**Files Modified/Created**:

- `src/features/training-sessions/components/WeeklyDayTabs.tsx` (new)
- `src/features/training-sessions/components/__tests__/WeeklyDayTabs.test.tsx` (new)
- `src/features/training-sessions/components/TrainingSessionsView.tsx` (modify)

---

### Phase 2: US-002 - Week Navigation Controls

**Command**: `/implement-userstory US-002`

**Goal**: Add previous/next week navigation arrows

**Prerequisites**: US-001 completed and tested

**Steps**:

1. Read US-002 user story completely
2. Update `TrainingSessionsView.tsx`
   - Add week navigation state (selectedWeekStart)
   - Add handlePreviousWeek/handleNextWeek functions
   - Add week navigation arrows UI
   - Display week range/number indicator
3. Update `WeeklyDayTabs.tsx`
   - Accept weekStart prop
   - Calculate tabs based on weekStart
   - Ensure synchronization with date picker
4. Update tests
   - Test week navigation functions
   - Test week range display
   - Test synchronization between controls
5. Run tests: `npm test TrainingSessionsView WeeklyDayTabs`
6. Visual verification (navigate weeks, check sync)
7. Commit changes

**Acceptance Criteria**:

- [x] Previous/next week arrows functional
- [x] Week range/number displays correctly
- [x] Date picker and week tabs stay synchronized
- [x] Tests updated and passing
- [x] No performance regressions

**Files Modified**:

- `src/features/training-sessions/components/TrainingSessionsView.tsx`
- `src/features/training-sessions/components/WeeklyDayTabs.tsx`
- `src/features/training-sessions/components/__tests__/WeeklyDayTabs.test.tsx`

---

### Phase 3: US-003 - Daily Session Statistics

**Command**: `/implement-userstory US-003`

**Goal**: Display real-time session statistics on each tab

**Prerequisites**: US-001 and US-002 completed

**Steps**:

1. Read US-003 user story completely
2. **Database Layer**:
   - Create Supabase RPC function `get_daily_session_statistics`
   - Function parameters: `p_start_date`, `p_end_date`
   - Returns: day_date, total_count, standard_count, trial_count
   - Use existing `training_sessions_calendar` view
3. **Hook Layer**:
   - Create `use-daily-statistics.ts` hook
   - Use React Query for caching
   - Accept weekStart and weekEnd parameters
   - Map results to DailyStatistics type
4. **Component Layer**:
   - Update `WeeklyDayTabs.tsx` to use statistics hook
   - Display total/standard/trial counts per tab
   - Add loading states
   - Style according to design (orange for standard, blue for trial)
5. **Testing**:
   - Create `__tests__/use-daily-statistics.test.ts`
   - Test database RPC function
   - Test hook data transformation
   - Test component rendering with statistics
6. **Integration**:
   - Update mutation hooks to invalidate statistics cache
   - Test real-time updates after session create/update/delete
7. Run all tests: `npm test`
8. Performance check (React DevTools)
9. Commit changes

**Acceptance Criteria**:

- [x] Statistics display on each tab (total, standard, trial)
- [x] Statistics update after session mutations
- [x] Loading states display during fetch
- [x] Database query is performant (<100ms)
- [x] Tests pass with coverage
- [x] No unnecessary re-renders

**Files Modified/Created**:

- Database: Create RPC function via Supabase MCP
- `src/features/training-sessions/hooks/use-daily-statistics.ts` (new)
- `src/features/training-sessions/hooks/__tests__/use-daily-statistics.test.ts` (new)
- `src/features/training-sessions/components/WeeklyDayTabs.tsx` (modify)
- `src/features/training-sessions/hooks/use-training-sessions.ts` (modify invalidation)
- `src/features/training-sessions/lib/types.ts` (add DailyStatistics type)

---

### Phase 4: US-004 - Integration and State Management

**Command**: `/implement-userstory US-004`

**Goal**: Final integration and polish

**Prerequisites**: US-001, US-002, US-003 completed

**Steps**:

1. Read US-004 user story completely
2. **State Management Audit**:
   - Verify selectedDate always defaults to today on page load
   - Check date picker ↔ tabs ↔ MachineSlotGrid synchronization
   - Ensure no localStorage persistence
3. **Query Invalidation Audit**:
   - Verify createSession invalidates statistics
   - Verify updateSession invalidates statistics
   - Verify deleteSession invalidates statistics
   - Check updateSessionStatus invalidation
4. **Performance Optimization**:
   - Add React.memo to WeeklyDayTabs
   - Add useMemo for week calculations
   - Verify useCallback for event handlers
   - Check for unnecessary re-renders
5. **Integration Testing**:
   - Test complete workflow: navigate → select day → create session → verify stats update
   - Test edge cases: week boundaries, month transitions
   - Test error states: failed queries, network errors
6. **Code Quality**:
   - Run linter: `npm run lint`
   - Run build: `npm run build`
   - Run full test suite: `npm test`
   - Check coverage report
7. **Documentation**:
   - Update STATUS.md with completed milestones
   - Add inline code comments where needed
   - Verify prop types and interfaces
8. Final commit

**Acceptance Criteria**:

- [x] All user stories completed
- [x] Full test suite passing (100%)
- [x] No lint errors/warnings
- [x] Build succeeds
- [x] Performance targets met (Quick Reference Checklist)
- [x] Documentation updated
- [x] No console errors/warnings

**Files Modified**:

- All files from previous user stories (refinement)
- `user_stories/training-session-weekly-calendar/STATUS.md` (update)

---

## Testing Strategy

### Unit Tests

- Component rendering and interactions
- Hook data transformations
- Date calculations and week logic
- Statistics mapping functions

### Integration Tests

- Tab selection → date change → grid update
- Session mutation → statistics refresh
- Week navigation → tab update → date sync

### Manual Testing Checklist

- [ ] Navigate between weeks using arrows
- [ ] Click different day tabs
- [ ] Create a session, verify statistics update
- [ ] Delete a session, verify statistics update
- [ ] Check responsive design on different screen sizes
- [ ] Verify today highlighting across week changes
- [ ] Test edge cases: weekend, month boundaries

## Performance Checklist

Before completing implementation, verify:

- [ ] React.memo used on WeeklyDayTabs
- [ ] Event handlers wrapped in useCallback
- [ ] Week calculations use useMemo
- [ ] Statistics query uses React Query caching
- [ ] Database aggregation (not client-side)
- [ ] Query invalidation is targeted (not queryClient.invalidateQueries())
- [ ] No unnecessary re-renders (check React DevTools)
- [ ] Component under 300 lines
- [ ] No any types used

## Commit Strategy

**Commit after each user story**:

```bash
# After US-001
git add .
git commit -m "feat(training-sessions): add weekly day tabs UI component

- Create WeeklyDayTabs component with 7-day layout
- Highlight current day
- Integrate with TrainingSessionsView
- Add comprehensive tests

Implements US-001 of training-session-weekly-calendar feature

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Similar pattern for US-002, US-003, US-004
```

## Pull Request Preparation

After all user stories completed:

1. **Create PR to dev branch** (not main!)

   ```bash
   git push -u origin feature/training-session-weekly-calendar
   gh pr create --base dev --title "Feature: Training Session Weekly Calendar View" --body "$(cat <<'EOF'
   ## Summary
   - Add weekly day tabs to training session calendar
   - Display daily session statistics (total/standard/trial)
   - Week navigation controls
   - Real-time statistics updates

   ## User Stories Completed
   - US-001: Weekly Day Tabs UI Component
   - US-002: Week Navigation Controls
   - US-003: Daily Session Statistics
   - US-004: Integration and State Management

   ## Test Plan
   - [x] All unit tests passing (100% coverage)
   - [x] Integration tests passing
   - [x] Manual testing completed
   - [x] Performance checklist verified
   - [x] No lint errors
   - [x] Build succeeds

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```

## Troubleshooting

### Common Issues

**Issue**: Tests failing after integration

- **Solution**: Check React Query cache invalidation patterns
- **Check**: TRAINING_SESSIONS_KEYS structure

**Issue**: Statistics not updating in real-time

- **Solution**: Verify mutation hooks invalidate daily-statistics query
- **Check**: onSuccess callbacks in use-training-sessions.ts

**Issue**: Week calculation off by one day

- **Solution**: Check timezone handling in date-utils
- **Check**: getStartOfWeek function implementation

**Issue**: Performance degradation

- **Solution**: Verify React.memo, useMemo, useCallback usage
- **Check**: React DevTools Profiler

## Success Validation

Before marking feature as complete:

1. **Functional**: All acceptance criteria met for all user stories
2. **Tests**: 100% test coverage, all tests passing
3. **Performance**: No regressions, meets performance targets
4. **Code Quality**: No lint errors, successful build
5. **Documentation**: STATUS.md updated, code commented
6. **User Testing**: Manual testing checklist completed

---

## Reference Documents

- **Project Standards**: `/Users/aissam/Dev/gym-manager/CLAUDE.md`
- **Date Handling**: `CLAUDE.md` - Date Handling Standards section
- **Performance**: `CLAUDE.md` - Performance Optimization Guidelines section
- **Testing**: `CLAUDE.md` - Testing section
- **Git Workflow**: `CLAUDE.md` - Git Branching section

---

**Ready to implement?** Start with `/implement-userstory US-001`
