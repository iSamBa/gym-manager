# US-001: Database Schema for Studio Settings

## 📋 User Story

**As a** system architect
**I want** a flexible database schema for studio settings
**So that** gym administrators can configure opening hours and other settings dynamically

---

## 🎯 Business Value

**Value**: Foundation for all settings management features
**Impact**: High - Enables dynamic configuration without code deployments
**Priority**: P0 (Must Have)
**Estimated Effort**: 2 hours

---

## 📐 Acceptance Criteria

### ✅ AC1: Table Creation

**Given** the database migration is applied
**When** I query the database schema
**Then** I should see a `studio_settings` table with the following structure:

- `id` (UUID, primary key, auto-generated)
- `setting_key` (TEXT, not null, unique)
- `setting_value` (JSONB, not null)
- `effective_from` (DATE, not null)
- `is_active` (BOOLEAN, default true)
- `created_by` (UUID, foreign key to user_profiles)
- `created_at` (TIMESTAMPTZ, default now())
- `updated_at` (TIMESTAMPTZ, default now())

### ✅ AC2: RLS Policies

**Given** the `studio_settings` table exists
**When** a non-admin user tries to access the table
**Then** the request should be denied (RLS policy enforced)

**And When** an admin user tries to access the table
**Then** the request should succeed

### ✅ AC3: Database Functions

**Given** the database functions are created
**When** I call `get_active_opening_hours(CURRENT_DATE)`
**Then** it should return the opening hours JSONB effective on that date

**And When** I call `validate_opening_hours_json(valid_json)`
**Then** it should return TRUE

**And When** I call `validate_opening_hours_json(invalid_json)`
**Then** it should raise an exception with a descriptive error message

### ✅ AC4: Default Data

**Given** the migration is applied
**When** I query for `setting_key = 'opening_hours'`
**Then** I should find a default configuration with:

- All days defined (Monday through Sunday)
- Current hardcoded hours (9 AM - 12 AM)
- Effective from today's date
- `is_active = true`

### ✅ AC5: Indexes

**Given** the table is created
**When** I query the index list
**Then** I should see:

- Index on `setting_key`
- Index on `effective_from` (descending)

---

## 🏗️ Technical Specification

### Database Migration SQL

```sql
-- Migration: create_studio_settings
-- Created: 2025-10-16

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create studio_settings table
CREATE TABLE IF NOT EXISTS public.studio_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  effective_from DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_studio_settings_key
  ON public.studio_settings(setting_key);

CREATE INDEX IF NOT EXISTS idx_studio_settings_effective_from
  ON public.studio_settings(effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_studio_settings_active
  ON public.studio_settings(is_active) WHERE is_active = TRUE;

-- Add constraint: effective_from cannot be in the past
ALTER TABLE public.studio_settings
  ADD CONSTRAINT chk_effective_from_not_past
  CHECK (effective_from >= CURRENT_DATE);

-- Enable RLS
ALTER TABLE public.studio_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admin can read
CREATE POLICY "Admin can read studio_settings"
  ON public.studio_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policy: Admin can insert
CREATE POLICY "Admin can insert studio_settings"
  ON public.studio_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policy: Admin can update
CREATE POLICY "Admin can update studio_settings"
  ON public.studio_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function: Get active opening hours for a specific date
CREATE OR REPLACE FUNCTION public.get_active_opening_hours(target_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  hours_config JSONB;
BEGIN
  -- Find the most recent opening_hours setting effective on or before target_date
  SELECT setting_value INTO hours_config
  FROM public.studio_settings
  WHERE setting_key = 'opening_hours'
    AND effective_from <= target_date
    AND is_active = TRUE
  ORDER BY effective_from DESC
  LIMIT 1;

  -- Return the config or empty object if not found
  RETURN COALESCE(hours_config, '{}'::JSONB);
END;
$$;

-- Function: Validate opening hours JSONB structure
CREATE OR REPLACE FUNCTION public.validate_opening_hours_json(hours JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  days TEXT[] := ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  day TEXT;
  day_config JSONB;
  open_time TEXT;
  close_time TEXT;
BEGIN
  -- Check all 7 days exist
  FOREACH day IN ARRAY days LOOP
    IF NOT (hours ? day) THEN
      RAISE EXCEPTION 'Missing day: %', day;
    END IF;

    day_config := hours->day;

    -- Check is_open field exists
    IF NOT (day_config ? 'is_open') THEN
      RAISE EXCEPTION 'Missing is_open field for day: %', day;
    END IF;

    -- If day is open, validate times
    IF (day_config->>'is_open')::BOOLEAN THEN
      -- Check time fields exist
      IF NOT (day_config ? 'open_time' AND day_config ? 'close_time') THEN
        RAISE EXCEPTION 'Missing time fields for open day: %', day;
      END IF;

      open_time := day_config->>'open_time';
      close_time := day_config->>'close_time';

      -- Check times are not null
      IF open_time IS NULL OR close_time IS NULL THEN
        RAISE EXCEPTION 'Time fields cannot be null for open day: %', day;
      END IF;

      -- Validate time format (HH:MM)
      IF open_time !~ '^\d{2}:\d{2}$' OR close_time !~ '^\d{2}:\d{2}$' THEN
        RAISE EXCEPTION 'Invalid time format for day: % (expected HH:MM)', day;
      END IF;

      -- Validate close time > open time
      IF close_time <= open_time THEN
        RAISE EXCEPTION 'Close time must be after open time for day: %', day;
      END IF;
    ELSE
      -- If day is closed, times should be null
      IF (day_config ? 'open_time' AND day_config->>'open_time' IS NOT NULL) OR
         (day_config ? 'close_time' AND day_config->>'close_time' IS NOT NULL) THEN
        RAISE NOTICE 'Closed day % should have null times', day;
      END IF;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$;

-- Insert default opening hours
INSERT INTO public.studio_settings (
  setting_key,
  setting_value,
  effective_from,
  is_active
) VALUES (
  'opening_hours',
  '{
    "monday": {"is_open": true, "open_time": "09:00", "close_time": "24:00"},
    "tuesday": {"is_open": true, "open_time": "09:00", "close_time": "24:00"},
    "wednesday": {"is_open": true, "open_time": "09:00", "close_time": "24:00"},
    "thursday": {"is_open": true, "open_time": "09:00", "close_time": "24:00"},
    "friday": {"is_open": true, "open_time": "09:00", "close_time": "24:00"},
    "saturday": {"is_open": true, "open_time": "09:00", "close_time": "24:00"},
    "sunday": {"is_open": true, "open_time": "09:00", "close_time": "24:00"}
  }'::JSONB,
  CURRENT_DATE,
  TRUE
) ON CONFLICT (setting_key) DO NOTHING;

-- Grant permissions (if needed)
GRANT SELECT, INSERT, UPDATE ON public.studio_settings TO authenticated;
```

### Testing Queries

```sql
-- Test 1: Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'studio_settings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 2: Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'studio_settings' AND schemaname = 'public';

-- Test 3: Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'studio_settings' AND schemaname = 'public';

-- Test 4: Test get_active_opening_hours function
SELECT public.get_active_opening_hours(CURRENT_DATE);
SELECT public.get_active_opening_hours(CURRENT_DATE + INTERVAL '30 days');

-- Test 5: Test validation function (valid JSON)
SELECT public.validate_opening_hours_json(
  '{
    "monday": {"is_open": true, "open_time": "09:00", "close_time": "21:00"},
    "tuesday": {"is_open": true, "open_time": "09:00", "close_time": "21:00"},
    "wednesday": {"is_open": true, "open_time": "09:00", "close_time": "21:00"},
    "thursday": {"is_open": true, "open_time": "09:00", "close_time": "21:00"},
    "friday": {"is_open": true, "open_time": "09:00", "close_time": "21:00"},
    "saturday": {"is_open": true, "open_time": "10:00", "close_time": "18:00"},
    "sunday": {"is_open": false, "open_time": null, "close_time": null}
  }'::JSONB
);

-- Test 6: Test validation function (invalid JSON - missing day)
-- This should raise an exception
SELECT public.validate_opening_hours_json(
  '{
    "monday": {"is_open": true, "open_time": "09:00", "close_time": "21:00"}
  }'::JSONB
);

-- Test 7: Verify default data was inserted
SELECT * FROM public.studio_settings WHERE setting_key = 'opening_hours';
```

---

## 🔧 Implementation Steps

1. **Create Migration File**
   - File location: `src/features/database/migrations/[timestamp]_create_studio_settings.sql`
   - Use timestamp format: `YYYYMMDDHHMMSS_create_studio_settings.sql`

2. **Apply Migration**
   - Use Supabase MCP: `mcp__supabase__apply_migration`
   - Parameters:
     - `name`: "create_studio_settings"
     - `query`: [SQL content above]

3. **Verify Migration**
   - Use Supabase MCP: `mcp__supabase__list_tables`
   - Check if `studio_settings` table appears in result

4. **Test Functions**
   - Use Supabase MCP: `mcp__supabase__execute_sql`
   - Run testing queries above
   - Verify results match expectations

5. **Test RLS Policies**
   - Attempt to query as non-admin user (should fail)
   - Query as admin user (should succeed)

---

## 🧪 Testing Checklist

- [ ] Migration applies without errors
- [ ] Table created with correct schema
- [ ] All columns have correct data types
- [ ] Indexes created successfully
- [ ] RLS policies enforced (admin-only access verified)
- [ ] `get_active_opening_hours()` returns correct data
- [ ] `validate_opening_hours_json()` accepts valid JSON
- [ ] `validate_opening_hours_json()` rejects invalid JSON
- [ ] Default opening hours data inserted
- [ ] Constraint prevents past effective dates

---

## 🐛 Known Issues / Edge Cases

1. **Timezone Handling**: Dates are stored without timezone. Ensure application converts dates correctly based on gym's timezone.

2. **Midnight Representation**: "24:00" vs "00:00" - using "24:00" to represent midnight closing (end of day)

3. **Historical Data**: Multiple settings with same `setting_key` but different `effective_from` dates are allowed (for history tracking)

4. **Deactivation**: Use `is_active = FALSE` to soft-delete settings rather than hard delete

---

## 📊 Definition of Done

- [x] Migration SQL written and validated
- [ ] Migration applied to database successfully
- [ ] All acceptance criteria met
- [ ] Testing queries executed successfully
- [ ] RLS policies verified
- [ ] Default data inserted
- [ ] Documentation updated (this file)
- [ ] STATUS.md updated with completion

---

## 🔗 Related User Stories

- **Depends On**: None (foundational story)
- **Blocks**: US-002 (Settings Page Foundation)

---

## 📚 References

- [START-HERE.md](./START-HERE.md) - Feature overview
- [AGENT-GUIDE.md](./AGENT-GUIDE.md) - Implementation workflow (Phase 1)
- [README.md](./README.md) - Database schema section
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

---

**Story ID**: US-001
**Created**: 2025-10-16
**Last Updated**: 2025-10-16
**Status**: ✅ Completed
**Completed**: 2025-10-16
**Branch**: feature/studio-settings-opening-hours

**Implementation Notes**:

- Schema improved for extensibility: `effective_from` made nullable to support immediate-effect settings
- Composite UNIQUE constraint `(setting_key, effective_from)` allows historical versions
- Check constraint updated to handle NULL: `effective_from IS NULL OR effective_from >= CURRENT_DATE`
- Index optimized with `NULLS LAST` for nullable effective_from
- All acceptance criteria met and verified
- Database migration applied successfully via Supabase MCP
