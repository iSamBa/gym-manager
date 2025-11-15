# Dashboard Components

## SessionsByTypeChart

A production-ready donut chart component that visualizes weekly session statistics by type.

### Usage

```tsx
import { SessionsByTypeChart } from "@/features/dashboard/components/SessionsByTypeChart";
import { useWeeklySessions } from "@/features/dashboard/hooks/use-weekly-sessions";

export default function DashboardPage() {
  const { data, isLoading } = useWeeklySessions("2025-01-13");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return null;
  }

  return <SessionsByTypeChart data={data} title="This Week's Sessions" />;
}
```

### Props

| Prop    | Type                 | Required | Description                          |
| ------- | -------------------- | -------- | ------------------------------------ |
| `data`  | `WeeklySessionStats` | Yes      | Session statistics for a given week  |
| `title` | `string`             | Yes      | Chart title displayed in card header |

### Features

- **Donut Chart**: Shows session distribution with total count in center
- **Responsive Design**: Adapts to mobile (280px), tablet (350px), desktop (400px)
- **Smart Filtering**: Only displays session types with count > 0
- **Empty State**: Shows friendly message when no sessions exist
- **7 Session Types**: Trial, Member, Contractual, Multi-Site, Collaboration, Makeup, Non-Bookable
- **Performance Optimized**: Uses React.memo and useMemo for efficient rendering
- **Accessible**: Proper ARIA labels and semantic HTML structure

### Session Type Colors

| Type          | Color               | HSL Variable          |
| ------------- | ------------------- | --------------------- |
| Trial         | Blue (#3B82F6)      | `hsl(var(--chart-1))` |
| Member        | Green (#22C55E)     | `hsl(var(--chart-2))` |
| Contractual   | Orange (#F97316)    | `hsl(var(--chart-3))` |
| Multi-Site    | Purple (#A855F7)    | `hsl(var(--chart-4))` |
| Collaboration | Lime (#65A30D)      | `hsl(var(--chart-5))` |
| Makeup        | Dark Blue (#1E3A8A) | `hsl(var(--chart-6))` |
| Non-Bookable  | Red (#EF4444)       | `hsl(var(--chart-7))` |

### Data Structure

```typescript
interface WeeklySessionStats {
  week_start: string; // YYYY-MM-DD format
  week_end: string; // YYYY-MM-DD format
  total_sessions: number;
  trial: number;
  member: number;
  contractual: number;
  multi_site: number;
  collaboration: number;
  makeup: number;
  non_bookable: number;
}
```

### Example with Three Week View

```tsx
import { useThreeWeekSessions } from "@/features/dashboard/hooks/use-weekly-sessions";

export default function DashboardOverview() {
  const { data, isLoading } = useThreeWeekSessions();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {data.lastWeek && (
        <SessionsByTypeChart data={data.lastWeek} title="Last Week" />
      )}
      {data.currentWeek && (
        <SessionsByTypeChart data={data.currentWeek} title="This Week" />
      )}
      {data.nextWeek && (
        <SessionsByTypeChart data={data.nextWeek} title="Next Week" />
      )}
    </div>
  );
}
```

### Performance Characteristics

- **React.memo**: Component only re-renders when props change
- **useMemo**: Chart data transformation is memoized
- **Responsive Bundle**: Chart library is loaded efficiently via shadcn/ui
- **Component Size**: Under 250 lines (well under 300 line requirement)

### Testing

The component has comprehensive test coverage including:

- ✅ Rendering with all session types
- ✅ Empty state handling
- ✅ Data transformation logic
- ✅ Responsive design classes
- ✅ Edge cases (large counts, negative values)
- ✅ React.memo optimization
- ✅ Accessibility structure

Run tests:

```bash
npm test -- src/features/dashboard/components/__tests__/SessionsByTypeChart.test.tsx
```
