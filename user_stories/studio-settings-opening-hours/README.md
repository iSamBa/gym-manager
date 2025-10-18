# Studio Settings - Opening Hours Management

## Table of Contents

- [Feature Overview](#feature-overview)
- [Technical Architecture](#technical-architecture)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Frontend Components](#frontend-components)
- [Data Flow](#data-flow)
- [Integration Points](#integration-points)
- [Testing Strategy](#testing-strategy)
- [Performance Considerations](#performance-considerations)
- [Security](#security)
- [Future Enhancements](#future-enhancements)

---

## Feature Overview

### Purpose

Enable gym administrators to dynamically configure studio opening hours through a user-friendly interface, automatically affecting available session booking slots while preserving historical data integrity.

### Key Features

1. **Weekly Schedule Configuration**: Set different opening/closing times for each day
2. **Closed Day Management**: Mark specific days as unavailable
3. **Effective Date Scheduling**: Control when changes take effect
4. **Conflict Detection**: Prevent scheduling conflicts with existing bookings
5. **Dynamic Slot Generation**: Automatically adjust available booking times
6. **Historical Data Preservation**: Never modify past sessions

### Target Users

- **Primary**: Gym Administrators
- **Secondary**: System (automated session booking)

---

## Technical Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────┐
│                      Gym Management System                   │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐     ┌────────────┐ │
│  │   Settings   │      │   Training   │     │  Database  │ │
│  │     Page     │◄────►│   Sessions   │◄───►│  (Supabase)│ │
│  │              │      │              │     │            │ │
│  └──────────────┘      └──────────────┘     └────────────┘ │
│         │                     │                             │
│         │                     │                             │
│         └─────────┬───────────┘                             │
│                   │                                         │
│          ┌────────▼────────┐                                │
│          │ Conflict Check  │                                │
│          │   Service       │                                │
│          └─────────────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
StudioSettingsPage (Server Component)
  └─ StudioSettingsLayout (Client Component)
       └─ Tabs
            └─ OpeningHoursTab
                 ├─ WeeklyOpeningHoursGrid
                 │   ├─ BulkActionsToolbar
                 │   └─ DayOpeningHoursRow (x7)
                 │       ├─ Switch (is_open toggle)
                 │       ├─ TimePicker (open_time)
                 │       └─ TimePicker (close_time)
                 ├─ EffectiveDatePicker
                 ├─ EffectiveDatePreview
                 └─ ConflictDetectionDialog (conditional)
```

---

## Database Schema

### Table: `studio_settings`

```sql
CREATE TABLE public.studio_settings (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  effective_from DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_studio_settings_key ON public.studio_settings(setting_key);
CREATE INDEX idx_studio_settings_effective_from ON public.studio_settings(effective_from);

-- RLS Policies
ALTER TABLE public.studio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read studio_settings"
  ON public.studio_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can insert studio_settings"
  ON public.studio_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update studio_settings"
  ON public.studio_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### JSONB Structure: `opening_hours`

```json
{
  "monday": {
    "is_open": true,
    "open_time": "09:00",
    "close_time": "21:00"
  },
  "tuesday": {
    "is_open": true,
    "open_time": "09:00",
    "close_time": "21:00"
  },
  "wednesday": {
    "is_open": true,
    "open_time": "09:00",
    "close_time": "21:00"
  },
  "thursday": {
    "is_open": true,
    "open_time": "09:00",
    "close_time": "21:00"
  },
  "friday": {
    "is_open": true,
    "open_time": "09:00",
    "close_time": "21:00"
  },
  "saturday": {
    "is_open": true,
    "open_time": "10:00",
    "close_time": "18:00"
  },
  "sunday": {
    "is_open": false,
    "open_time": null,
    "close_time": null
  }
}
```

### Database Functions

#### `get_active_opening_hours(target_date DATE)`

Returns the opening hours configuration effective for the given date.

```sql
CREATE OR REPLACE FUNCTION get_active_opening_hours(target_date DATE)
RETURNS JSONB AS $$
DECLARE
  hours_config JSONB;
BEGIN
  SELECT setting_value INTO hours_config
  FROM public.studio_settings
  WHERE setting_key = 'opening_hours'
    AND effective_from <= target_date
    AND is_active = TRUE
  ORDER BY effective_from DESC
  LIMIT 1;

  RETURN COALESCE(hours_config, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql STABLE;
```

#### `validate_opening_hours_json(hours JSONB)`

Validates the structure of opening hours JSONB.

```sql
CREATE OR REPLACE FUNCTION validate_opening_hours_json(hours JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  days TEXT[] := ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  day TEXT;
  day_config JSONB;
BEGIN
  -- Check all days exist
  FOREACH day IN ARRAY days LOOP
    IF NOT (hours ? day) THEN
      RAISE EXCEPTION 'Missing day: %', day;
    END IF;

    day_config := hours->day;

    -- Validate structure
    IF NOT (day_config ? 'is_open') THEN
      RAISE EXCEPTION 'Missing is_open for day: %', day;
    END IF;

    -- If open, validate times
    IF (day_config->>'is_open')::BOOLEAN THEN
      IF NOT (day_config ? 'open_time' AND day_config ? 'close_time') THEN
        RAISE EXCEPTION 'Missing times for open day: %', day;
      END IF;

      -- Validate time format (HH:MM)
      IF NOT (day_config->>'open_time' ~ '^\d{2}:\d{2}$') OR
         NOT (day_config->>'close_time' ~ '^\d{2}:\d{2}$') THEN
        RAISE EXCEPTION 'Invalid time format for day: %', day;
      END IF;

      -- Validate close time > open time
      IF (day_config->>'close_time') <= (day_config->>'open_time') THEN
        RAISE EXCEPTION 'Close time must be after open time for day: %', day;
      END IF;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## API Endpoints

### Supabase Client Functions

#### `fetchStudioSettings(settingKey: string)`

```typescript
export async function fetchStudioSettings(settingKey: string) {
  const { data, error } = await supabase
    .from("studio_settings")
    .select("*")
    .eq("setting_key", settingKey)
    .eq("is_active", true)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}
```

#### `updateStudioSettings(settingKey, value, effectiveFrom)`

```typescript
export async function updateStudioSettings(
  settingKey: string,
  value: unknown,
  effectiveFrom: Date
) {
  const { data, error } = await supabase
    .from("studio_settings")
    .insert({
      setting_key: settingKey,
      setting_value: value,
      effective_from: effectiveFrom.toISOString().split("T")[0],
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

#### `getActiveOpeningHours(date: Date)`

```typescript
export async function getActiveOpeningHours(date: Date) {
  const { data, error } = await supabase.rpc("get_active_opening_hours", {
    target_date: date.toISOString().split("T")[0],
  });

  if (error) throw error;
  return data as OpeningHoursWeek;
}
```

---

## Frontend Components

### Component Specifications

#### `WeeklyOpeningHoursGrid`

**Purpose**: Main editor for weekly opening hours

**Props**:

```typescript
interface WeeklyOpeningHoursGridProps {
  value: OpeningHoursWeek;
  onChange: (value: OpeningHoursWeek) => void;
  disabled?: boolean;
}
```

**State**:

- `localValue` - Controlled component state
- `validationErrors` - Map of day → error message

**Performance**:

- Wrapped in `React.memo`
- `onChange` callback memoized with `useCallback`
- Validation memoized with `useMemo`

#### `DayOpeningHoursRow`

**Purpose**: Single day configuration row

**Props**:

```typescript
interface DayOpeningHoursRowProps {
  day: DayOfWeek;
  config: OpeningHoursDay;
  onChange: (config: OpeningHoursDay) => void;
  disabled?: boolean;
  error?: string;
}
```

**Layout**:

```
[Day Label] [Toggle] [Open Time Picker] [Close Time Picker]
  Mon       [✓]      [09:00]            [21:00]
```

**Validation**:

- Real-time: Close time must be > Open time
- Show error below row if validation fails

#### `ConflictDetectionDialog`

**Purpose**: Display booking conflicts before save

**Props**:

```typescript
interface ConflictDetectionDialogProps {
  open: boolean;
  conflicts: SessionConflict[];
  onClose: () => void;
}
```

**Display**:

- Conflict count: "Found X conflicting sessions"
- Table: Date | Time | Member | Machine
- Actions: "Cancel", "View Sessions"

---

## Data Flow

### Opening Hours Update Flow

```
1. User edits weekly grid
   ↓
2. Local state updates (controlled component)
   ↓
3. User selects effective date
   ↓
4. User clicks "Save Changes"
   ↓
5. useConflictDetection checks for conflicts
   ↓
6. If conflicts found:
   - Show ConflictDetectionDialog
   - Block save
   ↓
7. If no conflicts:
   - Call updateStudioSettings()
   - Invalidate React Query cache
   - Show success toast
   ↓
8. Training Sessions view auto-updates
```

### Session Booking Flow (After Integration)

```
1. User opens Training Sessions view
   ↓
2. MachineSlotGrid calls generateTimeSlots(date)
   ↓
3. generateTimeSlots queries getActiveOpeningHours(date)
   ↓
4. Extract day config from opening hours
   ↓
5. If day is closed → return []
   ↓
6. If day is open:
   - Calculate slots from open_time to close_time
   - Return array of TimeSlot objects
   ↓
7. MachineSlotGrid renders slots
```

---

## Integration Points

### Modified Files

| File                                                            | Change                                     | Impact                             |
| --------------------------------------------------------------- | ------------------------------------------ | ---------------------------------- |
| `src/features/training-sessions/lib/slot-generator.ts`          | Make `generateTimeSlots()` async, query DB | All components using this function |
| `src/features/training-sessions/components/MachineSlotGrid.tsx` | Add async handling                         | Session booking view               |
| `src/components/layout/sidebar.tsx`                             | Update Settings link (if needed)           | Navigation                         |

### New Files Created

```
src/features/settings/
├── components/
│   ├── StudioSettingsLayout.tsx
│   ├── OpeningHoursTab.tsx
│   ├── WeeklyOpeningHoursGrid.tsx
│   ├── DayOpeningHoursRow.tsx
│   ├── BulkActionsToolbar.tsx
│   ├── EffectiveDatePicker.tsx
│   ├── EffectiveDatePreview.tsx
│   ├── ConflictDetectionDialog.tsx
│   └── __tests__/
├── hooks/
│   ├── use-studio-settings.ts
│   ├── use-opening-hours.ts
│   ├── use-conflict-detection.ts
│   └── __tests__/
├── lib/
│   ├── types.ts
│   ├── settings-api.ts
│   ├── validation.ts
│   └── __tests__/
└── index.ts

src/app/settings/studio/
└── page.tsx
```

---

## Testing Strategy

### Unit Tests

**Coverage Target**: > 95%

**Test Files**:

- `settings-api.test.ts` - API functions
- `validation.test.ts` - Validation logic
- `use-studio-settings.test.ts` - Settings hook
- `use-conflict-detection.test.ts` - Conflict detection
- `WeeklyOpeningHoursGrid.test.tsx` - Grid component
- `DayOpeningHoursRow.test.tsx` - Row component

**Key Test Cases**:

- Valid opening hours configuration
- Invalid times (close before open)
- Closed days (times should be null)
- Bulk actions apply correctly
- Validation errors display
- Conflict detection accuracy

### Integration Tests

**Test Files**:

- `settings-flow.integration.test.tsx` - Full save workflow
- `conflict-resolution.integration.test.tsx` - Conflict handling
- `session-booking-integration.test.tsx` - Booking with new hours

**Scenarios**:

- Admin saves new hours → Sessions update
- Conflict detected → Save blocked
- Effective date in future → Sessions unchanged until date

### E2E Tests

**Tools**: Playwright (if available)

**User Flows**:

1. Login as admin
2. Navigate to Settings → Opening Hours
3. Edit hours for multiple days
4. Set effective date
5. Save changes
6. Navigate to Training Sessions
7. Verify slots match new hours

---

## Performance Considerations

### Optimization Strategies

#### 1. React Query Caching

```typescript
// Cache opening hours per day
const { data: openingHours } = useQuery({
  queryKey: ["opening-hours", date],
  queryFn: () => getActiveOpeningHours(date),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

#### 2. Memoization

```typescript
// Memoize slot generation
const timeSlots = useMemo(
  () => generateTimeSlots(selectedDate, openingHours),
  [selectedDate, openingHours]
);
```

#### 3. Component Optimization

```typescript
// Prevent unnecessary re-renders
export const DayOpeningHoursRow = memo(function DayOpeningHoursRow({
  day,
  config,
  onChange,
}) {
  const handleToggle = useCallback(() => {
    onChange({ ...config, is_open: !config.is_open });
  }, [config, onChange]);

  // ...
});
```

#### 4. Database Indexing

```sql
-- Fast lookup by effective date
CREATE INDEX idx_studio_settings_effective_from
  ON studio_settings(effective_from DESC);

-- Fast lookup by key
CREATE INDEX idx_studio_settings_key
  ON studio_settings(setting_key);
```

### Performance Targets

| Metric               | Target  | Current |
| -------------------- | ------- | ------- |
| Slot generation time | < 50ms  | TBD     |
| Settings page load   | < 500ms | TBD     |
| Save operation       | < 1s    | TBD     |
| Conflict check       | < 2s    | TBD     |
| Cache hit rate       | > 90%   | TBD     |

---

## Security

### Access Control

**Admin-Only Access**:

- RLS policies enforce admin role requirement
- Middleware checks auth before rendering settings page
- API calls validate user role on server-side

**RLS Policies**:

```sql
-- Only admins can read/write studio_settings
CREATE POLICY "Admin can manage studio_settings"
  ON public.studio_settings
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Data Validation

**Client-Side**:

- Time format validation (HH:MM)
- Close time > Open time
- Effective date ≥ Today

**Server-Side**:

- `validate_opening_hours_json()` function
- Check constraint on `effective_from` (not in past)
- JSONB schema validation

### Audit Trail

**Tracking**:

- `created_by` - Who created the setting
- `created_at` - When it was created
- `updated_at` - Last modification time

**Future Enhancement**:

- Full history table for all changes
- Diff viewer to compare versions

---

## Future Enhancements

### Planned Features (Not in Scope)

1. **Holiday/Exception Days**
   - Override specific dates (Christmas, New Year, etc.)
   - One-time closures or special hours

2. **Settings History**
   - View all past configurations
   - Compare versions side-by-side
   - Restore previous settings

3. **Multiple Time Windows Per Day**
   - Split shifts (e.g., 6-12 AM, 5-9 PM)
   - Lunch breaks

4. **Overnight Hours**
   - Support hours spanning midnight
   - 24-hour operations

5. **Additional Settings**
   - Currency & display format
   - Timezone configuration
   - Business info (name, address, logo)
   - Notification preferences
   - Payment gateway settings

6. **Audit Log UI**
   - Who changed what and when
   - Change reasons/notes
   - Approval workflow

### Extensibility Points

**How to add new settings**:

1. Define new `setting_key` (e.g., `"currency"`)
2. Create JSONB structure for that setting
3. Add new tab to `StudioSettingsLayout`
4. Build specialized editor component
5. Add validation logic
6. Update API types

**Example: Adding Currency Setting**

```typescript
// 1. Define type
interface CurrencySettings {
  code: string; // "USD", "EUR", etc.
  symbol: string; // "$", "€", etc.
  position: "before" | "after";
}

// 2. Insert to DB
await supabase.from("studio_settings").insert({
  setting_key: "currency",
  setting_value: { code: "USD", symbol: "$", position: "before" },
  effective_from: new Date(),
});

// 3. Create CurrencyTab component
// 4. Add to StudioSettingsLayout
```

---

## Glossary

| Term                | Definition                                 |
| ------------------- | ------------------------------------------ |
| **Opening Hours**   | Times when gym accepts bookings per day    |
| **Effective Date**  | Date from which new settings apply         |
| **Conflict**        | Existing session outside new opening hours |
| **Closed Day**      | Day marked as unavailable for bookings     |
| **Time Slot**       | 30-minute booking window                   |
| **Studio Settings** | Global gym configuration values            |

---

## References

- [START-HERE.md](./START-HERE.md) - Feature overview
- [AGENT-GUIDE.md](./AGENT-GUIDE.md) - Implementation workflow
- [STATUS.md](./STATUS.md) - Progress tracking
- [CLAUDE.md](../../CLAUDE.md) - Project coding standards
- User Stories: [US-001](./US-001-database-schema.md) through [US-007](./US-007-testing-edge-cases.md)

---

**Version**: 1.0
**Last Updated**: 2025-10-16
**Maintained By**: Development Team
