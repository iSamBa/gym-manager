# Database Indexes Documentation

## Overview

This document provides a comprehensive reference for all database indexes in the Gym Manager application. Indexes are critical for query performance, enabling fast data retrieval for filtering, sorting, and joining operations.

**Database**: PostgreSQL (Supabase)
**Total Indexes**: 95+ indexes across 18 tables
**Index Types**: B-tree (standard), GIN (full-text search), GiST (geometric/range queries)

## Index Strategy

Our indexing strategy follows these principles:

1. **Foreign Keys**: All foreign key columns are indexed for JOIN performance
2. **Status Fields**: Status columns are indexed for filtering (active, pending, cancelled, etc.)
3. **Date Columns**: Date/timestamp columns are indexed for range queries and sorting
4. **Search Operations**: Full-text search indexes using PostgreSQL GIN indexes
5. **Composite Indexes**: Multi-column indexes for common query patterns
6. **Partial Indexes**: Conditional indexes for frequently filtered subsets

## Performance Guidelines

### When to Use Indexes

✅ **Index these columns:**

- Foreign keys (all relationships)
- Status/enum fields (frequently filtered)
- Date/timestamp fields (sorting, range queries)
- Unique identifiers (email, invoice_number, receipt_number)
- Frequently joined columns
- Full-text search fields

❌ **Don't index these columns:**

- Columns with low cardinality (boolean with 50/50 distribution)
- Rarely queried columns
- Very small tables (<1000 rows)
- Columns updated frequently without read benefits

### Index Maintenance

PostgreSQL automatically maintains indexes, but periodic monitoring is recommended:

```sql
-- Check index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Table-by-Table Index Reference

### 1. Members Table

**Purpose**: Core member data with 111 active records

| Index Name                    | Type               | Columns                                             | Purpose                                          | Query Pattern                                                          |
| ----------------------------- | ------------------ | --------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| `members_pkey`                | B-tree (unique)    | `id`                                                | Primary key lookup                               | `WHERE id = ?`                                                         |
| `members_email_key`           | B-tree (unique)    | `email`                                             | Email uniqueness + login lookup                  | `WHERE email = ?`                                                      |
| `idx_members_status`          | B-tree             | `status`                                            | Filter by member status                          | `WHERE status = 'active'`                                              |
| `idx_members_member_type`     | B-tree             | `member_type`                                       | Filter by type (trial/full/collaboration)        | `WHERE member_type = 'trial'`                                          |
| `idx_members_status_type`     | B-tree (composite) | `status, member_type`                               | Combined status + type filtering                 | `WHERE status = 'active' AND member_type = 'full'`                     |
| `idx_members_join_date`       | B-tree             | `join_date DESC`                                    | Sort by join date (newest first)                 | `ORDER BY join_date DESC`                                              |
| `idx_members_email`           | B-tree             | `email`                                             | Email lookups (redundant with unique constraint) | `WHERE email = ?`                                                      |
| `idx_members_search`          | GIN                | `to_tsvector(first_name \|\| last_name \|\| email)` | Full-text search across name and email           | `WHERE to_tsvector(...) @@ plainto_tsquery(?)`                         |
| `idx_members_partnership_end` | B-tree (partial)   | `partnership_contract_end`                          | Collaboration contract expiration                | `WHERE member_type = 'collaboration' AND partnership_contract_end < ?` |

**Key Queries Optimized**:

- Member list with status/type filtering (main table view)
- Email uniqueness validation
- Full-text search across members
- Collaboration contract expiration monitoring
- Member join date sorting

**RPC Functions Using These Indexes**:

- `get_members_with_subscriptions()` - Uses status, type, and join_date indexes
- `search_members()` - Uses full-text search GIN index

---

### 2. Member Subscriptions Table

**Purpose**: Subscription lifecycle tracking (106 active records)

| Index Name                               | Type               | Columns             | Purpose                                      | Query Pattern                                   |
| ---------------------------------------- | ------------------ | ------------------- | -------------------------------------------- | ----------------------------------------------- |
| `member_subscriptions_pkey`              | B-tree (unique)    | `id`                | Primary key lookup                           | `WHERE id = ?`                                  |
| `idx_member_subscriptions_member`        | B-tree             | `member_id`         | All subscriptions for a member               | `WHERE member_id = ?`                           |
| `idx_member_subscriptions_status`        | B-tree             | `status`            | Filter by subscription status                | `WHERE status = 'active'`                       |
| `idx_member_subscriptions_member_status` | B-tree (composite) | `member_id, status` | Member's active subscription                 | `WHERE member_id = ? AND status = 'active'`     |
| `idx_member_subscriptions_end_date`      | B-tree (partial)   | `end_date DESC`     | Expiring subscriptions (active only)         | `WHERE status = 'active' AND end_date < ?`      |
| `idx_member_subscriptions_used_sessions` | B-tree             | `used_sessions`     | Find subscriptions by usage                  | `WHERE used_sessions < total_sessions_snapshot` |
| `idx_subscriptions_member`               | B-tree             | `member_id`         | Duplicate of idx_member_subscriptions_member | Legacy index                                    |
| `idx_subscriptions_status`               | B-tree             | `status`            | Duplicate of idx_member_subscriptions_status | Legacy index                                    |
| `idx_subscriptions_member_status`        | B-tree (composite) | `member_id, status` | Duplicate composite index                    | Legacy index                                    |
| `idx_subscriptions_end_date`             | B-tree             | `end_date`          | All subscriptions by end date                | `ORDER BY end_date`                             |

**Key Queries Optimized**:

- Get member's active subscription (most common query)
- Expiring subscriptions alert system
- Subscription usage tracking
- Member subscription history

**Performance Notes**:

- Partial index on `end_date` filters to active subscriptions only, reducing index size
- Composite `(member_id, status)` index enables index-only scans for active subscription checks
- Some duplicate indexes exist (legacy) - candidates for cleanup in future optimization

**RPC Functions**:

- `get_member_active_subscription()` - Uses member_status composite index
- `get_expiring_subscriptions()` - Uses end_date partial index

---

### 3. Subscription Payments Table

**Purpose**: Payment transaction records (229 records)

| Index Name                                      | Type                        | Columns                        | Purpose                           | Query Pattern                                                  |
| ----------------------------------------------- | --------------------------- | ------------------------------ | --------------------------------- | -------------------------------------------------------------- |
| `subscription_payments_pkey`                    | B-tree (unique)             | `id`                           | Primary key lookup                | `WHERE id = ?`                                                 |
| `subscription_payments_receipt_number_key`      | B-tree (unique)             | `receipt_number`               | Receipt lookup and uniqueness     | `WHERE receipt_number = ?`                                     |
| `idx_payments_member`                           | B-tree                      | `member_id`                    | All payments for a member         | `WHERE member_id = ?`                                          |
| `idx_payments_status`                           | B-tree                      | `payment_status`               | Filter by payment status          | `WHERE payment_status = 'completed'`                           |
| `idx_payments_date`                             | B-tree                      | `payment_date`                 | Sort/filter by payment date       | `WHERE payment_date BETWEEN ? AND ?`                           |
| `idx_payments_member_date`                      | B-tree (composite)          | `member_id, payment_date DESC` | Member's payment history          | `WHERE member_id = ? ORDER BY payment_date DESC`               |
| `idx_subscription_payments_member_date`         | B-tree (partial, composite) | `member_id, payment_date DESC` | Completed payments only           | `WHERE member_id = ? AND payment_status = 'completed'`         |
| `idx_subscription_payments_due_date`            | B-tree                      | `due_date`                     | Overdue payment alerts            | `WHERE due_date < CURRENT_DATE AND payment_status = 'pending'` |
| `idx_subscription_payments_status`              | B-tree                      | `payment_status`               | Duplicate of idx_payments_status  | Legacy index                                                   |
| `idx_subscription_payments_is_refund`           | B-tree                      | `is_refund`                    | Filter refund transactions        | `WHERE is_refund = true`                                       |
| `idx_subscription_payments_refunded_payment_id` | B-tree                      | `refunded_payment_id`          | Link refunds to original payments | `WHERE refunded_payment_id = ?`                                |

**Key Queries Optimized**:

- Member payment history (with date sorting)
- Receipt number lookup for PDF generation
- Overdue payment alerts
- Refund transaction tracking
- Payment status filtering

**Financial Reporting Queries**:

```sql
-- Monthly revenue (uses payment_date index)
SELECT DATE_TRUNC('month', payment_date), SUM(amount)
FROM subscription_payments
WHERE payment_status = 'completed'
GROUP BY DATE_TRUNC('month', payment_date);

-- Member payment summary (uses member_date composite index)
SELECT * FROM subscription_payments
WHERE member_id = ?
ORDER BY payment_date DESC
LIMIT 10;
```

---

### 4. Training Sessions Table

**Purpose**: Training session scheduling and tracking (603 sessions)

| Index Name                                   | Type                        | Columns                                                 | Purpose                                   | Query Pattern                                         |
| -------------------------------------------- | --------------------------- | ------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| `training_sessions_pkey`                     | B-tree (unique)             | `id`                                                    | Primary key lookup                        | `WHERE id = ?`                                        |
| `idx_sessions_trainer`                       | B-tree                      | `trainer_id`                                            | All sessions for a trainer                | `WHERE trainer_id = ?`                                |
| `idx_sessions_status`                        | B-tree                      | `status`                                                | Filter by session status                  | `WHERE status = 'scheduled'`                          |
| `idx_sessions_scheduled_start`               | B-tree                      | `scheduled_start`                                       | Sort sessions by start time               | `ORDER BY scheduled_start`                            |
| `idx_sessions_trainer_start`                 | B-tree (composite)          | `trainer_id, scheduled_start`                           | Trainer's schedule                        | `WHERE trainer_id = ? ORDER BY scheduled_start`       |
| `idx_training_sessions_calendar`             | B-tree (composite)          | `scheduled_start, scheduled_end, trainer_id, status`    | Calendar view optimization                | Multi-column filtering for calendar                   |
| `idx_training_sessions_session_type`         | B-tree                      | `session_type`                                          | Filter by type (trial/member/contractual) | `WHERE session_type = 'trial'`                        |
| `idx_training_sessions_status_date`          | B-tree (composite)          | `status, scheduled_start`                               | Scheduled sessions by date                | `WHERE status = 'scheduled' AND scheduled_start >= ?` |
| `idx_training_sessions_machine_id`           | B-tree                      | `machine_id`                                            | Sessions by machine                       | `WHERE machine_id = ?`                                |
| `idx_training_sessions_scheduled`            | B-tree (partial)            | `scheduled_start`                                       | Active/scheduled sessions only            | `WHERE status IN ('scheduled', 'in_progress')`        |
| `idx_training_sessions_trainer_schedule`     | B-tree (composite)          | `trainer_id, scheduled_start, scheduled_end`            | Conflict detection                        | Overlap checks for trainer availability               |
| `idx_training_sessions_guest_gym`            | B-tree (partial)            | `guest_gym_name`                                        | Multi-site sessions                       | `WHERE guest_gym_name IS NOT NULL`                    |
| `idx_training_sessions_counted_subscription` | B-tree                      | `counted_in_subscription_id`                            | Retroactive session counting              | `WHERE counted_in_subscription_id = ?`                |
| `idx_training_sessions_weekly_limit`         | B-tree (partial, composite) | `session_type, scheduled_start`                         | Weekly session limit enforcement          | Non-cancelled sessions for limit checks               |
| `prevent_session_overlap`                    | GiST                        | `machine_id, tstzrange(scheduled_start, scheduled_end)` | Prevent double-booking machines           | Range overlap detection                               |

**Key Queries Optimized**:

- Trainer weekly calendar view
- Session booking availability checks
- Machine double-booking prevention (GiST range index)
- Session type filtering (trial vs member)
- Weekly session limit enforcement

**Critical Performance Index**:
The `prevent_session_overlap` GiST index is critical for preventing double-bookings. It uses PostgreSQL's range type to efficiently check for overlapping time slots on the same machine.

```sql
-- Example: Check for conflicts (uses GiST index)
SELECT * FROM training_sessions
WHERE machine_id = ?
  AND tstzrange(scheduled_start, scheduled_end) && tstzrange(?, ?)
  AND status <> 'cancelled';
```

---

### 5. Training Session Members Table

**Purpose**: Links members to training sessions (594 bookings)

| Index Name                                          | Type                        | Columns                                   | Purpose                          | Query Pattern                                          |
| --------------------------------------------------- | --------------------------- | ----------------------------------------- | -------------------------------- | ------------------------------------------------------ |
| `training_session_members_pkey`                     | B-tree (unique)             | `id`                                      | Primary key lookup               | `WHERE id = ?`                                         |
| `training_session_members_session_id_member_id_key` | B-tree (unique, composite)  | `session_id, member_id`                   | Prevent duplicate bookings       | Unique constraint on booking                           |
| `idx_session_members_booking_status`                | B-tree (composite)          | `session_id, booking_status`              | Session attendance tracking      | `WHERE session_id = ? AND booking_status = 'attended'` |
| `idx_session_members_member_bookings`               | B-tree (composite)          | `member_id, booking_status, booking_date` | Member booking history           | `WHERE member_id = ? ORDER BY booking_date DESC`       |
| `idx_training_session_members_weekly_limit`         | B-tree (partial, composite) | `member_id, session_id`                   | Weekly booking limit enforcement | Non-cancelled bookings only                            |

**Key Queries Optimized**:

- Member booking history
- Session attendance roster
- Duplicate booking prevention
- Weekly booking limits

**Weekly Limit Enforcement**:

```sql
-- Count member's bookings this week (uses partial index)
SELECT COUNT(*)
FROM training_session_members tsm
JOIN training_sessions ts ON ts.id = tsm.session_id
WHERE tsm.member_id = ?
  AND tsm.booking_status <> 'cancelled'
  AND ts.scheduled_start >= DATE_TRUNC('week', CURRENT_DATE)
  AND ts.scheduled_start < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week';
```

---

### 6. Subscription Plans Table

**Purpose**: Available subscription plan definitions (4 plans)

| Index Name                             | Type             | Columns                 | Purpose                  | Query Pattern                        |
| -------------------------------------- | ---------------- | ----------------------- | ------------------------ | ------------------------------------ |
| `subscription_plans_pkey`              | B-tree (unique)  | `id`                    | Primary key lookup       | `WHERE id = ?`                       |
| `idx_subscription_plans_collaboration` | B-tree (partial) | `is_collaboration_plan` | Collaboration plans only | `WHERE is_collaboration_plan = true` |

**Key Queries Optimized**:

- List active subscription plans
- Separate collaboration plans from regular plans

**Note**: Small table (4 rows) - indexes provide minimal performance benefit but support business logic separation.

---

### 7. User Profiles Table

**Purpose**: User authentication and profile data (6 users)

| Index Name                | Type            | Columns | Purpose                           | Query Pattern     |
| ------------------------- | --------------- | ------- | --------------------------------- | ----------------- |
| `user_profiles_pkey`      | B-tree (unique) | `id`    | Primary key lookup                | `WHERE id = ?`    |
| `user_profiles_email_key` | B-tree (unique) | `email` | Email uniqueness + authentication | `WHERE email = ?` |

**Key Queries Optimized**:

- User authentication by email
- Profile lookups by user ID

**Note**: Small table - indexes primarily enforce uniqueness constraints.

---

### 8. Trainers Table

**Purpose**: Trainer-specific profile data (5 trainers)

| Index Name                   | Type             | Columns         | Purpose                                  | Query Pattern                     |
| ---------------------------- | ---------------- | --------------- | ---------------------------------------- | --------------------------------- |
| `trainers_pkey`              | B-tree (unique)  | `id`            | Primary key lookup (FK to user_profiles) | `WHERE id = ?`                    |
| `idx_trainers_date_of_birth` | B-tree (partial) | `date_of_birth` | Age verification queries                 | `WHERE date_of_birth IS NOT NULL` |

**Key Queries Optimized**:

- Trainer profile lookups
- Age-related queries (certification expiration tracking)

---

### 9. Invoices Table

**Purpose**: Invoice generation and tracking (36 invoices)

| Index Name                    | Type            | Columns          | Purpose                          | Query Pattern              |
| ----------------------------- | --------------- | ---------------- | -------------------------------- | -------------------------- |
| `invoices_pkey`               | B-tree (unique) | `id`             | Primary key lookup               | `WHERE id = ?`             |
| `invoices_invoice_number_key` | B-tree (unique) | `invoice_number` | Invoice lookup and uniqueness    | `WHERE invoice_number = ?` |
| `invoices_payment_id_unique`  | B-tree (unique) | `payment_id`     | One invoice per payment          | `WHERE payment_id = ?`     |
| `idx_invoices_member_id`      | B-tree          | `member_id`      | Member's invoices                | `WHERE member_id = ?`      |
| `idx_invoices_status`         | B-tree          | `status`         | Filter by invoice status         | `WHERE status = 'issued'`  |
| `idx_invoices_issue_date`     | B-tree          | `issue_date`     | Sort by issue date               | `ORDER BY issue_date DESC` |
| `idx_invoices_payment_id`     | B-tree          | `payment_id`     | Link invoice to payment          | `WHERE payment_id = ?`     |
| `idx_invoices_invoice_number` | B-tree          | `invoice_number` | Redundant with unique constraint | Legacy index               |

**Key Queries Optimized**:

- Invoice lookup by number
- Member invoice history
- Invoice status filtering
- Payment-invoice linkage

---

### 10. Member Comments Table

**Purpose**: Member notes and alerts (64 comments)

| Index Name                      | Type             | Columns     | Purpose                   | Query Pattern                                             |
| ------------------------------- | ---------------- | ----------- | ------------------------- | --------------------------------------------------------- |
| `member_comments_pkey`          | B-tree (unique)  | `id`        | Primary key lookup        | `WHERE id = ?`                                            |
| `idx_member_comments_member_id` | B-tree           | `member_id` | All comments for a member | `WHERE member_id = ?`                                     |
| `idx_member_comments_due_date`  | B-tree (partial) | `due_date`  | Alert comments only       | `WHERE due_date IS NOT NULL AND due_date <= CURRENT_DATE` |

**Key Queries Optimized**:

- Member comment history
- Due date alerts (time-based notifications)

**Alert System**:
The partial index on `due_date` optimizes the alert system, only indexing comments that have due dates set.

```sql
-- Get active alerts (uses partial index)
SELECT * FROM member_comments
WHERE due_date IS NOT NULL
  AND due_date <= CURRENT_DATE
ORDER BY due_date;
```

---

### 11. Member Body Checkups Table

**Purpose**: HIPAA-sensitive health measurements (4 checkups)

| Index Name                      | Type                       | Columns                        | Purpose                         | Query Pattern                                    |
| ------------------------------- | -------------------------- | ------------------------------ | ------------------------------- | ------------------------------------------------ |
| `member_body_checkups_pkey`     | B-tree (unique)            | `id`                           | Primary key lookup              | `WHERE id = ?`                                   |
| `unique_member_checkup_date`    | B-tree (unique, composite) | `member_id, checkup_date`      | One checkup per member per date | Prevent duplicates                               |
| `idx_body_checkups_member_id`   | B-tree                     | `member_id`                    | All checkups for a member       | `WHERE member_id = ?`                            |
| `idx_body_checkups_date`        | B-tree                     | `checkup_date DESC`            | Sort by checkup date            | `ORDER BY checkup_date DESC`                     |
| `idx_body_checkups_member_date` | B-tree (composite)         | `member_id, checkup_date DESC` | Member's checkup timeline       | `WHERE member_id = ? ORDER BY checkup_date DESC` |

**Key Queries Optimized**:

- Member health tracking timeline
- Most recent checkup retrieval
- Checkup date uniqueness

**Privacy Note**: This table contains HIPAA-sensitive data. RLS policies restrict access to admins and trainers only.

---

### 12. Notifications Table

**Purpose**: System notification tracking (3 notifications)

| Index Name                     | Type            | Columns      | Purpose                     | Query Pattern                          |
| ------------------------------ | --------------- | ------------ | --------------------------- | -------------------------------------- |
| `notifications_pkey`           | B-tree (unique) | `id`         | Primary key lookup          | `WHERE id = ?`                         |
| `idx_notifications_member_id`  | B-tree          | `member_id`  | Member's notifications      | `WHERE member_id = ?`                  |
| `idx_notifications_type`       | B-tree          | `type`       | Filter by notification type | `WHERE type = 'subscription_expiring'` |
| `idx_notifications_created_at` | B-tree          | `created_at` | Sort by creation date       | `ORDER BY created_at DESC`             |

**Key Queries Optimized**:

- User notification feed
- Notification type filtering
- Chronological notification ordering

---

### 13. Realtime Notifications Table

**Purpose**: Real-time notification delivery (3 notifications)

| Index Name                           | Type            | Columns   | Purpose              | Query Pattern        |
| ------------------------------------ | --------------- | --------- | -------------------- | -------------------- |
| `realtime_notifications_pkey`        | B-tree (unique) | `id`      | Primary key lookup   | `WHERE id = ?`       |
| `idx_realtime_notifications_user_id` | B-tree          | `user_id` | User's notifications | `WHERE user_id = ?`  |
| `idx_realtime_notifications_read`    | B-tree          | `read`    | Unread notifications | `WHERE read = false` |

**Key Queries Optimized**:

- Unread notification badge count
- User notification stream

---

### 14. Machines Table

**Purpose**: Training machine tracking (3 machines)

| Index Name                    | Type            | Columns          | Purpose                             | Query Pattern              |
| ----------------------------- | --------------- | ---------------- | ----------------------------------- | -------------------------- |
| `machines_pkey`               | B-tree (unique) | `id`             | Primary key lookup                  | `WHERE id = ?`             |
| `machines_machine_number_key` | B-tree (unique) | `machine_number` | Machine number uniqueness (1, 2, 3) | `WHERE machine_number = ?` |

**Key Queries Optimized**:

- Machine lookup by number
- Machine availability checks

**Note**: Very small table (3 rows) - indexes primarily enforce business constraints.

---

### 15. Studio Settings Table

**Purpose**: Studio configuration with versioning (9 settings)

| Index Name                           | Type                       | Columns                          | Purpose                   | Query Pattern                  |
| ------------------------------------ | -------------------------- | -------------------------------- | ------------------------- | ------------------------------ |
| `studio_settings_pkey`               | B-tree (unique)            | `id`                             | Primary key lookup        | `WHERE id = ?`                 |
| `uq_setting_key_effective_from`      | B-tree (unique, composite) | `setting_key, effective_from`    | Version uniqueness        | One version per effective date |
| `idx_studio_settings_key`            | B-tree                     | `setting_key`                    | All versions of a setting | `WHERE setting_key = ?`        |
| `idx_studio_settings_active`         | B-tree (partial)           | `is_active`                      | Active settings only      | `WHERE is_active = true`       |
| `idx_studio_settings_effective_from` | B-tree                     | `effective_from DESC NULLS LAST` | Sort by effective date    | `ORDER BY effective_from DESC` |

**Key Queries Optimized**:

- Current active setting retrieval
- Setting version history
- Future-dated setting scheduling

**Versioning Pattern**:

```sql
-- Get current active setting value (uses multiple indexes)
SELECT setting_value
FROM studio_settings
WHERE setting_key = ?
  AND is_active = true
  AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
ORDER BY effective_from DESC NULLS LAST
LIMIT 1;
```

---

### 16. Studio Planning Settings Table

**Purpose**: Business configuration settings (1 row - singleton)

| Index Name                      | Type            | Columns  | Purpose                       | Query Pattern          |
| ------------------------------- | --------------- | -------- | ----------------------------- | ---------------------- |
| `studio_planning_settings_pkey` | B-tree (unique) | `id`     | Primary key lookup            | `WHERE id = ?`         |
| `idx_single_settings`           | B-tree (unique) | `(true)` | Enforce single row constraint | Prevents multiple rows |

**Key Queries Optimized**:

- Settings retrieval (always single row)

**Note**: The `idx_single_settings` index on constant `true` is a PostgreSQL pattern to enforce a singleton table (maximum 1 row).

---

### 17. Auto Inactivation Runs Table

**Purpose**: Audit log for automatic member inactivation (9 runs)

| Index Name                          | Type            | Columns       | Purpose            | Query Pattern          |
| ----------------------------------- | --------------- | ------------- | ------------------ | ---------------------- |
| `auto_inactivation_runs_pkey`       | B-tree (unique) | `id`          | Primary key lookup | `WHERE id = ?`         |
| `idx_auto_inactivation_runs_run_at` | B-tree          | `run_at DESC` | Sort by run date   | `ORDER BY run_at DESC` |

**Key Queries Optimized**:

- Recent inactivation runs
- Audit trail chronological ordering

---

### 18. Trainer Specializations Table

**Purpose**: Available trainer specialization types (16 specializations)

| Index Name                         | Type            | Columns | Purpose                        | Query Pattern    |
| ---------------------------------- | --------------- | ------- | ------------------------------ | ---------------- |
| `trainer_specializations_pkey`     | B-tree (unique) | `id`    | Primary key lookup             | `WHERE id = ?`   |
| `trainer_specializations_name_key` | B-tree (unique) | `name`  | Specialization name uniqueness | `WHERE name = ?` |

**Key Queries Optimized**:

- Specialization lookup by name
- All available specializations list

---

## Index Type Reference

### B-tree Indexes (Standard)

**Use Case**: Exact matches, range queries, sorting

**Examples**:

```sql
-- Exact match (uses B-tree efficiently)
WHERE status = 'active'

-- Range query (uses B-tree efficiently)
WHERE payment_date BETWEEN '2024-01-01' AND '2024-12-31'

-- Sorting (uses B-tree efficiently)
ORDER BY scheduled_start DESC
```

**Performance**: O(log n) lookups, excellent for ordered data

---

### GIN Indexes (Generalized Inverted Index)

**Use Case**: Full-text search, array containment, JSONB queries

**Example - Full-Text Search**:

```sql
-- Members full-text search (uses GIN index)
CREATE INDEX idx_members_search ON members
USING gin (to_tsvector('english', first_name || ' ' || last_name || ' ' || email));

-- Query
SELECT * FROM members
WHERE to_tsvector('english', first_name || ' ' || last_name || ' ' || email)
      @@ plainto_tsquery('english', 'john smith');
```

**Performance**: Excellent for pattern matching, slower updates than B-tree

---

### GiST Indexes (Generalized Search Tree)

**Use Case**: Geometric data, range types, spatial queries

**Example - Range Overlap Detection**:

```sql
-- Prevent session time overlaps (uses GiST index)
CREATE INDEX prevent_session_overlap ON training_sessions
USING gist (machine_id, tstzrange(scheduled_start, scheduled_end))
WHERE status <> 'cancelled';

-- Query for overlapping sessions
SELECT * FROM training_sessions
WHERE machine_id = ?
  AND tstzrange(scheduled_start, scheduled_end) && tstzrange(?, ?)
  AND status <> 'cancelled';
```

**Performance**: Optimized for range/geometric operations

---

## Composite Index Guidelines

### When to Use Composite Indexes

✅ **Good candidates for composite indexes:**

```sql
-- Frequently filtered together
WHERE member_id = ? AND status = 'active'
→ Index: (member_id, status)

-- Filter + Sort pattern
WHERE trainer_id = ? ORDER BY scheduled_start
→ Index: (trainer_id, scheduled_start)

-- Multiple equality conditions
WHERE status = 'scheduled' AND session_type = 'trial'
→ Index: (status, session_type)
```

❌ **Poor candidates:**

```sql
-- Different columns filtered independently
WHERE status = 'active' OR member_type = 'trial'
→ Use separate indexes

-- Low selectivity first column
WHERE is_active = true AND email = ?
→ Better: (email, is_active) or just (email)
```

### Column Order in Composite Indexes

**Rule**: Most selective column first, then filter/sort columns

**Example**:

```sql
-- ✅ Good: High selectivity first
(member_id, payment_date DESC)
-- member_id is unique per member, payment_date adds sorting

-- ❌ Bad: Low selectivity first
(payment_status, member_id)
-- payment_status has only ~5 values, not selective
```

---

## Partial Index Guidelines

### When to Use Partial Indexes

Partial indexes include only rows matching a WHERE condition, reducing index size and improving performance.

**Examples**:

```sql
-- Index only active subscriptions' end dates
CREATE INDEX idx_member_subscriptions_end_date
ON member_subscriptions(end_date DESC)
WHERE status = 'active';

-- Index only non-cancelled bookings for weekly limits
CREATE INDEX idx_training_session_members_weekly_limit
ON training_session_members(member_id, session_id)
WHERE booking_status <> 'cancelled';

-- Index only multi-site sessions
CREATE INDEX idx_training_sessions_guest_gym
ON training_sessions(guest_gym_name)
WHERE guest_gym_name IS NOT NULL;
```

**Benefits**:

- Smaller index size (faster updates, less storage)
- More focused query optimization
- Better cache hit rates

**Query Requirement**: Query WHERE clause must match or be more restrictive than the partial index condition.

---

## Index Monitoring and Optimization

### Check Index Usage

```sql
-- Find unused indexes (candidates for removal)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelid NOT IN (
    SELECT indexrelid FROM pg_index WHERE indisunique
  )
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Check Index Health

```sql
-- Check for bloated indexes (need REINDEX)
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Reindex When Needed

```sql
-- Reindex a single index (minimal downtime)
REINDEX INDEX CONCURRENTLY idx_members_search;

-- Reindex an entire table
REINDEX TABLE CONCURRENTLY members;
```

**When to Reindex**:

- After bulk data loads
- Significant table updates (>20% of rows)
- Index bloat detected
- Performance degradation over time

---

## Query Optimization Examples

### Example 1: Member List with Filtering

**Query**:

```sql
SELECT * FROM members
WHERE status = 'active'
  AND member_type = 'full'
ORDER BY join_date DESC
LIMIT 50;
```

**Indexes Used**:

- `idx_members_status_type` - Composite index for WHERE clause
- `idx_members_join_date` - For ORDER BY (if not covered by above)

**Optimization**: The composite index `(status, member_type)` handles the WHERE clause efficiently. Add `join_date DESC` to the composite for index-only scan:

```sql
CREATE INDEX idx_members_status_type_join_date
ON members(status, member_type, join_date DESC);
```

---

### Example 2: Trainer Weekly Schedule

**Query**:

```sql
SELECT * FROM training_sessions
WHERE trainer_id = ?
  AND scheduled_start >= '2024-01-22'
  AND scheduled_start < '2024-01-29'
  AND status <> 'cancelled'
ORDER BY scheduled_start;
```

**Indexes Used**:

- `idx_sessions_trainer_start` - Composite (trainer_id, scheduled_start)
- Can also use `idx_training_sessions_calendar` for multi-column optimization

**Performance**: Composite index provides efficient range scan with automatic sorting.

---

### Example 3: Expiring Subscriptions Alert

**Query**:

```sql
SELECT
    m.first_name,
    m.last_name,
    ms.end_date,
    ms.status
FROM member_subscriptions ms
JOIN members m ON m.id = ms.member_id
WHERE ms.status = 'active'
  AND ms.end_date <= CURRENT_DATE + INTERVAL '35 days'
ORDER BY ms.end_date;
```

**Indexes Used**:

- `idx_member_subscriptions_end_date` - Partial index on active subscriptions
- `members_pkey` - For JOIN

**Optimization**: The partial index perfectly matches the query pattern (active subscriptions with upcoming end dates).

---

### Example 4: Payment History

**Query**:

```sql
SELECT * FROM subscription_payments
WHERE member_id = ?
  AND payment_status = 'completed'
ORDER BY payment_date DESC
LIMIT 10;
```

**Indexes Used**:

- `idx_subscription_payments_member_date` - Partial composite index

**Performance**: This partial index is specifically optimized for this query pattern (completed payments sorted by date).

---

## Index Maintenance Checklist

### Monthly Tasks

- [ ] Review index usage statistics
- [ ] Identify unused indexes (idx_scan = 0)
- [ ] Check for duplicate indexes
- [ ] Monitor index sizes

### Quarterly Tasks

- [ ] Review query performance logs
- [ ] Analyze slow query patterns
- [ ] Consider new indexes for common queries
- [ ] Remove obsolete indexes

### After Major Changes

- [ ] REINDEX tables with bulk updates
- [ ] ANALYZE tables to update statistics
- [ ] Verify query plans still use indexes
- [ ] Test application performance

---

## Common Index Anti-Patterns

### 1. Over-Indexing

**Problem**: Too many indexes slow down INSERT/UPDATE operations

```sql
-- ❌ Redundant indexes
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_status_type ON members(status, member_type);
-- The second index can handle both queries
```

**Solution**: Remove redundant single-column indexes when composite exists.

---

### 2. Wrong Column Order in Composite Index

```sql
-- ❌ Low selectivity first
CREATE INDEX idx_bad ON members(status, email);
-- status has only 5 values

-- ✅ High selectivity first
CREATE INDEX idx_good ON members(email, status);
-- email is unique
```

---

### 3. Missing Indexes on Foreign Keys

```sql
-- ❌ No index on FK
ALTER TABLE member_subscriptions
ADD CONSTRAINT fk_member
FOREIGN KEY (member_id) REFERENCES members(id);

-- ✅ Always index FKs
CREATE INDEX idx_member_subscriptions_member
ON member_subscriptions(member_id);
```

---

### 4. Not Using Partial Indexes for Filtered Queries

```sql
-- ❌ Full index
CREATE INDEX idx_subscriptions_end_date
ON member_subscriptions(end_date);

-- ✅ Partial index (smaller, faster)
CREATE INDEX idx_subscriptions_end_date
ON member_subscriptions(end_date)
WHERE status = 'active';
```

---

## Future Index Considerations

### Potential Optimizations

1. **Member Search Performance**
   - Consider trigram index (pg_trgm) for fuzzy name searching
   - Current GIN full-text index works well for exact word matching

2. **Payment Analytics**
   - Consider materialized view for monthly revenue aggregations
   - Reduces need for complex date range queries

3. **Session Calendar**
   - Monitor `idx_training_sessions_calendar` usage
   - May need adjustment based on query patterns

4. **Cleanup Candidates**
   - Several duplicate indexes exist (legacy from migrations)
   - Safe to remove after verifying query plans

---

## Additional Resources

- **PostgreSQL Index Documentation**: <https://www.postgresql.org/docs/current/indexes.html>
- **Index Types Guide**: <https://www.postgresql.org/docs/current/indexes-types.html>
- **Query Performance**: <https://www.postgresql.org/docs/current/performance-tips.html>
- **Supabase Index Guide**: <https://supabase.com/docs/guides/database/postgres/indexes>

---

**Document Version**: 1.0
**Last Updated**: 2025-01-22
**Maintained By**: Development Team
**Review Schedule**: Quarterly
