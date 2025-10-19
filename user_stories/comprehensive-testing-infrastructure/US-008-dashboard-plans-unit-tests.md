# US-008: Dashboard and Plans Unit Tests

**Phase**: Phase 2 - Unit Test Coverage (Week 4)
**Priority**: P1 (Should Have)
**Estimated Effort**: 10 hours
**Dependencies**: US-001 (Infrastructure)

---

## User Story

**As a** developer
**I want** comprehensive unit tests for dashboard analytics and plans features
**So that** stats calculations, charts, and plan management work correctly

---

## Business Value

Dashboard analytics and plans have minimal test coverage. Without tests:

- Stats calculations could be wrong (misleading business insights)
- Chart data transformations could break
- Plan pricing logic could have errors
- Coverage thresholds won't be met

**Impact**: Increases dashboard/plans coverage from <30% to 85%+

---

## Detailed Acceptance Criteria

### AC1: useMemberAnalytics Hook Tests

- [ ] Test calculates total members correctly
- [ ] Test calculates active members count
- [ ] Test calculates inactive members count
- [ ] Test calculates member growth rate
- [ ] Test handles empty member list
- [ ] Test filters by date range
- [ ] Test aggregates by month/week

### AC2: useRecentActivities Hook Tests

- [ ] Test fetches recent payments
- [ ] Test fetches recent memberships
- [ ] Test fetches recent sessions
- [ ] Test sorts by date (newest first)
- [ ] Test limits to 10 most recent
- [ ] Test formats activity descriptions
- [ ] Test handles no activities

### AC3: Chart Data Transformation Tests

- [ ] Test transformMemberEvolutionData formats correctly
- [ ] Test transformRevenueData aggregates by month
- [ ] Test transformSessionData groups by week
- [ ] Test handles missing data points
- [ ] Test fills gaps with zeros
- [ ] Test sorts chronologically

### AC4: Plans CRUD Tests

- [ ] Test usePlans fetches all plans
- [ ] Test createPlan validates required fields
- [ ] Test updatePlan updates cache
- [ ] Test deletePlan removes from cache
- [ ] Test filters active/inactive plans
- [ ] Test validates price >0
- [ ] Test validates sessions_count >0
- [ ] Test validates duration_days >0

---

## Technical Implementation

### Example Test File Structure

```typescript
// src/features/dashboard/hooks/__tests__/use-member-analytics.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { useMemberAnalytics } from "../use-member-analytics";

describe("useMemberAnalytics", () => {
  it("should calculate total members", async () => {
    // Mock data with 10 members
    const { result } = renderHook(() => useMemberAnalytics());
    await waitFor(() => expect(result.current.data.total).toBe(10));
  });

  it("should calculate active members", async () => {
    // Mock 7 active, 3 inactive
    const { result } = renderHook(() => useMemberAnalytics());
    await waitFor(() => {
      expect(result.current.data.active).toBe(7);
      expect(result.current.data.inactive).toBe(3);
    });
  });

  it("should calculate growth rate", async () => {
    // Mock: 100 members this month, 80 last month = 25% growth
    const { result } = renderHook(() => useMemberAnalytics());
    await waitFor(() => {
      expect(result.current.data.growthRate).toBe(25);
    });
  });
});

// src/features/dashboard/lib/__tests__/chart-utils.test.ts
import { transformMemberEvolutionData } from "../chart-utils";

describe("transformMemberEvolutionData", () => {
  it("should format data for recharts", () => {
    const input = [
      { month: "2025-01", count: 50 },
      { month: "2025-02", count: 60 },
    ];

    const result = transformMemberEvolutionData(input);

    expect(result).toEqual([
      { name: "January", members: 50 },
      { name: "February", members: 60 },
    ]);
  });

  it("should fill missing months with zeros", () => {
    const input = [
      { month: "2025-01", count: 50 },
      { month: "2025-03", count: 70 }, // February missing
    ];

    const result = transformMemberEvolutionData(input);

    expect(result).toEqual([
      { name: "January", members: 50 },
      { name: "February", members: 0 }, // Filled
      { name: "March", members: 70 },
    ]);
  });
});

// src/features/plans/hooks/__tests__/use-plans.test.ts
import { renderHook } from "@testing-library/react";
import { usePlans } from "../use-plans";

describe("usePlans", () => {
  it("should fetch all plans", async () => {
    // Test implementation
  });

  it("should filter active plans", async () => {
    // Test implementation
  });

  it("should validate plan creation", async () => {
    // Test that price must be >0
    // Test that sessions must be >0
    // Test that duration must be >0
  });
});
```

---

## Definition of Done

- [ ] All 4 acceptance criteria met
- [ ] useMemberAnalytics tests passing (7 tests)
- [ ] useRecentActivities tests passing (7 tests)
- [ ] Chart transformation tests passing (6 tests)
- [ ] Plans CRUD tests passing (8 tests)
- [ ] Coverage >85% for dashboard feature
- [ ] Coverage >85% for plans feature
- [ ] All tests pass in CI
- [ ] Code reviewed and approved

---

## Implementation Notes

### Focus Areas

1. **Stats Calculations**: Verify math is correct (totals, percentages, growth)
2. **Date Handling**: Use date-utils functions, test month boundaries
3. **Chart Data**: Verify recharts format, test empty data
4. **Plan Validation**: Test all constraints (price, sessions, duration)

---

## Dependencies

**Requires**: US-001 (Infrastructure)
