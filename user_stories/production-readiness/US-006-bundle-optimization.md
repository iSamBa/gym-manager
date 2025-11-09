# US-006: Bundle Size Optimization & Performance

**Status**: ⏳ Not Started
**Priority**: P1 (Should Have)
**Estimated Effort**: 8-10 hours
**Sprint**: Week 3 - Optimization

---

## 📖 User Story

**As a** end user
**I want** fast page loads and small bundle sizes
**So that** the application loads quickly even on slow connections

---

## 💼 Business Value

**Current**: Largest route 462 KB → **Target**: <300 KB (35% reduction)
**Impact**: Faster page loads, better mobile experience, lower bounce rates

---

## ✅ Acceptance Criteria

- [ ] All routes <300 KB First Load JS
- [ ] Heavy libraries (jsPDF, charts) dynamically imported
- [ ] Pagination added to payments table
- [ ] Pagination added to subscriptions table
- [ ] Virtual scrolling for member list (>100 items)
- [ ] All images use Next.js Image component
- [ ] Bundle analysis shows 30%+ size reduction

---

## 🔧 Implementation

### 1. Dynamic Imports

```typescript
// Chart components
const AnalyticsChart = dynamic(
  () => import('@/components/analytics/Chart'),
  { loading: () => <ChartSkeleton />, ssr: false }
);

// PDF generation (already done, verify)
const generatePDF = async (data) => {
  const { default: jsPDF } = await import('jspdf');
  // ...
};
```

### 2. Pagination

```typescript
// src/features/payments/hooks/use-payments.ts
export function usePayments(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ["payments", page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count } = await supabase
        .from("subscription_payments")
        .select("*, member:members(first_name, last_name)", { count: "exact" })
        .range(from, to)
        .order("payment_date", { ascending: false });

      return {
        data,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
      };
    },
  });
}
```

### 3. Virtual Scrolling

```bash
npm install @tanstack/react-virtual
```

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export function MemberVirtualList({ members }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: members.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div key={virtualRow.index} style={{ height: `${virtualRow.size}px` }}>
            <MemberRow member={members[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. Image Optimization

```typescript
import Image from 'next/image';

// Replace all <img> tags
<Image
  src={member.profile_picture_url}
  alt={member.name}
  width={40}
  height={40}
  loading="lazy"
/>
```

**next.config.ts**:

```typescript
const nextConfig = {
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
};
```

---

## 📊 Verification

```bash
# Before optimization
npm run build
# Note bundle sizes

# After optimization
npm run build
# Verify sizes reduced
```

---

## 🎯 Definition of Done

- [ ] Bundle size <300 KB per route
- [ ] Pagination working on all large tables
- [ ] Virtual scrolling implemented
- [ ] Images optimized
- [ ] Build analysis shows improvements
- [ ] STATUS.md updated

---

**Created**: 2025-11-09
**Estimated Time**: 8-10 hours
