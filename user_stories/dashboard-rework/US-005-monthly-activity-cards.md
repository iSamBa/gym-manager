# US-005: Monthly Activity Metrics Display

## 📋 User Story

**As an** admin  
**I want** to see monthly activity metrics in clear stat cards  
**So that** I can track member growth and subscription health

## 💼 Business Value

Clear visibility into member conversion and retention metrics drives strategic decisions. Admins need to quickly see if trial conversions are trending up and if churn is increasing.

## ✅ Acceptance Criteria

### 1. MonthlyActivityCard Component

**File**: `src/features/dashboard/components/MonthlyActivityCard.tsx`

Displays 5 metrics:

- ✅ Trial Sessions count
- ✅ Trial to Full Conversions count
- ✅ Subscriptions Expired count
- ✅ Subscriptions Renewed count
- ✅ Subscriptions Cancelled count

### 2. Card Features

- ✅ Descriptive icon for each metric (lucide-react)
- ✅ Clear label
- ✅ Large, readable number
- ✅ Optional trend indicator

### 3. Layout

- ✅ Responsive grid: Desktop (2-3 cols), Tablet (2 cols), Mobile (1 col)
- ✅ Consistent card styling with app theme
- ✅ Uses existing StatsCard pattern if applicable

### 4. Performance

- ✅ React.memo applied
- ✅ Minimal re-renders

### 5. Component Tests

- ✅ Renders all 5 metrics
- ✅ Displays correct values
- ✅ Icons displayed
- ✅ Responsive grid works

## 🔧 Technical Scope

**File**: `src/features/dashboard/components/MonthlyActivityCard.tsx`  
**Dependencies**: lucide-react icons, Tailwind grid

## 📊 Definition of Done

- [ ] Component displays all 5 metrics
- [ ] Icons and styling match app theme
- [ ] Responsive grid layout
- [ ] React.memo applied
- [ ] Component tests passing

## 🔗 Dependencies

**Upstream**: US-002 (types), US-003 (data hooks)  
**Downstream**: US-006 (dashboard integration)

## ⏱️ Effort: 2-3 hours (Small)
