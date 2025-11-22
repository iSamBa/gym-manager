# Performance Benchmarks Documentation

## Overview

This document defines performance targets, measurement methodologies, and benchmarking procedures for the Gym Manager application. These benchmarks ensure the application meets production quality standards and provides an excellent user experience.

**Application**: Gym Manager (Next.js 15.5 + React 19)
**Last Updated**: 2025-01-22
**Benchmark Environment**: Production-like conditions (Vercel deployment or equivalent)

## Performance Philosophy

Our performance strategy follows these principles:

1. **User-Centric Metrics**: Focus on Core Web Vitals that impact user experience
2. **Real-World Conditions**: Benchmark with production data volumes and network conditions
3. **Continuous Monitoring**: Track performance over time, not just point-in-time measurements
4. **Progressive Enhancement**: Optimize critical paths first, then enhance
5. **Data-Driven Decisions**: Use metrics to guide optimization efforts

---

## Core Web Vitals Targets

### Overview

Core Web Vitals are Google's standardized metrics for measuring user experience. We track all six metrics:

| Metric   | Name                      | Target (Good) | Acceptable     | Poor     | Current |
| -------- | ------------------------- | ------------- | -------------- | -------- | ------- |
| **FCP**  | First Contentful Paint    | ≤ 1.8s        | 1.8s - 3.0s    | > 3.0s   | TBD     |
| **LCP**  | Largest Contentful Paint  | ≤ 2.5s        | 2.5s - 4.0s    | > 4.0s   | TBD     |
| **CLS**  | Cumulative Layout Shift   | ≤ 0.1         | 0.1 - 0.25     | > 0.25   | TBD     |
| **FID**  | First Input Delay         | ≤ 100ms       | 100ms - 300ms  | > 300ms  | TBD     |
| **TTFB** | Time to First Byte        | ≤ 800ms       | 800ms - 1800ms | > 1800ms | TBD     |
| **INP**  | Interaction to Next Paint | ≤ 200ms       | 200ms - 500ms  | > 500ms  | TBD     |

**Source**: [Web.dev Core Web Vitals](https://web.dev/vitals/)

---

### 1. First Contentful Paint (FCP)

**Definition**: Time from navigation start to when the first content is painted on screen.

**Target**: ≤ 1.8 seconds

**Measurement**:

```typescript
// Automatic via Web Vitals library (already configured)
import { onFCP } from "web-vitals";

onFCP((metric) => {
  console.log("FCP:", metric.value);
  // Reported to Sentry via monitoring.ts
});
```

**Optimization Strategies**:

- Server-side rendering (Next.js App Router)
- Minimize critical CSS
- Preload key resources
- Optimize fonts (use `next/font`)
- CDN for static assets

**Current Optimizations**:

- ✅ Using Next.js 15.5 App Router with React Server Components
- ✅ Tailwind CSS v4 (optimized CSS bundle)
- ✅ Next.js Font optimization (`next/font/google`)
- ✅ Static asset optimization via Turbopack

---

### 2. Largest Contentful Paint (LCP)

**Definition**: Time from navigation start to when the largest content element is painted.

**Target**: ≤ 2.5 seconds

**Measurement**:

```typescript
import { onLCP } from "web-vitals";

onLCP((metric) => {
  console.log("LCP:", metric.value);
  console.log("LCP Element:", metric.entries[0].element);
});
```

**Optimization Strategies**:

- Optimize images (use Next.js Image component)
- Implement lazy loading for below-fold content
- Use loading skeletons (already implemented)
- Minimize server response time
- Use CDN for large assets

**Current Optimizations**:

- ✅ Loading skeletons for all routes (US-002)
- ✅ Server-side data fetching (React Server Components)
- ✅ Dynamic imports for heavy libraries (US-007)
- ⚠️ Review Next.js Image usage (some components may use raw `<img>`)

**LCP Elements by Route**:
| Route | Likely LCP Element | Optimization Status |
|-------|-------------------|---------------------|
| `/` (Dashboard) | Dashboard stats cards | ✅ Optimized with skeletons |
| `/members` | Members table | ✅ LoadingSkeleton + pagination |
| `/trainers` | Trainers table | ✅ LoadingSkeleton + pagination |
| `/payments` | Payments table | ✅ LoadingSkeleton + server filtering |
| `/training-sessions` | Calendar view | ⚠️ Review calendar component size |

---

### 3. Cumulative Layout Shift (CLS)

**Definition**: Sum of all unexpected layout shifts during page load.

**Target**: ≤ 0.1

**Measurement**:

```typescript
import { onCLS } from "web-vitals";

onCLS((metric) => {
  console.log("CLS:", metric.value);
  console.log("Shifts:", metric.entries);
});
```

**Optimization Strategies**:

- Define image dimensions explicitly
- Reserve space for dynamic content
- Use skeletons for loading states
- Avoid inserting content above existing content
- Preload fonts to avoid FOIT/FOUT

**Current Optimizations**:

- ✅ LoadingSkeleton components match actual content dimensions
- ✅ Consistent layout structure (no above-fold injections)
- ✅ Next.js Font optimization (font swapping handled)

**Common CLS Issues to Monitor**:

- Dynamic tables without height reservation
- Lazy-loaded images without dimensions
- Font swapping (FOUT)
- Ads or embeds without size constraints

---

### 4. First Input Delay (FID)

**Definition**: Time from first user interaction to browser response.

**Target**: ≤ 100ms

**Measurement**:

```typescript
import { onFID } from "web-vitals";

onFID((metric) => {
  console.log("FID:", metric.value);
});
```

**Optimization Strategies**:

- Minimize main thread blocking
- Break up long tasks
- Use Web Workers for heavy computation
- Defer non-critical JavaScript
- Optimize event handlers

**Current Optimizations**:

- ✅ React.memo on large components (US-005)
- ✅ useCallback on event handlers (US-005)
- ✅ Dynamic imports for heavy libraries (US-007)
- ✅ No long-running synchronous operations

**Note**: FID is being replaced by INP (Interaction to Next Paint) as the primary interactivity metric.

---

### 5. Time to First Byte (TTFB)

**Definition**: Time from navigation start to first byte of response received.

**Target**: ≤ 800ms

**Measurement**:

```typescript
import { onTTFB } from "web-vitals";

onTTFB((metric) => {
  console.log("TTFB:", metric.value);
});
```

**Factors Affecting TTFB**:

- Server response time
- Database query performance
- Network latency
- CDN configuration

**Optimization Strategies**:

- Optimize database queries (use indexes)
- Enable server-side caching
- Use edge functions (Vercel Edge Runtime)
- CDN for static content
- Minimize server-side processing

**Current Optimizations**:

- ✅ Database indexes on all critical queries (see DATABASE-INDEXES.md)
- ✅ Server-side filtering/sorting (US-006)
- ✅ Next.js automatic static optimization
- ✅ Supabase connection pooling

**Database Query Performance Targets**:
| Query Type | Target | Acceptable | Poor |
|-----------|--------|------------|------|
| Simple lookup (by ID) | < 10ms | < 50ms | > 50ms |
| Filtered list (with index) | < 50ms | < 100ms | > 100ms |
| Complex JOIN (2-3 tables) | < 100ms | < 200ms | > 200ms |
| Aggregation query | < 150ms | < 300ms | > 300ms |

---

### 6. Interaction to Next Paint (INP)

**Definition**: Measures responsiveness by tracking all interactions and reporting the worst latency.

**Target**: ≤ 200ms

**Measurement**:

```typescript
import { onINP } from "web-vitals";

onINP((metric) => {
  console.log("INP:", metric.value);
  console.log("Interaction:", metric.entries);
});
```

**Optimization Strategies**:

- Optimize event handlers
- Reduce render complexity
- Use virtualization for long lists
- Debounce/throttle expensive operations
- Minimize re-renders

**Current Optimizations**:

- ✅ React.memo prevents unnecessary re-renders
- ✅ useCallback stabilizes event handlers
- ✅ Server-side filtering (reduces client computation)
- ⚠️ Virtual scrolling deferred (see US-008 notes)

---

## Route-Specific Performance Targets

### Dashboard Route (`/`)

**Load Time Target**: ≤ 2.0 seconds (complete interactive)

**Key Metrics**:
| Metric | Target | Notes |
|--------|--------|-------|
| FCP | ≤ 1.5s | Dashboard stats should appear quickly |
| LCP | ≤ 2.0s | Stats cards or first chart |
| CLS | ≤ 0.05 | Minimal layout shift |
| TTFB | ≤ 600ms | Server-side data fetching |

**Components**:

- Dashboard stats (4 metric cards)
- Monthly activity chart
- Recent sessions table
- Subscription metrics

**Optimizations**:

- ✅ Lazy-loaded charts (US-007)
- ✅ Dashboard skeleton loader
- ✅ Server components for data fetching
- ✅ Minimal client-side JavaScript

**Measurement**:

```bash
# Lighthouse CI
npx lighthouse http://localhost:3000/ --view

# Or using Chrome DevTools
# 1. Open DevTools
# 2. Lighthouse tab
# 3. Analyze page load
```

---

### Members Route (`/members`)

**Load Time Target**: ≤ 2.5 seconds (table rendered with first 50 rows)

**Key Metrics**:
| Metric | Target | Notes |
|--------|--------|-------|
| FCP | ≤ 1.8s | Table header and filters |
| LCP | ≤ 2.5s | Table with data |
| CLS | ≤ 0.1 | Table pagination may shift |
| TTFB | ≤ 800ms | Member list query |

**Data Volume**: 111 members (as of 2025-01-22)

**Query Performance Target**:

```sql
-- Target: < 100ms
SELECT * FROM members
WHERE status = 'active'
ORDER BY join_date DESC
LIMIT 50;
```

**Optimizations**:

- ✅ Server-side pagination (50 rows/page)
- ✅ Database indexes on status, join_date
- ✅ Loading skeleton during fetch
- ✅ React.memo on table components

**Scalability Test**: Performance should remain acceptable with 1000+ members.

---

### Trainers Route (`/trainers`)

**Load Time Target**: ≤ 2.0 seconds

**Key Metrics**:
| Metric | Target | Notes |
|--------|--------|-------|
| FCP | ≤ 1.5s | Trainers list header |
| LCP | ≤ 2.0s | Trainer cards/table |
| CLS | ≤ 0.1 | Grid layout should be stable |

**Data Volume**: 5 trainers (small dataset)

**Performance Notes**:

- Small dataset, performance should be excellent
- Calendar view may be more expensive (multiple queries)

---

### Payments Route (`/payments`)

**Load Time Target**: ≤ 2.5 seconds

**Key Metrics**:
| Metric | Target | Notes |
|--------|--------|-------|
| FCP | ≤ 1.8s | Payment filters and table header |
| LCP | ≤ 2.5s | Payment table with data |
| TTFB | ≤ 800ms | Payment list query with filters |

**Data Volume**: 229 payments

**Query Performance Target**:

```sql
-- Target: < 100ms
SELECT * FROM subscription_payments
WHERE payment_status = 'completed'
  AND payment_date BETWEEN ? AND ?
ORDER BY payment_date DESC
LIMIT 50;
```

**Optimizations**:

- ✅ Server-side filtering (US-006)
- ✅ Indexes on payment_date, payment_status
- ✅ Pagination
- ✅ React.memo on payment components

---

### Training Sessions Route (`/training-sessions`)

**Load Time Target**: ≤ 3.0 seconds (calendar view is complex)

**Key Metrics**:
| Metric | Target | Notes |
|--------|--------|-------|
| FCP | ≤ 2.0s | Calendar skeleton |
| LCP | ≤ 3.0s | Full calendar with sessions |
| TTFB | ≤ 1.0s | Weekly session query |

**Data Volume**: 603 sessions

**Query Performance Target**:

```sql
-- Target: < 150ms (JOIN with members, trainers)
SELECT
    ts.*,
    t.first_name as trainer_first_name,
    array_agg(m.first_name) as member_names
FROM training_sessions ts
LEFT JOIN trainers t ON t.id = ts.trainer_id
LEFT JOIN training_session_members tsm ON tsm.session_id = ts.id
LEFT JOIN members m ON m.id = tsm.member_id
WHERE ts.scheduled_start >= ?
  AND ts.scheduled_start < ?
GROUP BY ts.id, t.first_name;
```

**Optimizations**:

- ✅ Composite indexes for calendar queries
- ✅ Weekly data loading (not month)
- ⚠️ Review calendar component rendering performance

---

## Bundle Size Targets

### Overall Application

**Target**: All routes < 450 KB First Load JS

| Route                | Current Size | Target   | Status     |
| -------------------- | ------------ | -------- | ---------- |
| `/` (Dashboard)      | 357 KB       | < 400 KB | ✅ Pass    |
| `/members`           | 417 KB       | < 450 KB | ✅ Pass    |
| `/members/[id]`      | 489 KB       | < 500 KB | ⚠️ Monitor |
| `/trainers`          | ~400 KB      | < 450 KB | ✅ Pass    |
| `/payments`          | 430 KB       | < 450 KB | ✅ Pass    |
| `/training-sessions` | 445 KB       | < 450 KB | ✅ Pass    |

**Source**: `npm run build` output

**Measurement**:

```bash
# Build and analyze
npm run build

# With bundle analyzer
ANALYZE=true npm run build
```

### Chunk Analysis

**Shared Chunks Target**: < 200 KB for common libraries

| Chunk       | Purpose             | Target Size | Notes                       |
| ----------- | ------------------- | ----------- | --------------------------- |
| `framework` | React, Next.js core | < 100 KB    | Minimal, framework-provided |
| `main`      | App shell, routing  | < 80 KB     | Core application code       |
| `lib`       | Shared utilities    | < 50 KB     | Keep lean                   |
| `vendor`    | Third-party libs    | < 150 KB    | Monitor additions           |

**Heavy Libraries** (dynamically imported):

- `recharts` (charts) - ~100 KB
- `jsPDF` (PDF generation) - ~200 KB
- `date-fns` - ~20 KB (tree-shakeable)

---

## Database Performance Benchmarks

### Query Performance Targets

| Query Complexity         | Target  | Acceptable | Poor    | Optimization                 |
| ------------------------ | ------- | ---------- | ------- | ---------------------------- |
| Primary key lookup       | < 5ms   | < 10ms     | > 10ms  | Always indexed               |
| Single-table filter      | < 30ms  | < 50ms     | > 50ms  | Index on filter columns      |
| Simple JOIN (2 tables)   | < 50ms  | < 100ms    | > 100ms | Index FKs                    |
| Complex JOIN (3+ tables) | < 100ms | < 150ms    | > 150ms | Composite indexes            |
| Aggregation (COUNT, SUM) | < 100ms | < 200ms    | > 200ms | Indexes + materialized views |
| Full-text search         | < 150ms | < 300ms    | > 300ms | GIN indexes                  |

### Example Benchmarks

**Test Environment**: PostgreSQL 15 (Supabase), realistic data volumes

```sql
-- Benchmark 1: Member lookup by ID
-- Expected: < 5ms
EXPLAIN ANALYZE
SELECT * FROM members WHERE id = 'uuid-here';

-- Benchmark 2: Active members list
-- Expected: < 50ms
EXPLAIN ANALYZE
SELECT * FROM members
WHERE status = 'active'
ORDER BY join_date DESC
LIMIT 50;

-- Benchmark 3: Member with active subscription
-- Expected: < 100ms
EXPLAIN ANALYZE
SELECT
    m.*,
    ms.end_date,
    ms.remaining_sessions
FROM members m
LEFT JOIN member_subscriptions ms ON ms.member_id = m.id
WHERE m.id = 'uuid-here'
  AND ms.status = 'active';

-- Benchmark 4: Expiring subscriptions
-- Expected: < 100ms
EXPLAIN ANALYZE
SELECT
    m.first_name,
    m.last_name,
    ms.end_date,
    ms.remaining_sessions
FROM member_subscriptions ms
JOIN members m ON m.id = ms.member_id
WHERE ms.status = 'active'
  AND ms.end_date <= CURRENT_DATE + INTERVAL '35 days'
ORDER BY ms.end_date;
```

### Monitoring Query Performance

Use the monitoring utilities:

```typescript
import { trackQueryPerformance } from "@/lib/monitoring";

const start = performance.now();
try {
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("status", "active");

  trackQueryPerformance({
    query: "fetch_active_members",
    duration: performance.now() - start,
    status: "success",
    timestamp: Date.now(),
    tags: { table: "members", rows: data.length },
  });
} catch (error) {
  trackQueryPerformance({
    query: "fetch_active_members",
    duration: performance.now() - start,
    status: "error",
    timestamp: Date.now(),
    tags: { error: error.message },
  });
}
```

**Slow Query Threshold**: 500ms (automatically logged as warning)

---

## React Component Performance

### Re-render Benchmarks

**Target**: < 30% unnecessary re-renders

**Measurement Method**: React DevTools Profiler

**Test Procedure**:

1. Open React DevTools Profiler
2. Start recording
3. Perform user interaction (e.g., filter change)
4. Stop recording
5. Analyze component render flamegraph

**Target Metrics**:

- Components with React.memo: < 10% unnecessary re-renders
- Event handlers with useCallback: 0% identity changes
- Computed values with useMemo: Cache hits > 90%

### Component Render Time Targets

| Component Type                | Target Render Time | Notes                   |
| ----------------------------- | ------------------ | ----------------------- |
| Small component (< 50 LOC)    | < 10ms             | Input, Button, Card     |
| Medium component (50-200 LOC) | < 30ms             | Form section, Table row |
| Large component (> 200 LOC)   | < 100ms            | Full table, Calendar    |
| Page component                | < 200ms            | Complete route render   |

**Optimizations Applied** (US-005):

- ✅ React.memo on components > 500 lines
- ✅ useCallback on all event handlers
- ✅ useMemo for expensive computations
- ✅ Avoided inline object/array creation in props

---

## API Response Time Targets

### Supabase RPC Functions

| Function                         | Target  | Acceptable | Poor    | Notes            |
| -------------------------------- | ------- | ---------- | ------- | ---------------- |
| `get_members_with_subscriptions` | < 100ms | < 200ms    | > 200ms | Complex JOIN     |
| `get_member_active_subscription` | < 50ms  | < 100ms    | > 100ms | Single member    |
| `search_members`                 | < 150ms | < 300ms    | > 300ms | Full-text search |
| `get_trainer_schedule`           | < 100ms | < 200ms    | > 200ms | Weekly sessions  |
| `get_expiring_subscriptions`     | < 100ms | < 150ms    | > 150ms | Alert system     |

### REST API Endpoints (Next.js API Routes)

| Endpoint                      | Target  | Acceptable | Poor     | Notes           |
| ----------------------------- | ------- | ---------- | -------- | --------------- |
| `GET /api/members`            | < 200ms | < 400ms    | > 400ms  | With pagination |
| `POST /api/members`           | < 300ms | < 500ms    | > 500ms  | Create member   |
| `GET /api/payments`           | < 200ms | < 400ms    | > 400ms  | With filters    |
| `POST /api/invoices/generate` | < 500ms | < 1000ms   | > 1000ms | PDF generation  |

**Measurement**:

```typescript
import { trackPerformance } from "@/lib/monitoring";

export async function GET(request: Request) {
  const tracker = createPerformanceTracker("api_members_list");

  try {
    const members = await fetchMembers();
    tracker.end({ tags: { count: members.length } });
    return Response.json(members);
  } catch (error) {
    tracker.end({ tags: { error: "true" } });
    throw error;
  }
}
```

---

## Performance Testing Procedures

### 1. Lighthouse CI Testing

**Frequency**: Every production deployment

**Command**:

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run audit
lhci autorun --config=lighthouserc.json
```

**Configuration** (`lighthouserc.json`):

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/members",
        "http://localhost:3000/trainers",
        "http://localhost:3000/payments"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 300 }],
        "speed-index": ["error", { "maxNumericValue": 3000 }]
      }
    }
  }
}
```

---

### 2. Load Testing (Database)

**Tool**: PostgreSQL EXPLAIN ANALYZE

**Procedure**:

```sql
-- Enable timing
\timing on

-- Test query with realistic data
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM members
WHERE status = 'active'
ORDER BY join_date DESC
LIMIT 50;
```

**Metrics to Check**:

- Execution Time (should match targets)
- Planning Time (should be < 5ms)
- Index Usage (should use indexes, not Seq Scan)
- Buffers Hit vs Read (cache hit ratio > 95%)

---

### 3. User Interaction Testing

**Tool**: Chrome DevTools Performance Tab

**Procedure**:

1. Open Chrome DevTools > Performance
2. Click "Record"
3. Perform user interaction (e.g., filter members table)
4. Click "Stop"
5. Analyze timeline:
   - Main thread activity
   - JavaScript execution time
   - Re-renders
   - Network requests

**Target Metrics**:

- Main thread blocked time: < 50ms
- JavaScript execution: < 100ms per interaction
- Total interaction time: < 200ms (INP target)

---

### 4. Bundle Analysis

**Tool**: @next/bundle-analyzer

**Procedure**:

```bash
# Enable analyzer in next.config.ts (already configured)
ANALYZE=true npm run build

# Opens browser with bundle visualization
```

**What to Check**:

- Largest packages (consider alternatives)
- Duplicate dependencies (fix with aliasing)
- Unused code (check tree-shaking)
- Route-specific bundles (should be < 450 KB)

---

## Performance Monitoring Setup

### Web Vitals Reporting

**Implementation**: See `docs/MONITORING-SETUP.md` for complete Sentry configuration.

**Code Location**: `src/app/layout.tsx` (to be added)

```typescript
import { reportWebVital } from "@/lib/monitoring";

export function reportWebVitals(metric: NextWebVitalsMetric) {
  reportWebVital(metric);
}
```

### Database Query Monitoring

**Automatic logging for slow queries** (> 500ms):

```typescript
import { trackQueryPerformance } from "@/lib/monitoring";

// Wrapper for Supabase queries
async function monitoredQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const start = performance.now();
  try {
    const result = await queryFn();
    trackQueryPerformance({
      query: queryName,
      duration: performance.now() - start,
      status: "success",
      timestamp: Date.now(),
    });
    return result;
  } catch (error) {
    trackQueryPerformance({
      query: queryName,
      duration: performance.now() - start,
      status: "error",
      timestamp: Date.now(),
    });
    throw error;
  }
}
```

---

## Performance Regression Prevention

### Pre-Deployment Checklist

- [ ] Run `npm run build` - verify bundle sizes
- [ ] Run Lighthouse on key routes - verify Web Vitals
- [ ] Test with production data volumes
- [ ] Review slow query logs (if any)
- [ ] Check React DevTools Profiler for new components
- [ ] Verify no console.logs or debuggers in production code

### CI/CD Integration

**Automated checks on every PR**:

```yaml
# .github/workflows/performance.yml
name: Performance Check

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npx lhci autorun
      - name: Check bundle size
        run: |
          npm run build
          # Fail if any route > 500 KB
```

---

## Performance Improvement Tracking

### Before/After Measurements

When implementing optimizations, always measure impact:

**Template**:

```markdown
## Optimization: [Name]

**Before**:

- FCP: X.Xs
- LCP: X.Xs
- Bundle: XXX KB
- Query time: XXms

**After**:

- FCP: X.Xs (-X%)
- LCP: X.Xs (-X%)
- Bundle: XXX KB (-X KB)
- Query time: XXms (-X%)

**Implementation**: [Brief description]
```

**Example** (from US-007):

```markdown
## Optimization: Dynamic Chart Imports

**Before**:

- Dashboard bundle: 457 KB
- FCP: 2.1s

**After**:

- Dashboard bundle: 357 KB (-100 KB)
- FCP: 1.8s (-14%)

**Implementation**: Lazy-loaded recharts library with React.lazy()
```

---

## Common Performance Issues and Solutions

### Issue 1: Slow Initial Page Load

**Symptoms**: FCP > 2.5s, LCP > 3.5s

**Diagnosis**:

```bash
# Check bundle size
npm run build

# Run Lighthouse
npx lighthouse http://localhost:3000/ --view
```

**Solutions**:

- ✅ Use dynamic imports for heavy libraries
- ✅ Implement code splitting
- ✅ Optimize images (Next.js Image)
- ✅ Enable compression (gzip/brotli)
- ✅ Use CDN for static assets

---

### Issue 2: Layout Shift (High CLS)

**Symptoms**: CLS > 0.1

**Diagnosis**: Chrome DevTools > Performance > Experience section

**Solutions**:

- ✅ Define explicit dimensions for images
- ✅ Use loading skeletons
- ✅ Reserve space for dynamic content
- ✅ Avoid injecting content above existing content
- ✅ Preload fonts

---

### Issue 3: Slow Database Queries

**Symptoms**: TTFB > 1.5s, slow page transitions

**Diagnosis**:

```sql
-- Check query execution plan
EXPLAIN ANALYZE
[your query here];

-- Check missing indexes
SELECT * FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND idx_scan = 0;
```

**Solutions**:

- ✅ Add appropriate indexes (see DATABASE-INDEXES.md)
- ✅ Optimize query structure (avoid N+1)
- ✅ Use server-side pagination
- ✅ Implement caching for static data

---

### Issue 4: Excessive Re-renders

**Symptoms**: Laggy interactions, high INP

**Diagnosis**: React DevTools Profiler

**Solutions**:

- ✅ Use React.memo for expensive components
- ✅ Wrap event handlers in useCallback
- ✅ Use useMemo for computed values
- ✅ Avoid inline object/array creation in props

---

## Performance Budget

### Overall Budget

| Metric                | Budget   | Current | Status     |
| --------------------- | -------- | ------- | ---------- |
| Total bundle size     | < 500 KB | ~450 KB | ✅ Pass    |
| Initial JS download   | < 200 KB | TBD     | 🔄 Monitor |
| Page load time (FCP)  | < 1.8s   | TBD     | 🔄 Monitor |
| Time to Interactive   | < 3.5s   | TBD     | 🔄 Monitor |
| Database queries/page | < 5      | TBD     | 🔄 Monitor |

### Route-Specific Budgets

| Route         | JS Budget | Load Time Budget | Notes               |
| ------------- | --------- | ---------------- | ------------------- |
| Dashboard     | < 400 KB  | < 2.5s           | Complex with charts |
| Members List  | < 450 KB  | < 2.5s           | Table with filters  |
| Member Detail | < 500 KB  | < 2.5s           | Rich profile page   |
| Trainers      | < 400 KB  | < 2.0s           | Simpler page        |
| Payments      | < 450 KB  | < 2.5s           | Table with filters  |
| Settings      | < 350 KB  | < 2.0s           | Form-heavy          |

**Budget Enforcement**: Fail CI/CD if budgets exceeded by > 10%

---

## Additional Resources

- **Web Vitals**: https://web.dev/vitals/
- **Next.js Performance**: https://nextjs.org/docs/advanced-features/measuring-performance
- **React Performance**: https://react.dev/learn/render-and-commit
- **Database Performance**: See `docs/DATABASE-INDEXES.md`
- **Monitoring Setup**: See `docs/MONITORING-SETUP.md`

---

**Document Version**: 1.0
**Last Updated**: 2025-01-22
**Review Schedule**: After major features, minimum quarterly
**Maintained By**: Development Team
