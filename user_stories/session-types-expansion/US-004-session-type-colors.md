# US-004: Session Type Color System

## User Story

**As a** gym administrator
**I want** sessions colored by type (not by time)
**So that** I can quickly identify session purposes in the calendar

---

## Business Value

**Priority**: P0 (Must Have)
**Complexity**: Small
**Estimated Time**: 1 hour

### Impact

- Improves schedule readability
- Matches design reference
- Removes confusing time-based colors
- Enables at-a-glance session identification

---

## Acceptance Criteria

### AC-1: Color Functions Replaced

- DELETE: `getSessionColorVariant()` function
- DELETE: `SessionColorVariant` type
- ADD: `getSessionTypeColor()` function
- ADD: `getSessionTypeBadgeColor()` function

### AC-2: Correct Colors Returned

- Trial → Blue (bg-blue-500)
- Member → Green (bg-green-500)
- Contractual → Orange (bg-orange-500)
- Multi-Site → Purple (bg-purple-500)
- Collaboration → Lime (bg-lime-600)
- Make-Up → Dark Blue (bg-blue-900)
- Non-Bookable → Red (bg-red-500)

### AC-3: TimeSlot Component Updated

- Remove all past/today/future logic
- Use `getSessionTypeColor(session.session_type)`
- No date-based color calculation

### AC-4: All References Updated

- No "past", "today", "future" strings remain
- All components use new color system
- Tests updated

---

## Technical Implementation

**File**: `src/features/training-sessions/lib/session-colors.ts`

**COMPLETE REPLACEMENT:**

```typescript
import type { SessionType } from "./types";

/**
 * Get background color class for session type (TimeSlot cards)
 */
export function getSessionTypeColor(sessionType: SessionType): string {
  const colors: Record<SessionType, string> = {
    trial: "bg-blue-500 text-white hover:bg-blue-600",
    member: "bg-green-500 text-white hover:bg-green-600",
    contractual: "bg-orange-500 text-white hover:bg-orange-600",
    multi_site: "bg-purple-500 text-white hover:bg-purple-600",
    collaboration: "bg-lime-600 text-white hover:bg-lime-700",
    makeup: "bg-blue-900 text-white hover:bg-blue-950",
    non_bookable: "bg-red-500 text-white hover:bg-red-600",
  };
  return colors[sessionType];
}

/**
 * Get badge color for session type labels
 */
export function getSessionTypeBadgeColor(sessionType: SessionType): string {
  const colors: Record<SessionType, string> = {
    trial: "bg-blue-100 text-blue-800 border-blue-300",
    member: "bg-green-100 text-green-800 border-green-300",
    contractual: "bg-orange-100 text-orange-800 border-orange-300",
    multi_site: "bg-purple-100 text-purple-800 border-purple-300",
    collaboration: "bg-lime-100 text-lime-800 border-lime-300",
    makeup: "bg-blue-100 text-blue-900 border-blue-400",
    non_bookable: "bg-red-100 text-red-800 border-red-300",
  };
  return colors[sessionType];
}

/**
 * Get border color for session type
 */
export function getSessionTypeBorderColor(sessionType: SessionType): string {
  const colors: Record<SessionType, string> = {
    trial: "border-blue-500",
    member: "border-green-500",
    contractual: "border-orange-500",
    multi_site: "border-purple-500",
    collaboration: "border-lime-600",
    makeup: "border-blue-900",
    non_bookable: "border-red-500",
  };
  return colors[sessionType];
}
```

**File**: `src/features/training-sessions/components/TimeSlot.tsx`

```typescript
import { getSessionTypeColor, getSessionTypeBorderColor } from '../lib/session-colors';

// Remove imports of getSessionColorVariant

// In component:
<div className={cn(
  "session-card p-2 rounded border-l-4",
  getSessionTypeColor(session.session_type),
  getSessionTypeBorderColor(session.session_type)
)}>
  {/* Session content */}
</div>
```

---

## Testing Requirements

**File**: `src/features/training-sessions/lib/__tests__/session-colors.test.ts`

```typescript
describe("Session Type Colors", () => {
  it("returns correct color for each session type", () => {
    expect(getSessionTypeColor("trial")).toContain("bg-blue-500");
    expect(getSessionTypeColor("member")).toContain("bg-green-500");
    expect(getSessionTypeColor("contractual")).toContain("bg-orange-500");
    expect(getSessionTypeColor("multi_site")).toContain("bg-purple-500");
    expect(getSessionTypeColor("collaboration")).toContain("bg-lime-600");
    expect(getSessionTypeColor("makeup")).toContain("bg-blue-900");
    expect(getSessionTypeColor("non_bookable")).toContain("bg-red-500");
  });

  it("returns correct badge colors", () => {
    expect(getSessionTypeBadgeColor("trial")).toContain("bg-blue-100");
    // ... test all types
  });

  it("returns correct border colors", () => {
    expect(getSessionTypeBorderColor("trial")).toBe("border-blue-500");
    // ... test all types
  });

  it("does NOT use time-based colors", () => {
    const color = getSessionTypeColor("member");
    expect(color).not.toContain("past");
    expect(color).not.toContain("today");
    expect(color).not.toContain("future");
  });
});
```

---

## Dependencies

**Depends On**: US-002 (SessionType must exist)
**Blocks**: None (independent)

---

## Definition of Done

- [ ] session-colors.ts completely replaced
- [ ] getSessionColorVariant removed
- [ ] SessionColorVariant type removed
- [ ] 3 new functions added (color, badge, border)
- [ ] TimeSlot.tsx updated
- [ ] All past/today/future references removed
- [ ] Tests updated and passing
- [ ] Visual verification in calendar view
