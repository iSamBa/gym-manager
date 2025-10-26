# Session Types Expansion - START HERE

## 🎯 Feature Overview

**Feature Name**: Session Types Expansion
**Status**: In Progress
**Branch**: `feature/session-types-expansion`
**Priority**: P0 - Critical for Operations

---

## 📖 What This Feature Does

Expands the training session booking system from 2 session types (trial/standard) to 7 types:

1. **Trial** - Try-out session with quick member registration
2. **Member** - Regular member session (renamed from "standard")
3. **Contractual** - Contract signing (trial members only)
4. **Multi-Site** - Guest from partner gym (stores guest info)
5. **Collaboration** - Commercial partnership/influencer
6. **Make-Up** - Additional session (bypasses weekly limit)
7. **Non-Bookable** - Time blocker (no member needed)

### Key Capabilities

- ✅ Quick trial member registration (6 fields: name, phone, email, gender, referral)
- ✅ Guest session tracking for financial reconciliation
- ✅ Session type-based color coding (replaces time-based colors)
- ✅ Dynamic form validation per session type
- ✅ Business rules: make-up bypass, trial filtering, capacity exclusion

---

## 🗂️ User Stories

| ID     | Story                            | Status         | Complexity | Dependencies   |
| ------ | -------------------------------- | -------------- | ---------- | -------------- |
| US-001 | Database schema expansion        | ✅ Completed   | Small      | None           |
| US-002 | TypeScript type system updates   | 🟡 In Progress | Small      | US-001         |
| US-003 | Validation schema updates        | ⬜ Pending     | Small      | US-002         |
| US-004 | Session type color system        | ⬜ Pending     | Small      | US-002         |
| US-005 | Session type selector UI         | ⬜ Pending     | Small      | US-002         |
| US-006 | Trial member quick registration  | ⬜ Pending     | Medium     | US-002, US-003 |
| US-007 | Guest session info capture       | ⬜ Pending     | Small      | US-002, US-003 |
| US-008 | Dynamic booking form integration | ⬜ Pending     | Large      | US-003-US-007  |

---

## 🚀 Implementation Order

### Phase 1: Foundation (US-001, US-002)

Database and type system - **DONE/IN PROGRESS**

### Phase 2: Core Logic (US-003, US-004)

Validation and visual system

### Phase 3: UI Components (US-005, US-006, US-007)

Reusable form components

### Phase 4: Integration (US-008)

Wire everything together in SessionBookingDialog

---

## 📋 Implementation Checklist

### Before Starting

- [x] Feature branch created
- [x] Database migrations applied
- [ ] Read AGENT-GUIDE.md for workflow
- [ ] Review reference screenshot

### During Implementation

- [ ] Follow dependency order
- [ ] Update STATUS.md after each story
- [ ] Run tests after each story
- [ ] Keep TypeScript errors at zero

### Before PR

- [ ] All user stories completed
- [ ] 100% test coverage for new code
- [ ] No console.logs or @ts-ignore
- [ ] Documentation updated
- [ ] Performance checklist passed

---

## 📚 Key Files

### Documentation

- `README.md` - Architecture and design decisions
- `AGENT-GUIDE.md` - Step-by-step implementation workflow
- `STATUS.md` - Progress tracking

### User Stories

- `US-001-database-schema-expansion.md`
- `US-002-typescript-type-system.md`
- `US-003-validation-schemas.md`
- `US-004-session-type-colors.md`
- `US-005-session-type-selector.md`
- `US-006-trial-member-registration.md`
- `US-007-guest-session-info.md`
- `US-008-dynamic-booking-form.md`

---

## 🎨 Design Reference

Color scheme (matching reference screenshot):

- **Trial**: Blue (#3B82F6) - bg-blue-500
- **Member**: Green (#22C55E) - bg-green-500
- **Contractual**: Orange (#F97316) - bg-orange-500
- **Multi-Site**: Purple (#A855F7) - bg-purple-500
- **Collaboration**: Lime (#65A30D) - bg-lime-600
- **Make-Up**: Dark Blue (#1E3A8A) - bg-blue-900
- **Non-Bookable**: Red (#EF4444) - bg-red-500

---

## 🐛 Known Issues & Gotchas

1. **Database Migration Already Applied** - US-001 completed during setup
2. **TypeScript Changes Partially Done** - Database types updated, need to complete training session types
3. **Time-Based Colors Must Be Removed** - Don't just add, replace entire `session-colors.ts`
4. **Email Uniqueness** - Trial registration must check for duplicates
5. **Guest Sessions Have No member_id** - Handle NULL member_id properly

---

## 💡 Quick Start

```bash
# Current branch (should already be here)
git branch --show-current  # feature/session-types-expansion

# Start implementing
/implement-userstory US-002  # Continue from type system updates

# After each story
npm test  # Run tests
npm run lint  # Check code quality
```

---

## 📞 Questions?

Refer to:

- AGENT-GUIDE.md for detailed workflow
- README.md for architecture decisions
- Individual US-\*.md files for acceptance criteria
- CLAUDE.md (root) for project standards

---

**Next Step**: Read `AGENT-GUIDE.md` then implement US-002
