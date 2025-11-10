# Production Readiness & Security Hardening - Technical Documentation

**Feature**: Comprehensive production readiness improvements
**Status**: In Planning
**Version**: 1.0.0
**Last Updated**: 2025-11-09

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technical Scope](#technical-scope)
4. [Security Improvements](#security-improvements)
5. [Database Optimizations](#database-optimizations)
6. [Performance Enhancements](#performance-enhancements)
7. [Monitoring & Operations](#monitoring--operations)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Plan](#deployment-plan)

---

## Overview

### Problem Statement

Current codebase analysis revealed a production readiness score of **78/100**, with critical gaps in:

- Security documentation and validation
- Database performance at scale
- Error handling and resilience
- Production monitoring and observability
- Bundle optimization

### Solution Approach

Systematic implementation across 8 user stories targeting:

1. **Security** - RLS documentation, input sanitization, env validation
2. **Database** - Indexes, query optimization, transactions
3. **Performance** - Bundle size, pagination, virtual scrolling
4. **Reliability** - Error handling, boundaries, monitoring
5. **Operations** - Deployment, monitoring, alerting

### Expected Outcomes

- **Production Readiness Score**: 78/100 → 95/100
- **Bundle Size**: 462 KB → <300 KB (35% reduction)
- **Query Performance**: Baseline → <100ms (10x improvement)
- **Error Coverage**: Partial → 100% (all mutations)
- **Monitoring**: None → Full (Sentry + Analytics)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js Application                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │  Middleware  │  │   API Layer  │  │
│  │              │  │              │  │              │  │
│  │  - React 19  │  │  - Auth      │  │  - Rate Limit│  │
│  │  - shadcn/ui │  │  - Logging   │  │  - Error Hdl │  │
│  │  - TanStack  │  │  - Metrics   │  │  - Validation│  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │          │
│         └─────────────────┴─────────────────┘          │
│                           │                            │
└───────────────────────────┼────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
         ┌──────▼──────┐        ┌──────▼──────┐
         │  Supabase   │        │  Monitoring │
         │             │        │             │
         │ - Postgres  │        │ - Sentry    │
         │ - Auth      │        │ - Analytics │
         │ - Storage   │        │ - Alerts    │
         │ - RLS       │        │ - Metrics   │
         └─────────────┘        └─────────────┘
```

### Data Flow - Optimized

**Before (Current)**:

```
User Request → Component → Hook → Database Query 1
                                → Database Query 2 (N+1!)
                                → Database Query 3 (N+1!)
                                → No Error Handling
                                → No Caching
```

**After (Optimized)**:

```
User Request → Component (React.memo)
            → Hook (useCallback)
            → Cached Query (stale-while-revalidate)
            → Single Optimized Query (with joins + indexes)
            → Error Boundary + onError Handler
            → Success Response + Analytics
```

---

## Technical Scope

### File Changes by Category

#### New Files to Create

```
src/lib/env.ts                          # Environment validation
src/lib/sanitize.ts                     # Input sanitization
src/app/members/[id]/error.tsx          # Error boundary
src/app/trainers/[id]/error.tsx         # Error boundary
src/app/subscriptions/[id]/error.tsx    # Error boundary
docs/RLS-POLICIES.md                    # Security documentation
docs/MONITORING.md                      # Operations guide
```

#### Files to Modify

**Database** (8-10 files):

```
src/features/database/lib/migrations/*  # New migrations
src/features/members/lib/database-utils.ts
src/features/payments/lib/database-utils.ts
src/features/training-sessions/lib/database-utils.ts
src/features/memberships/lib/subscription-utils.ts
```

**Hooks** (15-20 files):

```
src/features/members/hooks/use-members.ts
src/features/payments/hooks/use-payments.ts
src/features/training-sessions/hooks/use-training-sessions.ts
src/features/memberships/hooks/use-subscriptions.ts
# ... all hooks with useMutation (104 total)
```

**Components** (10-15 files):

```
src/features/payments/components/PaymentHistoryTable.tsx
src/features/memberships/components/SubscriptionTable.tsx
src/features/members/components/MemberTable.tsx
src/app/**/page.tsx  # Image optimization
```

**Configuration** (3-5 files):

```
next.config.ts        # Image optimization, monitoring
package.json          # New dependencies (DOMPurify, Sentry)
.env.example          # Document required env vars
```

---

## Security Improvements

### 1. Row Level Security (RLS) Documentation

**Affected Tables**:

- `members` - User profile data
- `user_profiles` - Authentication data
- `subscription_payments` - Financial data
- `member_subscriptions` - Membership data
- `training_sessions` - Booking data

**Implementation**:

```sql
-- Example RLS Policy
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

**Documentation Structure** (`docs/RLS-POLICIES.md`):

```markdown
# RLS Policies

## Table: members

- Policy: view_own_member
  - Who: Authenticated users
  - Action: SELECT
  - Rule: Can view own member record

## Table: subscription_payments

- Policy: view_own_payments
  - Who: Authenticated users
  - Action: SELECT
  - Rule: Can view own payment history
    ...
```

### 2. Input Sanitization

**Implementation** (`src/lib/sanitize.ts`):

```typescript
import DOMPurify from "dompurify";

export const sanitizeConfig = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li"],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

export function sanitizeHTML(dirty: string): string {
  if (typeof window === "undefined") return dirty; // Server-side
  return DOMPurify.sanitize(dirty, sanitizeConfig);
}

export function sanitizeText(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
```

**Usage**:

```typescript
// In comment/note components
const displayText = sanitizeHTML(member.notes);
const safeComment = sanitizeText(userInput);
```

### 3. Environment Validation

**Implementation** (`src/lib/env.ts`):

```typescript
import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),

  // Environment
  NODE_ENV: z.enum(["development", "production", "test"]),

  // Optional: Monitoring
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
});

// Usage: import { env } from '@/lib/env';
```

---

## Database Optimizations

### 1. Required Indexes

**Members Table**:

```sql
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_type ON members(member_type);
CREATE INDEX idx_members_join_date ON members(join_date);
CREATE INDEX idx_members_email ON members(email);
```

**Subscriptions Table**:

```sql
CREATE INDEX idx_subscriptions_member ON member_subscriptions(member_id);
CREATE INDEX idx_subscriptions_status ON member_subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON member_subscriptions(end_date);
```

**Payments Table**:

```sql
CREATE INDEX idx_payments_member ON subscription_payments(member_id);
CREATE INDEX idx_payments_date ON subscription_payments(payment_date);
CREATE INDEX idx_payments_status ON subscription_payments(payment_status);
```

**Training Sessions Table**:

```sql
CREATE INDEX idx_sessions_date_start ON training_sessions(session_date, start_time);
CREATE INDEX idx_sessions_trainer ON training_sessions(trainer_id);
```

### 2. Query Optimization Patterns

**Before (N+1 Problem)**:

```typescript
// BAD: Fetches members, then subscriptions separately
const members = await supabase.from("members").select("*");
for (const member of members.data) {
  const sub = await supabase
    .from("member_subscriptions")
    .select("*")
    .eq("member_id", member.id)
    .single();
  // N+1 queries!
}
```

**After (Optimized with Join)**:

```typescript
// GOOD: Single query with join
const { data } = await supabase
  .from("members")
  .select(
    `
    *,
    subscription:member_subscriptions!inner(
      id,
      status,
      end_date,
      remaining_sessions
    )
  `
  )
  .eq("subscription.status", "active");
```

### 3. Transaction Handling

**RPC Function** (Supabase):

```sql
CREATE OR REPLACE FUNCTION create_subscription_with_payment(
  p_member_id UUID,
  p_plan_id UUID,
  p_payment_amount DECIMAL,
  p_payment_method VARCHAR
)
RETURNS json AS $$
DECLARE
  v_subscription_id UUID;
  v_payment_id UUID;
  v_result json;
BEGIN
  -- Insert subscription
  INSERT INTO member_subscriptions (member_id, plan_id, status)
  VALUES (p_member_id, p_plan_id, 'active')
  RETURNING id INTO v_subscription_id;

  -- Insert payment
  INSERT INTO subscription_payments (
    member_id,
    subscription_id,
    amount,
    payment_method,
    payment_status
  )
  VALUES (
    p_member_id,
    v_subscription_id,
    p_payment_amount,
    p_payment_method,
    'completed'
  )
  RETURNING id INTO v_payment_id;

  -- Return result
  SELECT json_build_object(
    'subscription_id', v_subscription_id,
    'payment_id', v_payment_id,
    'success', true
  ) INTO v_result;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Rollback happens automatically
  RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

**Usage** (TypeScript):

```typescript
const { data, error } = await supabase.rpc("create_subscription_with_payment", {
  p_member_id: memberId,
  p_plan_id: planId,
  p_payment_amount: amount,
  p_payment_method: "credit_card",
});

if (error) {
  logger.error("Subscription creation failed", { error });
  throw new Error("Failed to create subscription");
}
```

---

## Performance Enhancements

### 1. Bundle Size Optimization

**Current State**:

- Largest route: 462 KB (`/members/[id]`)
- Average route: 350 KB
- Heavy libraries: jsPDF (400 KB), recharts (400 KB)

**Target State**:

- Maximum route: <300 KB
- Average route: <250 KB
- Dynamic imports for all heavy libraries

**Implementation**:

```typescript
// ❌ BAD: Adds to initial bundle
import jsPDF from 'jspdf';

// ✅ GOOD: Lazy loaded
const generatePDF = async (data) => {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  // ...
};

// ✅ GOOD: Component lazy loading
import dynamic from 'next/dynamic';

const ChartComponent = dynamic(
  () => import('@/components/analytics/Chart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);
```

### 2. Pagination Implementation

**Pattern**:

```typescript
export function usePayments(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ["payments", page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("subscription_payments")
        .select("*, member:members(first_name, last_name)", {
          count: "exact",
        })
        .range(from, to)
        .order("payment_date", { ascending: false });

      if (error) throw error;

      return {
        data,
        totalCount: count,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 3. Virtual Scrolling

**For lists >100 items**:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export function MemberVirtualList({ members }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: members.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Row height
    overscan: 5 // Pre-render 5 items
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <MemberRow member={members[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Monitoring & Operations

### 1. Sentry Error Tracking

**Configuration** (`next.config.ts`):

```typescript
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // ... existing config
};

export default withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: "your-org",
    project: "gym-manager",
  },
  {
    hideSourceMaps: true,
    disableLogger: true,
  }
);
```

**Client Setup** (`src/instrumentation.ts`):

```typescript
import * as Sentry from "@sentry/nextjs";

export function register() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
      beforeSend(event) {
        // Don't send dev errors
        if (process.env.NODE_ENV === "development") {
          return null;
        }
        return event;
      },
    });
  }
}
```

### 2. Performance Monitoring

**Key Metrics to Track**:

- First Contentful Paint (FCP) - Target: <1.5s
- Largest Contentful Paint (LCP) - Target: <2.5s
- Time to Interactive (TTI) - Target: <3.5s
- Cumulative Layout Shift (CLS) - Target: <0.1
- Database Query Time - Target: <100ms average

**Implementation**:

```typescript
// Track custom performance metrics
export function trackPerformance(metricName: string, value: number) {
  if (typeof window !== "undefined" && window.performance) {
    window.performance.mark(metricName);

    // Send to analytics
    Sentry.captureMessage(`Performance: ${metricName}`, {
      level: "info",
      extra: { value, timestamp: Date.now() },
    });
  }
}

// Usage
const startTime = performance.now();
const data = await fetchMembers();
const endTime = performance.now();
trackPerformance("members_fetch_time", endTime - startTime);
```

---

## Testing Strategy

### 1. Test Coverage Goals

| Type              | Current | Target |
| ----------------- | ------- | ------ |
| Unit Tests        | 88%     | 95%    |
| Integration Tests | 70%     | 90%    |
| E2E Tests         | 50%     | 80%    |

### 2. Critical Test Scenarios

**Security Tests**:

```typescript
describe("Input Sanitization", () => {
  it("should sanitize HTML in member notes", () => {
    const dirty = '<script>alert("xss")</script>Hello';
    const clean = sanitizeHTML(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).toContain("Hello");
  });

  it("should validate environment variables", () => {
    expect(() => {
      envSchema.parse({ NEXT_PUBLIC_SUPABASE_URL: "invalid" });
    }).toThrow();
  });
});
```

**Performance Tests**:

```typescript
describe("Database Query Performance", () => {
  it("should fetch members with subscriptions in <100ms", async () => {
    const start = performance.now();
    await fetchMembersWithSubscriptions();
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
  });
});
```

---

## Deployment Plan

### Phase 1: Security (Week 1)

1. Deploy RLS documentation
2. Apply environment validation
3. Add input sanitization
4. Security audit verification

### Phase 2: Database (Week 2)

1. Apply index migrations
2. Deploy RPC functions
3. Update query patterns
4. Performance benchmarking

### Phase 3: Optimization (Week 3)

1. Bundle size improvements
2. Error handling updates
3. Pagination implementation
4. Image optimization

### Phase 4: Production (Week 4)

1. Monitoring setup
2. Load testing
3. Final verification
4. Production deployment

---

**Last Updated**: 2025-11-09
**Status**: Ready for Implementation
