# Session-Subscription Consistency Fix - START HERE

## Overview

This feature addresses critical architectural issues in how training sessions relate to member subscriptions, ensuring data integrity through database constraints, proper foreign key relationships, and consistent session counting logic.

## Problem Statement

The current system has several critical issues:

1. **No Direct Link**: Training sessions don't directly reference subscriptions (only via member_id)
2. **No Constraints**: Database allows multiple active subscriptions per member
3. **Inconsistent Counting**: Session counts (completed + scheduled + remaining) don't always equal total
4. **Race Conditions**: Concurrent session bookings can bypass remaining session checks
5. **Credit Restoration Bugs**: Deleted sessions restore credits to wrong subscription
6. **Mixed Session Types**: Trial/guest sessions incorrectly counted toward subscriptions

## Goals

- Add `subscription_id` foreign key to `training_sessions` table
- Implement database constraints preventing data corruption
- Fix session counting: completed + scheduled + remaining = total
- Eliminate race conditions in session creation/deletion
- Standardize counting across all UI components
- Create validation system to detect future inconsistencies

## Implementation Approach

This feature follows an **incremental, phased approach** with thorough testing at each stage:

### Phase 1: Discovery (No Breaking Changes)

Audit current data to understand scope of inconsistencies

### Phase 2: Foundation (Database Changes)

Add structural integrity with constraints and foreign keys

### Phase 3: Core Fixes (Business Logic)

Fix race conditions, credit restoration, and counting logic

### Phase 4: UI Updates (Consistency)

Ensure all components display accurate data

### Phase 5: Prevention (Validation)

Automated checks to prevent future issues

## User Stories

| Story  | Name                           | Complexity | Dependencies   | Status      |
| ------ | ------------------------------ | ---------- | -------------- | ----------- |
| US-001 | Data Audit & Discovery         | Small      | None           | Not Started |
| US-002 | Database Schema Migrations     | Large      | US-001         | Not Started |
| US-003 | Business Logic Fixes           | Large      | US-002         | Not Started |
| US-004 | UI Consistency Updates         | Medium     | US-003         | Not Started |
| US-005 | Validation & Monitoring System | Medium     | US-002, US-003 | Not Started |

**Estimated Total Effort**: 26 hours

## Quick Start

### Prerequisites

1. Read this entire file
2. Review [AGENT-GUIDE.md](./AGENT-GUIDE.md) for implementation workflow
3. Check [README.md](./README.md) for technical architecture
4. Understand [STATUS.md](./STATUS.md) for progress tracking

### Implementation Order

**CRITICAL**: User stories MUST be implemented in this order due to dependencies:

```
US-001 (Data Audit)
    ↓
US-002 (Database Migrations) ← Foundation for all other work
    ↓
US-003 (Business Logic Fixes) ← Depends on subscription_id column
    ↓
US-004 (UI Consistency) ← Depends on fixed logic
    ↓
US-005 (Validation System) ← Depends on correct structure
```

### Getting Started

1. **Create Feature Branch** (MANDATORY):

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/session-subscription-consistency-fix
   ```

2. **Start with US-001**:

   ```bash
   # Read the user story
   cat user_stories/session-subscription-consistency-fix/US-001-data-audit.md

   # Begin implementation
   # Use /implement-userstory US-001 if available
   ```

3. **Follow AGENT-GUIDE.md** for systematic workflow

4. **Update STATUS.md** after each milestone

## Key Files to Modify

### Database

- Supabase migrations (via MCP)
- `src/features/database/lib/types.ts`

### Business Logic

- `src/features/training-sessions/hooks/use-training-sessions.ts`
- `src/features/training-sessions/hooks/use-member-dialog-data.ts`
- `src/features/memberships/lib/subscription-utils.ts`

### UI Components

- `src/features/training-sessions/components/SessionStatsCards.tsx`
- `src/features/training-sessions/components/forms/MemberDetailsTab.tsx`
- `src/features/members/components/MemberSessionsTable.tsx`

### Validation (New)

- `src/features/training-sessions/lib/session-validator.ts` (create)
- `src/features/training-sessions/hooks/use-session-integrity-validator.ts` (create)

## Testing Strategy

Each user story has specific testing requirements:

- **US-001**: No tests (read-only audit)
- **US-002**: Migration tests on dev branch
- **US-003**: Unit + integration tests for hooks
- **US-004**: Manual UI testing
- **US-005**: End-to-end validation tests

**Golden Rule**: Run full test suite before merging: `npm test && npm run build && npm run lint`

## Rollback Plan

Each phase is designed to be reversible:

- **US-002**: Down migrations provided for all schema changes
- **US-003**: Feature flags for gradual rollout (if needed)
- **US-004**: UI changes are non-breaking
- **US-005**: Validation is monitoring-only, doesn't block operations

## Success Criteria

This feature is complete when:

- [ ] All 5 user stories implemented and tested
- [ ] Database constraints prevent multiple active subscriptions
- [ ] All sessions have valid subscription_id
- [ ] Session math is correct: completed + scheduled + remaining = total
- [ ] No race conditions in session booking
- [ ] All UI components show consistent counts
- [ ] Validation system detects anomalies
- [ ] All tests pass (100% pass rate)
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] Deployed to staging and verified with real data

## Support & Documentation

- **Architecture Details**: [README.md](./README.md)
- **Implementation Workflow**: [AGENT-GUIDE.md](./AGENT-GUIDE.md)
- **Progress Tracking**: [STATUS.md](./STATUS.md)
- **User Stories**: `US-001.md` through `US-005.md`
- **Original Analysis**: See comprehensive audit findings (provided separately)

## Questions or Issues?

If you encounter problems:

1. Check [STATUS.md](./STATUS.md) for known blockers
2. Review [README.md](./README.md) for architecture context
3. Consult original analysis document for detailed findings
4. Update STATUS.md with new blockers/questions

---

**Ready to begin? Start with [AGENT-GUIDE.md](./AGENT-GUIDE.md) for step-by-step instructions!**
