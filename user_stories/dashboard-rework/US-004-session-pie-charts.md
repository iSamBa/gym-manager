# US-004: Weekly Session Statistics Pie Charts

## 📋 User Story

**As an** admin  
**I want** to see session distribution by type for 3 weeks  
**So that** I can understand booking patterns and plan resources

## 💼 Business Value

Visual session analytics help identify trends, spot capacity issues, and optimize scheduling. Seeing 3 weeks (past/current/future) enables proactive resource planning.

## ✅ Acceptance Criteria

### 1. SessionsByTypeChart Component Created

**File**: `src/features/dashboard/components/SessionsByTypeChart.tsx`

- ✅ Uses shadcn/ui PieChart (recharts)
- ✅ Displays donut chart with 7 session types
- ✅ Shows total count in center
- ✅ Includes legend with all types and colors
- ✅ Uses existing session type color scheme
- ✅ Responsive sizing for mobile/tablet/desktop

### 2. Props Interface

```typescript
interface SessionsByTypeChartProps {
  data: WeeklySessionStats;
  title: string;
}
```

### 3. Session Types and Colors

- ✅ Trial - Existing color
- ✅ Member - Existing color
- ✅ Contractual - Existing color
- ✅ Multi-site - Existing color
- ✅ Collaboration - Existing color
- ✅ Makeup - Existing color
- ✅ Non-bookable - Existing color

### 4. Performance

- ✅ Wrapped in React.memo
- ✅ Lazy loaded with React.lazy
- ✅ Minimal re-renders

### 5. States Handled

- ✅ Loading state (skeleton/spinner)
- ✅ Empty state (no sessions)
- ✅ Error state (failed to load)
- ✅ Success state (chart displayed)

### 6. Component Tests

- ✅ Renders with data
- ✅ Shows all 7 types
- ✅ Legend displays correctly
- ✅ Empty data handled
- ✅ Responsive behavior

## 🔧 Technical Scope

**File**: `src/features/dashboard/components/SessionsByTypeChart.tsx`  
**Dependencies**: shadcn/ui chart.tsx, recharts, React.memo

## 📊 Definition of Done

- [ ] Component created with shadcn/ui PieChart
- [ ] All 7 session types displayed with legend
- [ ] React.memo applied
- [ ] Responsive design verified
- [ ] Component tests passing
- [ ] Loading/error/empty states handled

## 🔗 Dependencies

**Upstream**: US-002 (types), US-003 (data hooks)  
**Downstream**: US-006 (dashboard integration)

## ⏱️ Effort: 3-4 hours (Medium)
