# US-005: Training Sessions & Conflict Detection

**Status**: Not Started
**Priority**: P1 (Integration)
**Estimated Time**: 2 hours
**Dependencies**: US-001, US-003

---

## 📋 User Story

**As a** system
**I want** training session dates and conflicts to be detected correctly
**So that** scheduling works reliably across features

---

## ✅ Acceptance Criteria

### AC1: Conflict Detection Uses Local Date

**File**: `src/features/training-sessions/hooks/use-conflict-detection.ts`

Update to use `getLocalDateString()` for date comparisons.

### AC2: Session Alerts Use Correct Dates

**File**: `src/features/training-sessions/hooks/use-session-alerts.ts`

Verify all date operations use date-utils.

### AC3: Integration Tests Pass

- [ ] Conflicts detected correctly
- [ ] Session alerts trigger at correct times
- [ ] Cross-feature date handling consistent

---

## ✅ Definition of Done

- [ ] Conflict detection uses date-utils
- [ ] Session alerts use date-utils
- [ ] Integration tests passing
- [ ] No timezone-related bugs

---

```bash
/implement-userstory US-005
```
