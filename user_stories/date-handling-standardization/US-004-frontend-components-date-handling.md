# US-004: Frontend Components Date Handling

**Status**: Not Started
**Priority**: P1 (User-Facing)
**Estimated Time**: 1-2 hours
**Dependencies**: US-001

---

## 📋 User Story

**As a** gym administrator
**I want** all date pickers and comparisons to work correctly in my timezone
**So that** dates display and behave as expected in the UI

---

## ✅ Acceptance Criteria

### AC1: OpeningHoursTab Uses compareDates

**File**: `src/features/settings/components/OpeningHoursTab.tsx` (lines 145-160)

**Already partially fixed, complete the migration**:

```typescript
// Current uses string comparison (good!)
// Migrate to use compareDates() for consistency
import { compareDates } from "@/lib/date-utils";
const shouldShowPreview = compareDates(effectiveFromStr, new Date()) > 0;
```

### AC2: EffectiveDatePicker Uses Local Date

**File**: `src/features/settings/components/EffectiveDatePicker.tsx` (line 27-28)

Replace:

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);
```

With:

```typescript
import { getLocalDateString } from "@/lib/date-utils";
// For date comparison in disabled prop
```

### AC3: All Date Comparisons Migrated

Search for patterns:

- `.setHours(0, 0, 0, 0)`
- `.getTime()` comparisons

Replace with `compareDates()`.

---

## ✅ Definition of Done

- [ ] All frontend components use date-utils
- [ ] No `.setHours(0,0,0,0)` patterns
- [ ] Date pickers work correctly
- [ ] Tests passing

---

```bash
/implement-userstory US-004
```
