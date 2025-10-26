# Training Session Weekly Calendar View - START HERE

Welcome to the **Training Session Weekly Calendar View** feature! This document is your entry point for understanding and implementing this feature.

## Quick Overview

**Feature Name**: Training Session Weekly Calendar View

**Goal**: Enhance the training session calendar by adding weekly day tabs with session statistics between the date picker and machine columns.

**Current State**: Calendar has date picker and day navigation arrows, with machine columns showing sessions below.

**Desired State**: Add weekly tabs (Monday-Sunday) between date picker and machines, showing daily statistics (total/standard/trial sessions) and allowing quick day selection.

## Why This Feature?

### Problem Statement

The current training session calendar requires users to navigate day-by-day to see different sessions. There's no quick way to:

- See an overview of the week's booking density
- Jump to a specific weekday
- Understand daily booking patterns (standard vs trial sessions)

### User Benefits

- **Faster Navigation**: Click any weekday tab to jump directly to that day
- **Better Planning**: See weekly booking overview at a glance
- **Booking Insights**: Understand standard vs trial session distribution per day
- **Week Management**: Navigate entire weeks with new arrow controls

## Visual Reference

The user provided this example of the desired tab design:

![Weekly Tab Example](Image #1 from user)

Each tab shows:

- Day name (e.g., "Vendredi" / "Friday")
- Total sessions count (e.g., "10")
- Subtitle showing session count (e.g., "9 séance(s)")
- Two colored numbers: Standard sessions (orange) and Trial sessions (blue)

## Who Will Use This?

**Primary Users**: Gym administrators managing training session schedules

**Use Cases**:

1. View weekly booking patterns to identify busy/slow days
2. Navigate quickly to specific weekdays for scheduling
3. Monitor standard vs trial session distribution
4. Plan trainer assignments based on weekly demand

## Project Context

### Related Files/Areas

- **Component**: `src/features/training-sessions/components/TrainingSessionsView.tsx`
- **Hooks**: `src/features/training-sessions/hooks/use-training-sessions.ts`
- **Types**: `src/features/training-sessions/lib/types.ts`
- **Database**: `training_sessions_calendar` view, `training_sessions` table

### Dependencies

- Existing date picker and day navigation
- MachineSlotGrid component
- React Query for data fetching
- shadcn/ui Tabs component
- date-fns for week calculations

## Implementation Approach

This feature is broken down into **4 user stories**:

1. **US-001**: Weekly Day Tabs UI Component - Basic tab interface
2. **US-002**: Week Navigation Controls - Previous/next week arrows
3. **US-003**: Daily Session Statistics - Real-time statistics display
4. **US-004**: Integration and State Management - Connect everything together

## Success Criteria

### Must Have (P0)

- [x] Display 7 tabs (Monday through Sunday)
- [x] Highlight current day (today)
- [x] Auto-select today on page load
- [x] Show 3 statistics per tab: total, standard, trial sessions
- [x] Click tab to view that day's sessions
- [x] Week navigation arrows (previous/next week)

### Should Have (P1)

- [x] Real-time statistics updates after session changes
- [x] Efficient database queries for statistics
- [x] Responsive design for different screen sizes

### Nice to Have (P2)

- [ ] Loading states for statistics
- [ ] Skeleton UI while fetching data
- [ ] Accessibility improvements (keyboard navigation)

## Key Design Decisions

### State Management

- **Always default to today**: No localStorage persistence
- **Sync with date picker**: Tab selection updates date picker and vice versa
- **Week context**: Tabs show days of currently selected week

### Data Strategy

- **Real-time updates**: Invalidate statistics cache after mutations
- **Server-side aggregation**: Use RPC function for statistics
- **No schema changes**: Use existing `training_sessions_calendar` view

### Performance

- React.memo for tab component
- useMemo for week calculations
- Cached queries with smart invalidation
- Server-side aggregation (no client-side counting)

## Timeline

**Flexibility**: No hard deadline
**Estimated Duration**: 4-6 hours of development + testing
**Approach**: Iterative - test and refine after initial implementation

## Next Steps

1. **Read**: `AGENT-GUIDE.md` for step-by-step implementation workflow
2. **Review**: `README.md` for technical architecture details
3. **Track**: Use `STATUS.md` to monitor progress
4. **Implement**: Start with `/implement-userstory US-001`

## Questions or Issues?

**Before starting**, ensure you understand:

- Current TrainingSessionsView component structure
- React Query invalidation patterns in the codebase
- shadcn/ui Tabs component usage
- date-fns week calculation utilities

**Stuck?** Check:

- `docs/TROUBLESHOOTING.md` for common issues
- `CLAUDE.md` for project standards and patterns
- Existing test files for testing patterns

---

**Ready to begin?** → Open `AGENT-GUIDE.md` for your next steps!
