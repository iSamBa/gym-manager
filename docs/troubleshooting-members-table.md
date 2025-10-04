# Troubleshooting Guide - Members Table

## Common Issues & Solutions

### Issue 1: Table slow to load

**Symptoms:**

- Initial table load takes > 2 seconds
- Filtering or sorting is laggy
- Browser becomes unresponsive

**Possible Causes & Solutions:**

**Cause 1: Missing database indexes**

```sql
-- Check if indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('members', 'subscriptions', 'payments', 'training_session_members');

-- If missing, create them
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_member_type ON members(member_type);
CREATE INDEX IF NOT EXISTS idx_members_join_date ON members(join_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
```

**Cause 2: Database function not optimized**

```sql
-- Check query execution time
EXPLAIN ANALYZE
SELECT * FROM get_members_with_details(p_limit := 100);

-- If execution time > 500ms, check:
-- 1. Indexes are being used (look for "Index Scan" in plan)
-- 2. No sequential scans on large tables
-- 3. Join conditions are correct
```

**Cause 3: Too many members loaded at once**

```typescript
// Solution: Add pagination
const members = await memberUtils.getMembers({
  limit: 100, // Limit results
  offset: 0, // Start from beginning
});
```

**Cause 4: Client-side re-renders**

```typescript
// Check React DevTools Profiler
// If many re-renders, ensure:
// 1. Components are wrapped in React.memo
// 2. Event handlers use useCallback
// 3. Computed values use useMemo
```

---

### Issue 2: Column visibility not persisting

**Symptoms:**

- Column visibility resets after page refresh
- Settings don't save across sessions

**Possible Causes & Solutions:**

**Cause 1: localStorage quota exceeded**

```javascript
// Check localStorage usage
console.log(JSON.stringify(localStorage).length);

// If > 5MB, clear old data
localStorage.removeItem("old-key");
```

**Cause 2: localStorage disabled**

```javascript
// Test if localStorage works
try {
  localStorage.setItem("test", "value");
  localStorage.removeItem("test");
  console.log("localStorage works");
} catch (e) {
  console.error("localStorage disabled:", e);
  // Enable localStorage in browser settings
}
```

**Cause 3: Incorrect storage key**

```typescript
// Verify key name matches
const key = "members-table-columns"; // Must match exactly
```

---

### Issue 3: Filters not working

**Symptoms:**

- Applying filters doesn't change results
- Clear filters button doesn't reset
- Filter count incorrect

**Possible Causes & Solutions:**

**Cause 1: API parameter mapping incorrect**

```typescript
// Check filter parameter names match database function
const members = await memberUtils.getMembers({
  status: "active", // p_status
  memberType: "full", // p_member_type (not member_type)
  hasActiveSubscription: true, // p_has_active_subscription
});
```

**Cause 2: Database function parameter typo**

```sql
-- Verify parameter names in function
SELECT proname, proargnames
FROM pg_proc
WHERE proname = 'get_members_with_details';

-- Should show: {p_status, p_search, p_member_type, ...}
```

**Cause 3: Filter state not clearing**

```typescript
// Ensure all filters are reset
const handleClearFilters = () => {
  setStatus(null);
  setSearch("");
  setMemberType(null);
  setHasActiveSubscription(null);
  setHasUpcomingSessions(null);
  setHasOutstandingBalance(null);
};
```

---

### Issue 4: Mobile layout broken

**Symptoms:**

- Table doesn't fit on mobile screens
- Horizontal scroll appears
- Columns overlapping

**Possible Causes & Solutions:**

**Cause 1: Missing responsive classes**

```tsx
// Check TableCell has responsive classes
<TableCell className="hidden lg:table-cell">Gender</TableCell>
```

**Cause 2: Fixed widths**

```tsx
// ❌ Bad - fixed width
<TableCell style={{ width: '200px' }}>

// ✅ Good - responsive width
<TableCell className="w-auto min-w-[120px]">
```

**Cause 3: Test on real devices**

```bash
# Use Chrome DevTools
# 1. Open DevTools (F12)
# 2. Click Device Toolbar (Ctrl+Shift+M)
# 3. Test on: iPhone SE, iPad, Desktop
```

---

### Issue 5: Data not refreshing

**Symptoms:**

- New members don't appear
- Updates not reflected
- Stale data displayed

**Possible Causes & Solutions:**

**Cause 1: React Query cache**

```typescript
// Force refetch
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ["members"] });
```

**Cause 2: Missing dependency in query key**

```typescript
// ❌ Bad - doesn't refetch on filter change
useQuery({ queryKey: ["members"] });

// ✅ Good - refetches when filters change
useQuery({ queryKey: ["members", filters] });
```

**Cause 3: Database transaction not committed**

```sql
-- Check for uncommitted transactions
SELECT * FROM pg_stat_activity
WHERE state = 'idle in transaction';

-- Commit or rollback
COMMIT; -- or ROLLBACK;
```

---

### Issue 6: TypeScript errors

**Symptoms:**

- Build fails with type errors
- IDE shows red squiggles
- `any` types appearing

**Possible Causes & Solutions:**

**Cause 1: Missing type definitions**

```typescript
// Add proper types
import type { MemberWithEnhancedDetails } from '@/features/database/lib/types';

const member: MemberWithEnhancedDetails = ...;
```

**Cause 2: Type mismatch**

```typescript
// Check database return type matches TypeScript interface
// Database: subscription_end_date (snake_case)
// TypeScript: end_date (in nested object)

// Ensure transformation is correct
```

**Cause 3: tsconfig strict mode**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

---

### Issue 7: Performance degradation

**Symptoms:**

- Table gets slower over time
- Memory usage increases
- Browser tab crashes

**Possible Causes & Solutions:**

**Cause 1: Memory leak**

```typescript
// Check for cleanup in useEffect
useEffect(() => {
  const subscription = ...;

  return () => {
    subscription.unsubscribe(); // Cleanup!
  };
}, []);
```

**Cause 2: Too many renders**

```typescript
// Use React DevTools Profiler
// Record timeline and check:
// 1. Component render count
// 2. Render duration
// 3. Why each render occurred
```

**Cause 3: Large dataset**

```typescript
// Implement virtual scrolling for > 1000 rows
import { useVirtualizer } from "@tanstack/react-virtual";
```

---

## Debugging Tools

### 1. Check Database Query Performance

```sql
-- Enable query logging
SET log_statement = 'all';
SET log_duration = ON;

-- Run query
SELECT * FROM get_members_with_details(p_limit := 100);

-- Check logs for execution time
```

### 2. Inspect Network Requests

```javascript
// Open browser DevTools Network tab
// Filter by: Fetch/XHR
// Check:
// - Request payload (filters sent correctly?)
// - Response time (< 500ms?)
// - Response size (< 1MB?)
```

### 3. React Component Tree

```bash
# Install React DevTools extension
# 1. Open Components tab
# 2. Select AdvancedMemberTable
# 3. Check props and state
# 4. Use Profiler to record renders
```

### 4. TypeScript Compilation

```bash
# Check for type errors
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

---

## Performance Benchmarks

### Expected Performance

| Operation                  | Target  | Measured   |
| -------------------------- | ------- | ---------- |
| Initial load (100 members) | < 500ms | 207ms ✅   |
| Filter application         | < 300ms | ~150ms ✅  |
| Sorting                    | < 200ms | ~100ms ✅  |
| Column toggle              | < 100ms | Instant ✅ |

### If Performance Degrades

1. **Check database query time**:

   ```sql
   EXPLAIN ANALYZE SELECT * FROM get_members_with_details();
   ```

2. **Profile React renders**:
   - Use React DevTools Profiler
   - Record interaction
   - Check render time and count

3. **Monitor network**:
   - Check response time in Network tab
   - Verify payload size is reasonable

4. **Test with production build**:
   ```bash
   npm run build
   npm start
   ```

---

## Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Check browser console for errors
3. ✅ Check network tab for failed requests
4. ✅ Verify database function exists
5. ✅ Test with minimal filters first

### When Reporting Issues

Include:

1. **Environment**: Browser, OS, Node version
2. **Steps to reproduce**: Exact steps taken
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Error messages**: Full error text
6. **Screenshots**: If UI issue
7. **Database query**: If data issue

### Useful Commands

```bash
# Check Node.js version
node --version

# Run tests
npm test

# Run linter
npm run lint

# Build project
npm run build

# Start dev server
npm run dev
```

---

## Related Documentation

- [Architecture Documentation](./members-table-architecture.md)
- [API Documentation](./api/members-api.md)
- [Project Guidelines](../CLAUDE.md)
