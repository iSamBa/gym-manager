# Studio Settings - Opening Hours Management

## 🎯 Feature Overview

This feature adds a comprehensive Studio Settings system to the gym management application, starting with Opening Hours management. Admins can configure when the gym is open each day, set effective dates for changes, and automatically affect available session booking slots.

### What This Feature Does

**Primary Goal**: Allow gym administrators to manage studio opening hours through an intuitive interface

**Key Capabilities**:

- Set different opening/closing times for each day of the week
- Mark specific days as closed
- Schedule changes to take effect on future dates
- Automatically update available booking slots based on opening hours
- Detect and prevent conflicts with existing bookings
- Preserve historical session data (no retroactive changes)

### Business Value

**Problem Solved**:

- Currently, opening hours are hardcoded in `slot-generator.ts` (9 AM - 12 AM)
- Changing hours requires code deployment
- No flexibility for different hours per day (weekends, holidays)
- Risk of scheduling sessions outside actual operating hours

**Benefits**:

- **Operational Flexibility**: Adjust hours without developer intervention
- **Accurate Scheduling**: Session slots only appear during actual opening hours
- **Conflict Prevention**: Automatic detection of booking conflicts before changes
- **Audit Trail**: Track when and why hours changed (future enhancement)
- **Scalability**: Foundation for additional settings (currency, timezone, etc.)

---

## 📋 User Stories Summary

This feature is broken down into **7 user stories** for systematic implementation:

| Story      | Focus Area               | Priority | Complexity | Estimated Time |
| ---------- | ------------------------ | -------- | ---------- | -------------- |
| **US-001** | Database Schema          | P0       | Medium     | 2 hours        |
| **US-002** | Settings Page Foundation | P0       | Small      | 3 hours        |
| **US-003** | Weekly Grid Editor UI    | P0       | Large      | 5 hours        |
| **US-004** | Effective Date Handling  | P0       | Medium     | 2 hours        |
| **US-005** | Conflict Detection       | P0       | Large      | 4 hours        |
| **US-006** | Session Slot Integration | P0       | Large      | 4 hours        |
| **US-007** | Testing & Edge Cases     | P0       | Medium     | 4 hours        |

**Total Estimated Time**: ~24 hours (3 working days)

---

## 🚀 Quick Start

### For AI Agents

If you're an AI agent (Claude, GPT, etc.) implementing this feature:

1. **Read this file first** to understand the feature scope
2. **Read `AGENT-GUIDE.md`** for step-by-step implementation instructions
3. **Check `STATUS.md`** to see current progress
4. **Implement user stories in order** (US-001 → US-002 → ... → US-007)
5. **Update `STATUS.md`** after completing each milestone

**Start command**: `/implement-userstory US-001`

### For Human Developers

1. Review this file and `README.md` for context
2. Check `STATUS.md` for current progress
3. Read individual user story files in order
4. Implement according to AGENT-GUIDE.md workflow
5. Run tests after each story completion

---

## 🏗️ Architecture Overview

### Database Layer

**New Table**: `studio_settings`

```sql
- id (uuid, primary key)
- setting_key (text, unique) - e.g., "opening_hours", "currency"
- setting_value (jsonb) - Flexible structure per setting type
- effective_from (date) - When this setting takes effect
- created_at, updated_at (timestamps)
```

**Opening Hours Structure** (JSONB):

```json
{
  "monday": { "is_open": true, "open_time": "09:00", "close_time": "21:00" },
  "tuesday": { "is_open": true, "open_time": "09:00", "close_time": "21:00" },
  "wednesday": { "is_open": true, "open_time": "09:00", "close_time": "21:00" },
  "thursday": { "is_open": true, "open_time": "09:00", "close_time": "21:00" },
  "friday": { "is_open": true, "open_time": "09:00", "close_time": "21:00" },
  "saturday": { "is_open": true, "open_time": "10:00", "close_time": "18:00" },
  "sunday": { "is_open": false, "open_time": null, "close_time": null }
}
```

### Frontend Architecture

**New Routes**:

- `/settings/studio` - Main settings page (tabbed layout)
- `/settings/studio/opening-hours` - Opening hours editor (default tab)

**Key Components**:

- `StudioSettingsPage` - Main page wrapper with tabs
- `OpeningHoursTab` - Opening hours editor tab
- `WeeklyOpeningHoursGrid` - Custom weekly schedule grid
- `DayOpeningHoursRow` - Single day editor row
- `EffectiveDatePicker` - Date picker for when changes apply
- `ConflictDetectionDialog` - Shows booking conflicts before save

**New Hooks**:

- `useStudioSettings()` - Fetch/update studio settings
- `useOpeningHours()` - Specialized hook for opening hours
- `useConflictDetection()` - Check for session conflicts

### Integration Points

**Modified Files**:

- `src/features/training-sessions/lib/slot-generator.ts` - Dynamic slot generation
- `src/components/layout/sidebar.tsx` - Settings navigation (already exists)
- `src/features/database/schema/studio_settings.sql` - New migration

**Data Flow**:

1. Admin opens Settings → Opening Hours
2. Fetches current opening hours from `studio_settings` table
3. Edits weekly grid, sets effective date
4. System checks for conflicts with future sessions
5. If conflicts exist → Show dialog, block save
6. If no conflicts → Save to DB
7. Session booking automatically uses new hours from effective date

---

## 📐 Design Decisions

### Key Choices Made

| Decision                           | Rationale                                                 |
| ---------------------------------- | --------------------------------------------------------- |
| **JSONB for opening hours**        | Flexible structure, easy to query specific days           |
| **Effective date only (no time)**  | Simpler UX, clear cutoff at midnight                      |
| **Block save on conflicts**        | Prevents data loss, forces intentional resolution         |
| **No retroactive changes**         | Preserves data integrity, no need to update past sessions |
| **Custom weekly grid**             | No shadcn/ui equivalent, full control over UX             |
| **Function-based slot generation** | Dynamic slots based on DB, not hardcoded                  |

### Future Extensibility

This architecture supports adding more settings easily:

**Planned Settings** (not in scope):

- Currency & display formats
- Gym timezone
- Business information (name, address, logo)
- Notification preferences
- Payment gateway settings

**How to extend**:

1. Add new `setting_key` to `studio_settings` table
2. Create new tab in `StudioSettingsPage`
3. Build specialized editor component for that setting
4. Add validation logic as needed

---

## ⚠️ Important Constraints

### What This Feature Does NOT Do

❌ **Does not change past sessions** - Historical data remains intact
❌ **Does not auto-cancel conflicts** - Admin must manually resolve
❌ **Does not support multiple time windows per day** - Single open/close per day only
❌ **Does not support overnight hours** - Hours must be within same day
❌ **Does not track change history** - No audit log (future enhancement)

### Business Rules

✅ **Effective date must be today or future** - No past dates allowed
✅ **Closing time must be after opening time** - Validation enforced
✅ **Closed days cannot have times** - Times are null when `is_open: false`
✅ **All 7 days must be defined** - No partial weeks
✅ **30-minute session duration fixed** - Not configurable in this release

---

## 📚 Additional Resources

- **AGENT-GUIDE.md** - Step-by-step implementation workflow
- **README.md** - Technical architecture deep-dive
- **STATUS.md** - Implementation progress tracker
- **US-001.md through US-007.md** - Detailed user story specifications

---

## ✅ Definition of Done

This feature is considered complete when:

- [ ] All 7 user stories implemented and tested
- [ ] Database migration applied successfully
- [ ] Settings page accessible from sidebar
- [ ] Weekly grid editor functional with validation
- [ ] Effective date handling works correctly
- [ ] Conflict detection prevents data loss
- [ ] Session booking respects new opening hours
- [ ] All unit tests pass (100% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Code review approved
- [ ] Documentation updated
- [ ] User acceptance testing completed

---

## 🏁 Next Steps

**Ready to start implementation?**

1. Read `AGENT-GUIDE.md` for detailed workflow
2. Check `STATUS.md` for current progress
3. Begin with `/implement-userstory US-001` (Database Schema)

**Questions or Issues?**

- Check individual user story files for detailed acceptance criteria
- Review `README.md` for technical architecture
- Consult `CLAUDE.md` in project root for coding standards

---

**Generated**: 2025-10-16
**Feature Name**: Studio Settings - Opening Hours Management
**Priority**: P0 (Must Have)
**Target Release**: Q1 2025
