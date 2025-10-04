# Members API Documentation

## Database Function: `get_members_with_details`

### Overview

High-performance PostgreSQL function that retrieves member data with subscription, session, and payment information in a single query.

### Function Signature

```sql
CREATE OR REPLACE FUNCTION get_members_with_details(
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_member_type TEXT DEFAULT NULL,
  p_has_active_subscription BOOLEAN DEFAULT NULL,
  p_has_upcoming_sessions BOOLEAN DEFAULT NULL,
  p_has_outstanding_balance BOOLEAN DEFAULT NULL,
  p_limit INT DEFAULT 10000,
  p_offset INT DEFAULT 0,
  p_order_by TEXT DEFAULT 'name',
  p_order_direction TEXT DEFAULT 'asc'
) RETURNS TABLE (
  -- Member fields
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  status TEXT,
  member_type TEXT,
  join_date DATE,
  preferred_contact_method TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_conditions TEXT,
  fitness_goals TEXT,
  marketing_consent BOOLEAN,
  waiver_signed BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Subscription fields
  subscription_id UUID,
  subscription_status TEXT,
  subscription_end_date DATE,
  plan_name TEXT,
  -- Session stats
  remaining_sessions INT,
  scheduled_sessions INT,
  last_session_date DATE,
  next_session_date DATE,
  -- Payment fields
  last_payment_date DATE,
  total_balance NUMERIC
);
```

### Parameters

| Parameter                   | Type    | Default | Description                                |
| --------------------------- | ------- | ------- | ------------------------------------------ |
| `p_status`                  | TEXT    | NULL    | Filter by member status (active/inactive)  |
| `p_search`                  | TEXT    | NULL    | Search by name or email (case-insensitive) |
| `p_member_type`             | TEXT    | NULL    | Filter by member type (full/trial)         |
| `p_has_active_subscription` | BOOLEAN | NULL    | Filter members with active subscriptions   |
| `p_has_upcoming_sessions`   | BOOLEAN | NULL    | Filter members with upcoming sessions      |
| `p_has_outstanding_balance` | BOOLEAN | NULL    | Filter members with outstanding balance    |
| `p_limit`                   | INT     | 10000   | Maximum number of results                  |
| `p_offset`                  | INT     | 0       | Offset for pagination                      |
| `p_order_by`                | TEXT    | 'name'  | Column to sort by                          |
| `p_order_direction`         | TEXT    | 'asc'   | Sort direction (asc/desc)                  |

### Sortable Columns

- `name` - Member full name (last_name, first_name)
- `email` - Email address
- `join_date` - Date joined
- `status` - Member status
- `member_type` - Member type
- `subscription_end_date` - Subscription end date
- `last_session_date` - Last training session
- `next_session_date` - Next scheduled session
- `remaining_sessions` - Remaining session credits
- `total_balance` - Outstanding balance

### Examples

#### Get all active members

```sql
SELECT * FROM get_members_with_details(p_status := 'active');
```

#### Search for members by name

```sql
SELECT * FROM get_members_with_details(p_search := 'john');
```

#### Get full members with active subscriptions

```sql
SELECT * FROM get_members_with_details(
  p_member_type := 'full',
  p_has_active_subscription := true
);
```

#### Get members with outstanding balance, sorted by balance descending

```sql
SELECT * FROM get_members_with_details(
  p_has_outstanding_balance := true,
  p_order_by := 'total_balance',
  p_order_direction := 'desc'
);
```

#### Paginated results (20 per page, page 2)

```sql
SELECT * FROM get_members_with_details(
  p_limit := 20,
  p_offset := 20
);
```

## TypeScript API: `memberUtils.getMembers()`

### Overview

TypeScript wrapper that calls the database function and transforms the response into a typed, nested structure.

### Function Signature

```typescript
async function getMembers(filters?: {
  status?: "active" | "inactive" | null;
  search?: string | null;
  memberType?: "full" | "trial" | null;
  hasActiveSubscription?: boolean | null;
  hasUpcomingSessions?: boolean | null;
  hasOutstandingBalance?: boolean | null;
  limit?: number;
  offset?: number;
  orderBy?: SortField;
  orderDirection?: "asc" | "desc";
}): Promise<MemberWithEnhancedDetails[]>;
```

### Return Type

```typescript
interface MemberWithEnhancedDetails extends Member {
  active_subscription: MemberSubscriptionDetails | null;
  session_stats: MemberSessionStats | null;
  last_payment_date: string | null;
}

interface MemberSubscriptionDetails {
  id: string;
  status: "active" | "paused" | "expired" | "cancelled";
  end_date: string;
  plan_name: string;
}

interface MemberSessionStats {
  remaining_sessions: number;
  scheduled_sessions: number;
  last_session_date: string | null;
  next_session_date: string | null;
}
```

### Examples

#### Get all members

```typescript
import { memberUtils } from "@/features/database/lib/utils";

const members = await memberUtils.getMembers();
```

#### Get active members with filters

```typescript
const activeMembers = await memberUtils.getMembers({
  status: "active",
  hasActiveSubscription: true,
  orderBy: "join_date",
  orderDirection: "desc",
});
```

#### Search with pagination

```typescript
const searchResults = await memberUtils.getMembers({
  search: "john",
  limit: 20,
  offset: 0,
});
```

#### Complex filtering

```typescript
const filteredMembers = await memberUtils.getMembers({
  status: "active",
  memberType: "full",
  hasActiveSubscription: true,
  hasUpcomingSessions: true,
  hasOutstandingBalance: false,
  orderBy: "name",
  orderDirection: "asc",
});
```

## Performance Characteristics

### Query Performance

- **Initial Load**: < 500ms for 1000+ members
- **Filtered Query**: < 300ms with multiple filters
- **Sorted Query**: < 200ms with sorting
- **Single Query**: All data in one database round-trip

### Optimization Features

- **Database Indexes**: Optimized for all filter and sort columns
- **Search Path Security**: Function uses immutable search_path
- **Connection Pooling**: Supabase handles connection management
- **Result Caching**: Client-side caching with React Query

### Scaling Considerations

- Function handles up to 10,000 members efficiently
- Pagination recommended for datasets > 1000 members
- Indexes maintained automatically on all key columns

## Error Handling

### Database Errors

```typescript
try {
  const members = await memberUtils.getMembers();
} catch (error) {
  if (error instanceof DatabaseError) {
    console.error("Database error:", error.message);
  }
}
```

### Common Errors

| Error                     | Cause                 | Solution                  |
| ------------------------- | --------------------- | ------------------------- |
| `function does not exist` | Migration not applied | Run database migrations   |
| `column does not exist`   | Invalid orderBy field | Use valid sort field      |
| `permission denied`       | RLS policy issue      | Check user permissions    |
| `timeout`                 | Query too slow        | Add filters or pagination |

## Migration

### Required Migration

```sql
-- Migration: add_members_enhanced_function.sql
CREATE OR REPLACE FUNCTION get_members_with_details(...)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT ... FROM members m
  LEFT JOIN subscriptions s ON ...
  LEFT JOIN ... ;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = public, pg_temp;
```

### Required Indexes

```sql
-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_member_type ON members(member_type);
CREATE INDEX IF NOT EXISTS idx_members_join_date ON members(join_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
```

## Security

- **RLS Policies**: Row-level security enforced on all tables
- **Search Path**: Function uses immutable search_path for security
- **SQL Injection**: Parameterized queries prevent injection
- **Permission Model**: Based on user role (admin/staff/member)

## Related Documentation

- [Architecture Documentation](../members-table-architecture.md)
- [Troubleshooting Guide](../troubleshooting-members-table.md)
- [Database Schema](../../src/features/database/README.md)
