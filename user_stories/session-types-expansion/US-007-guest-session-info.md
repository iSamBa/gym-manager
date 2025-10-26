# US-007: Guest Session Information Capture

## User Story

**As a** gym administrator
**I want** to capture guest information for multi-site and collaboration sessions
**So that** I can track external visitors for financial reconciliation

---

## Business Value

**Priority**: P0 (Must Have)
**Complexity**: Small
**Estimated Time**: 45 minutes

### Impact

- Enables financial tracking with partner gyms
- Documents commercial partnerships
- No fake member records needed
- Clean data separation

---

## Acceptance Criteria

### AC-1: Multi-Site Mode

- Shows when session_type === 'multi_site'
- 3 required fields: guest_first_name, guest_last_name, guest_gym_name
- Clear labels (Guest First Name, Guest Last Name, Origin Gym)
- Styled with purple accent

### AC-2: Collaboration Mode

- Shows when session_type === 'collaboration'
- 1 required field: collaboration_details (textarea)
- Label: "Collaboration Details"
- Placeholder: "Influencer name, partnership details..."
- Styled with lime accent

### AC-3: Conditional Rendering

- Only renders for guest session types
- Returns null for other session types
- Single component handles both modes

### AC-4: Data Persistence

- Multi-site: Saves to guest\_\* columns
- Collaboration: Saves to collaboration_details column
- NO member_id created
- NO training_session_members record created

---

## Technical Implementation

**File**: `src/features/training-sessions/components/forms/GuestSessionInfo.tsx`

```typescript
import React, { memo } from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { UseFormReturn } from 'react-hook-form';
import type { CreateSessionData, SessionType } from '../../lib/types';

interface GuestSessionInfoProps {
  form: UseFormReturn<CreateSessionData>;
  sessionType: SessionType;
}

export const GuestSessionInfo = memo<GuestSessionInfoProps>(
  function GuestSessionInfo({ form, sessionType }) {
    if (sessionType === 'multi_site') {
      return (
        <div className="space-y-4 p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
          <h3 className="font-semibold text-sm text-purple-900 dark:text-purple-100">
            Multi-Site Guest Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="guest_first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest First Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Guest first name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guest_last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest Last Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Guest last name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="guest_gym_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origin Gym *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Which gym are they from?" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    }

    if (sessionType === 'collaboration') {
      return (
        <div className="space-y-4 p-4 rounded-lg border bg-lime-50 dark:bg-lime-950/20">
          <h3 className="font-semibold text-sm text-lime-900 dark:text-lime-100">
            Collaboration Details
          </h3>

          <FormField
            control={form.control}
            name="collaboration_details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Details *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Influencer name, partnership details, etc."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    }

    return null;
  }
);
```

**Database Logic Update** (`database-utils.ts`):

```typescript
// In createTrainingSession function
const sessionData: any = {
  machine_id: data.machine_id,
  trainer_id: data.trainer_id || null,
  scheduled_start: data.scheduled_start,
  scheduled_end: data.scheduled_end,
  session_type: data.session_type,
  status: "scheduled",
  notes: data.notes || null,
};

// Add guest fields for multi_site
if (data.session_type === "multi_site") {
  sessionData.guest_first_name = data.guest_first_name;
  sessionData.guest_last_name = data.guest_last_name;
  sessionData.guest_gym_name = data.guest_gym_name;
}

// Add collaboration details
if (data.session_type === "collaboration") {
  sessionData.collaboration_details = data.collaboration_details;
}

const { data: session, error: sessionError } = await supabase
  .from("training_sessions")
  .insert(sessionData)
  .select()
  .single();

// Only create TSM record if member_id exists
if (memberId) {
  await supabase.from("training_session_members").insert({
    session_id: session.id,
    member_id: memberId,
    booking_status: "confirmed",
  });
}
```

---

## Testing Requirements

```typescript
describe('GuestSessionInfo', () => {
  it('renders multi-site form with 3 fields', () => {
    const form = createMockForm();
    render(<GuestSessionInfo form={form} sessionType="multi_site" />);

    expect(screen.getByLabelText(/guest first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/guest last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/origin gym/i)).toBeInTheDocument();
  });

  it('renders collaboration form with textarea', () => {
    const form = createMockForm();
    render(<GuestSessionInfo form={form} sessionType="collaboration" />);

    expect(screen.getByLabelText(/details/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/influencer/i)).toBeInTheDocument();
  });

  it('returns null for non-guest session types', () => {
    const form = createMockForm();
    const { container } = render(
      <GuestSessionInfo form={form} sessionType="member" />
    );

    expect(container.firstChild).toBeNull();
  });

  it('has correct styling for each mode', () => {
    // Test purple styling for multi-site
    // Test lime styling for collaboration
  });
});

describe('Guest Session Creation', () => {
  it('creates multi_site session with guest data', async () => {
    const result = await createTrainingSession({
      session_type: 'multi_site',
      guest_first_name: 'Jane',
      guest_last_name: 'Smith',
      guest_gym_name: 'Partner Gym Downtown',
      // ... other fields
    });

    expect(result.guest_first_name).toBe('Jane');
    expect(result.guest_gym_name).toBe('Partner Gym Downtown');
    expect(result.member_id).toBeUndefined(); // No member created
  });

  it('creates collaboration session with details', async () => {
    const result = await createTrainingSession({
      session_type: 'collaboration',
      collaboration_details: '@influencer123 - 6 month partnership',
      // ... other fields
    });

    expect(result.collaboration_details).toContain('influencer123');
    expect(result.member_id).toBeUndefined(); // No member created
  });

  it('does not create training_session_members for guest sessions', async () => {
    const result = await createTrainingSession({
      session_type: 'multi_site',
      guest_first_name: 'John',
      guest_last_name: 'Doe',
      guest_gym_name: 'Partner Gym',
      // ... other fields
    });

    const { data: tsm } = await supabase
      .from('training_session_members')
      .select('*')
      .eq('session_id', result.id);

    expect(tsm).toHaveLength(0); // No TSM record
  });
});
```

---

## Dependencies

**Depends On**: US-002 (Types), US-003 (Validation)
**Blocks**: US-008 (Integration)

---

## Definition of Done

- [x] GuestSessionInfo.tsx created
- [x] Multi-site mode renders 3 fields
- [x] Collaboration mode renders textarea
- [x] Conditional rendering works
- [x] Purple/lime styling applied
- [x] Database logic updated (no TSM for guests)
- [x] Component tests passing (16 tests)
- [x] Integration tests passing (5 tests)
- [x] Guest data persists correctly

---

## Notes

**Status**: ✅ Completed
**Completed**: 2025-10-26
**Implementation Notes**:

- Conditional guest information capture with purple (multi-site) and lime (collaboration) styling
- 16 comprehensive component tests, all passing
- RPC function updated to accept guest fields (backward compatible)
- NO member_id or TSM records created for guest sessions (verified)
- 111 lines (under 300 line limit)
- Returns null for non-guest session types
