# Planning Parameters Feature - START HERE

## 🎯 Feature Overview

**Feature Name:** Studio Planning Parameters & Visual Indicators

**Description:** A comprehensive planning and automation system that allows gym admins to configure key operational parameters (subscription warnings, body checkup reminders, payment notifications, session limits, and auto-inactivation rules) and displays visual indicators in the calendar view to help staff manage member care proactively.

**Business Value:**

- **Proactive Member Management** - Staff can see at-a-glance which members need attention
- **Automated Operations** - Reduce manual tracking with configurable automation
- **Revenue Protection** - Payment reminders ensure timely collections
- **Member Retention** - Body checkup and subscription reminders improve member experience
- **Studio Capacity Management** - Global session limits prevent overbooking

---

## 📊 Current Status

**Phase:** Planning Complete - Ready for Implementation
**Progress:** 0% (0/5 user stories completed)
**Target Timeline:** 2-3 weeks
**Priority:** P0 - All parameters are critical

---

## 🧩 User Stories Breakdown

This feature is broken down into **5 user stories** that should be implemented in sequence:

| Story  | Name                          | Priority | Status      | Depends On     |
| ------ | ----------------------------- | -------- | ----------- | -------------- |
| US-001 | Planning Settings UI & CRUD   | P0       | Not Started | None           |
| US-002 | Body Checkup Tracking System  | P0       | Not Started | None           |
| US-003 | Calendar Visual Indicators    | P0       | Not Started | US-001, US-002 |
| US-004 | Global Studio Session Limit   | P0       | Not Started | US-001         |
| US-005 | Automatic Member Inactivation | P0       | Not Started | US-001         |

**Implementation Sequence:**

1. **Week 1:** US-001 + US-002 (parallel)
2. **Week 2:** US-003 + US-004 (parallel, after US-001 complete)
3. **Week 3:** US-005 + Testing + Bug fixes

---

## 🎨 Design Reference

See the provided screenshot (`planning-parameters-reference.png`) for the old system's UI. The new implementation should:

- Follow shadcn/ui design patterns
- Use modern, accessible components
- Implement responsive layout
- Use fixed, intuitive icons:
  - 🏜️ **Hourglass (pink/red)** - Subscription expiration warning
  - ⚖️ **Scale/Weight (gold/yellow)** - Body checkup reminder
  - 💰 **Coins/Money (green)** - Payment reminder

---

## 🛠️ Technical Overview

### Codebase Areas Affected

- `src/features/studio-settings/` - New Planning tab
- `src/features/database/` - New tables and functions
- `src/features/calendar/` - Icon display logic
- `src/features/members/` - Body checkup tracking
- `src/features/training-sessions/` - Booking limit enforcement

### Database Changes

**New Tables:**

- `studio_planning_settings` - Global configuration
- `member_body_checkups` - Body checkup history

**New Functions:**

- `get_active_planning_settings()` - Retrieve current settings
- `check_studio_session_limit(week_start, week_end)` - Validate booking capacity
- `auto_inactivate_dormant_members()` - Scheduled background job

**Modified Tables:**

- `members` - Add `last_activity_check` timestamp
- `member_comments` - Add system-generated notes for auto-inactivation

### Components to Create

- `PlanningSettingsForm.tsx` - Main settings form
- `BodyCheckupDialog.tsx` - Log body checkup modal
- `BodyCheckupHistory.tsx` - View checkup history
- `CalendarEventIcons.tsx` - Render planning icons in calendar
- `SessionLimitWarning.tsx` - Booking limit alert

---

## 📋 Quick Start Guide

### For Implementation (Claude Code)

1. **Read AGENT-GUIDE.md** - Detailed step-by-step implementation workflow
2. **Start with US-001** - Use `/implement-userstory US-001`
3. **Follow the sequence** - Complete stories in dependency order
4. **Update STATUS.md** - Mark milestones as complete

### For Code Review

1. **Check acceptance criteria** - Each user story has specific DoD checklist
2. **Verify tests pass** - All features must have unit tests
3. **Test manually** - Verify calendar icons, booking limits, auto-inactivation
4. **Check edge cases** - Timezone handling, null values, concurrent bookings

---

## 🚨 Critical Implementation Notes

### Date Handling

- **ALWAYS use `date-utils.ts`** for all date operations
- Calendar dates are in **local timezone** (not UTC)
- Body checkup dates stored as `date` (not timestamptz)
- Use `formatForDatabase()` for date columns

### Performance

- **Calendar icon rendering** - Use React.memo and useMemo
- **Session count queries** - Use database aggregation (don't fetch all records)
- **Auto-inactivation job** - Should run daily (not on every page load)

### Testing

- **Unit tests required** for all utilities and hooks
- **Integration tests** for booking limit enforcement
- **Manual testing checklist** in AGENT-GUIDE.md

---

## 📚 Related Documentation

- `AGENT-GUIDE.md` - Step-by-step implementation workflow
- `README.md` - Feature architecture and technical details
- `STATUS.md` - Current progress and completion tracking
- `US-001.md` through `US-005.md` - Individual user story specifications

---

## 🤝 Getting Help

**Stuck on implementation?**

1. Check AGENT-GUIDE.md for detailed steps
2. Review similar features (e.g., `features/studio-settings/components/StudioSettingsForm.tsx`)
3. Consult CLAUDE.md for project standards

**Need clarification?**

- User stories include detailed acceptance criteria and technical notes
- Reference the design screenshot for UI expectations

---

**Ready to start?** → Open `AGENT-GUIDE.md` and begin with US-001!
