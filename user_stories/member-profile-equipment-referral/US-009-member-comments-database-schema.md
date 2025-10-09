# US-009: Member Comments Database Schema

**Epic:** Member Profile Enhancement - Equipment & Referral Tracking
**Story ID:** US-009
**Priority:** P0 (Must Have)
**Complexity:** Small (~30 minutes)
**Dependencies:** None
**Status:** ✅ COMPLETED
**Completed:** 2025-10-08
**Implementation Notes:** Database schema created via Supabase MCP tool. All constraints, indexes, RLS policies, and TypeScript types implemented successfully.

---

## 📝 User Story

**As a** gym administrator or trainer
**I want** a database table to store comments about members
**So that** we can track important notes, reminders, and alerts for each member

---

## 💼 Business Value

**Why This Matters:**

- **Communication:** Enables staff to leave notes and reminders about members
- **Accountability:** Tracks who wrote what and when
- **Alert System:** Supports time-based alerts for follow-ups
- **History:** Maintains a permanent record of important member interactions

**Impact:**

- Without this: No structured way to track member notes and alerts
- With this: Foundation for comments system and alert notifications

---

## ✅ Acceptance Criteria

### Database Table

- [x] **AC-001:** Table `member_comments` created with correct schema ✅ **VERIFIED** (Migration applied via Supabase MCP)

  ```sql
  CREATE TABLE member_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    due_date DATE NULL,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```

### Indexes

- [x] **AC-002:** Index on `member_id` for efficient member comment queries ✅ **VERIFIED** (SQL query confirmed)

  ```sql
  CREATE INDEX idx_member_comments_member_id ON member_comments(member_id);
  ```

- [x] **AC-003:** Index on `due_date` for efficient alert queries ✅ **VERIFIED** (Partial index with WHERE clause confirmed)

  ```sql
  CREATE INDEX idx_member_comments_due_date ON member_comments(due_date)
  WHERE due_date IS NOT NULL;
  ```

### Constraints

- [x] **AC-004:** Foreign key constraint on `member_id` ✅ **VERIFIED** (FK references members.id with ON DELETE CASCADE)
  - References `members.id`
  - ON DELETE CASCADE (if member deleted, delete their comments)

- [x] **AC-005:** Foreign key constraint on `created_by` ✅ **VERIFIED** (FK references user_profiles.id with ON DELETE SET NULL)
  - References `user_profiles.id`
  - ON DELETE SET NULL (preserve comment if user deleted)

- [x] **AC-006:** Check constraints ✅ **VERIFIED** (Tested: empty body rejected, valid body accepted)
  - `body` must not be empty: `CHECK (LENGTH(TRIM(body)) > 0)`
  - `author` must not be empty: `CHECK (LENGTH(TRIM(author)) > 0)`

### Triggers

- [x] **AC-007:** Automatic `updated_at` timestamp trigger ✅ **VERIFIED** (Tested: updated_at changed on UPDATE)

  ```sql
  CREATE TRIGGER update_member_comments_updated_at
    BEFORE UPDATE ON member_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  ```

### Row Level Security (RLS)

- [x] **AC-008:** RLS enabled on `member_comments` table ✅ **VERIFIED** (SQL query confirmed)

- [x] **AC-009:** Policy for SELECT ✅ **VERIFIED** (Admin/trainer-only policy confirmed)

  ```sql
  CREATE POLICY select_member_comments ON member_comments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'trainer')
      )
    );
  ```

- [x] **AC-010:** Policy for INSERT ✅ **VERIFIED** (Admin/trainer-only policy confirmed)

  ```sql
  CREATE POLICY insert_member_comments ON member_comments
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'trainer')
      )
    );
  ```

- [x] **AC-011:** Policy for UPDATE ✅ **VERIFIED** (Admin/trainer-only policy confirmed)

  ```sql
  CREATE POLICY update_member_comments ON member_comments
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'trainer')
      )
    );
  ```

- [x] **AC-012:** Policy for DELETE ✅ **VERIFIED** (Admin/trainer-only policy confirmed)

  ```sql
  CREATE POLICY delete_member_comments ON member_comments
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'trainer')
      )
    );
  ```

### TypeScript Types

- [x] **AC-013:** `MemberComment` interface added to `src/features/database/lib/types.ts` ✅ **VERIFIED** (types.ts:601-610)

  ```typescript
  export interface MemberComment {
    id: string;
    member_id: string;
    author: string;
    body: string;
    due_date?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
  }
  ```

- [x] **AC-014:** Export `MemberComment` from types file ✅ **VERIFIED** (Exported as public interface)

---

## 🎯 Implementation Guide

### Step 1: Create Migration File

```bash
# Create new migration file
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_add_member_comments_table.sql
```

### Step 2: Write Migration SQL

Use the MCP Supabase tool:

```javascript
await mcp__supabase__apply_migration({
  name: "add_member_comments_table",
  query: `
    -- Create member_comments table
    CREATE TABLE member_comments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      body TEXT NOT NULL,
      due_date DATE NULL,
      created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      -- Constraints
      CONSTRAINT check_body_not_empty CHECK (LENGTH(TRIM(body)) > 0),
      CONSTRAINT check_author_not_empty CHECK (LENGTH(TRIM(author)) > 0)
    );

    -- Indexes
    CREATE INDEX idx_member_comments_member_id ON member_comments(member_id);
    CREATE INDEX idx_member_comments_due_date ON member_comments(due_date)
    WHERE due_date IS NOT NULL;

    -- Trigger for updated_at
    CREATE TRIGGER update_member_comments_updated_at
      BEFORE UPDATE ON member_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    -- Enable RLS
    ALTER TABLE member_comments ENABLE ROW LEVEL SECURITY;

    -- RLS Policies
    CREATE POLICY select_member_comments ON member_comments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'trainer')
        )
      );

    CREATE POLICY insert_member_comments ON member_comments
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'trainer')
        )
      );

    CREATE POLICY update_member_comments ON member_comments
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'trainer')
        )
      );

    CREATE POLICY delete_member_comments ON member_comments
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'trainer')
        )
      );

    -- Add helpful comment
    COMMENT ON TABLE member_comments IS 'Stores comments and alerts for members, with optional due dates for time-based notifications';
    COMMENT ON COLUMN member_comments.due_date IS 'Optional due date - when set, comment appears as alert until this date';
  `,
});
```

### Step 3: Update TypeScript Types

File: `src/features/database/lib/types.ts`

```typescript
// Add after existing interfaces
export interface MemberComment {
  id: string;
  member_id: string;
  author: string;
  body: string;
  due_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
```

### Step 4: Verification

```sql
-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'member_comments'
ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'member_comments';

-- Verify RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'member_comments';

-- Test constraint
INSERT INTO member_comments (member_id, author, body)
VALUES ('test-uuid', '', 'Test body'); -- Should fail

-- Test successful insert
INSERT INTO member_comments (member_id, author, body)
VALUES (
  (SELECT id FROM members LIMIT 1),
  'Test Author',
  'Test comment body'
); -- Should succeed
```

---

## 🧪 Testing Checklist

- [x] Migration runs successfully without errors ✅
- [x] All indexes created ✅
- [x] All constraints working (empty body/author rejected) ✅
- [x] RLS policies applied correctly ✅
- [x] Foreign keys cascade properly ✅
- [x] Updated_at trigger fires on updates ✅
- [x] TypeScript types compile without errors ✅
- [x] Can insert valid comment ✅
- [x] Can query comments by member_id ✅
- [x] Can query comments by due_date ✅

---

## 📝 Notes

- Comments with `due_date` in the future will appear as alerts
- Comments with past `due_date` remain but don't show as alerts
- Deleting a member cascades to delete their comments
- Deleting a user preserves comments but nulls `created_by`
- Only admins and trainers can create/read/update/delete comments
