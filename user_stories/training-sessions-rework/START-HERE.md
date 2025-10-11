# Training Sessions Rework - START HERE

## 🎯 Feature Overview

This feature transforms the training sessions system from a calendar-based multi-participant scheduling system to a **machine-slot booking system** optimized for single-member sessions with flexible trainer assignment.

### Current System Problems

1. **Complex multi-participant logic** - Sessions allow multiple participants, but gym only books 1 member per session
2. **Mandatory trainer assignment** - Trainer must be selected upfront, but is only needed when completing sessions
3. **Unnecessary availability checks** - Trainer availability validation is obsolete for the new workflow
4. **Calendar-heavy UI** - Month/week/day views are overkill when only daily machine booking is needed

### New System Solution

A **3-machine slot grid** showing:

- **3 columns** (one per machine)
- **30-minute time slots** from 9:00 AM to 12:00 AM (midnight)
- **Daily view only** (no week/month navigation)
- **Member name** as session title
- **Due-date notifications** for members with pending alerts
- **Admin-controlled machine availability** (toggle machines on/off)

---

## 📊 Business Value

### For Admins

- ✅ **Faster booking** - Click slot → select member → done
- ✅ **Visual capacity overview** - See all 3 machines at a glance
- ✅ **Flexible trainer assignment** - Assign trainer only when marking session complete
- ✅ **Machine management** - Disable machines for maintenance

### For Members

- ✅ **Clear session visibility** - See their name on booked slots
- ✅ **Due-date alerts** - Visual notification for upcoming payment/renewal dates

### For the System

- ✅ **Simplified data model** - Remove max_participants, optional trainer_id
- ✅ **Better performance** - Simpler queries without availability checks
- ✅ **Leaner UI** - Custom grid instead of heavy calendar library

---

## 🏗️ Architecture Changes

### Database Schema

**New Table:**

```sql
machines (
  id UUID PRIMARY KEY,
  machine_number INTEGER UNIQUE (1, 2, 3),
  name TEXT,
  is_available BOOLEAN DEFAULT true
)
```

**Modified Table:**

```sql
training_sessions (
  -- REMOVED: max_participants
  -- MODIFIED: trainer_id NULLABLE (was NOT NULL)
  -- ADDED: machine_id UUID REFERENCES machines(id)
)
```

### UI Components

**Removed:**

- `TrainingSessionCalendar.tsx` (react-big-calendar)
- Calendar view switchers (month/week/day)
- Multi-participant member selection

**Added:**

- `MachineSlotGrid.tsx` - Main grid container
- `MachineColumn.tsx` - Single machine column (30 slots)
- `TimeSlot.tsx` - Individual 30-min slot component
- `SessionNotificationBadge.tsx` - Due-date alert indicator
- `MachineAvailabilityToggle.tsx` - Admin controls

---

## 📅 Implementation Timeline

### Phase 1: Database Foundation (Days 1-2)

- US-001: Create machines table
- US-002: Modify training_sessions schema
- US-003: Update database functions

### Phase 2: Backend Updates (Day 2)

- US-004: Update TypeScript types
- US-005: Modify hooks and API layer

### Phase 3: UI Development (Days 3-4)

- US-006: Build MachineSlotGrid component
- US-007: Implement slot rendering logic
- US-008: Integrate due-date notifications

### Phase 4: Forms & Admin (Day 4)

- US-009: Update session booking form
- US-010: Add machine availability controls

**Total Estimated Time: 4 days**

---

## 🚀 Getting Started

### For Implementing Agent

1. **Read this file completely** to understand the feature scope
2. **Read `AGENT-GUIDE.md`** for step-by-step implementation instructions
3. **Read `README.md`** for detailed architecture and technical decisions
4. **Check `STATUS.md`** to see current progress
5. **Start with US-001** and follow dependency order

### User Story Dependencies

```
US-001 (Machines DB) ──────┐
                           ├──> US-004 (Types) ──┐
US-002 (Sessions DB) ──────┤                     ├──> US-006 (Grid UI) ──┐
                           ├──> US-005 (Hooks) ──┘                        ├──> US-009 (Forms)
US-003 (DB Functions) ─────┘                                              │
                                                                           ├──> US-010 (Admin)
US-008 (Notifications) ────────────────────────────────────────────────────┘
```

### Prerequisites

- ✅ Supabase MCP server configured
- ✅ `member_comments` table exists (for due-date alerts)
- ✅ Current branch: `feature/training-sessions-rework`
- ✅ All existing training session tests passing

---

## ⚠️ Important Notes

### Data Migration Required

Existing `training_sessions` data must be migrated:

1. **Set default machine** for existing sessions (use machine 1)
2. **Keep trainer_id** as-is (already assigned)
3. **Remove max_participants** column (data loss acceptable per requirements)

### Breaking Changes

- ⚠️ **Calendar views removed** - Only daily machine grid available
- ⚠️ **No multi-participant support** - 1 member per session maximum
- ⚠️ **Trainer optional** - Forms must handle null trainer_id

### RLS Policy Updates

Machines table needs RLS:

- **SELECT**: All authenticated users
- **INSERT/UPDATE/DELETE**: Admin role only

---

## 📞 Questions or Issues?

### Before Starting Implementation

- [ ] Do you understand the 3-machine grid concept?
- [ ] Do you know how to generate 30-minute slots (9:00 - 00:00)?
- [ ] Do you understand due-date notification logic?
- [ ] Have you reviewed existing `member_comments` integration?

### During Implementation

If you encounter issues:

1. Check `README.md` for architecture details
2. Review `AGENT-GUIDE.md` for workflow guidance
3. Consult user story acceptance criteria
4. Test incrementally after each story

---

## ✅ Ready to Start?

**Next Step:** Read `AGENT-GUIDE.md` and begin with US-001

**Command:** `/implement-userstory US-001`
