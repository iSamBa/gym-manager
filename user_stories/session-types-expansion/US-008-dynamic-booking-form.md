# US-008: Dynamic Booking Form Integration

## User Story

**As a** gym administrator
**I want** a single booking form that adapts to each session type
**So that** I can efficiently book any type of session with appropriate fields

---

## Business Value

**Priority**: P0 (Must Have)
**Complexity**: Large
**Estimated Time**: 2.5 hours

### Impact

- Single unified booking experience
- Prevents booking errors
- Reduces training time for staff
- Enables all 7 session type workflows

---

## Acceptance Criteria

### AC-1: Session Type Selector Integration

- Replace RadioGroup with SessionTypeSelector component
- Grid layout with 7 color-coded buttons
- Selected type drives form behavior

### AC-2: Dynamic Form Sections

**Trial Session**:

- Shows TrialMemberRegistration component
- Hides MemberCombobox
- Creates member on submit

**Member/Make-Up Session**:

- Shows MemberCombobox (all members)
- No filtering

**Contractual Session**:

- Shows MemberCombobox (trial members only)
- Filters: `members.filter(m => m.member_type === 'trial')`

**Multi-Site Session**:

- Shows GuestSessionInfo (multi_site mode)
- Hides MemberCombobox

**Collaboration Session**:

- Shows GuestSessionInfo (collaboration mode)
- Hides MemberCombobox

**Non-Bookable Session**:

- Hides all member/guest sections
- Shows notes only

### AC-3: Form Submission Logic

- Trial: Create member first, then session
- Member/Contractual/Makeup: Create session with member_id
- Multi-site/Collaboration: Create session without member_id
- Non-bookable: Create session, no TSM record

### AC-4: Validation Feedback

- Real-time validation per session type
- Email uniqueness error (trial)
- Required field errors
- Submit button disabled when invalid

### AC-5: Error Handling

- Trial duplicate email: User-friendly message
- Network errors: Retry toast
- Success: Confirmation toast + close dialog

---

## Technical Implementation

**File**: `src/features/training-sessions/components/forms/SessionBookingDialog.tsx`

### Major Changes:

```typescript
import { SessionTypeSelector } from './SessionTypeSelector';
import { TrialMemberRegistration } from './TrialMemberRegistration';
import { GuestSessionInfo } from './GuestSessionInfo';
import {
  requiresMember,
  requiresTrialMember,
  isGuestSession,
  createsNewMember
} from '../../lib/type-guards';

export const SessionBookingDialog = memo<SessionBookingDialogProps>(
  function SessionBookingDialog({ open, onOpenChange, defaultValues }) {
    // ... existing setup

    const sessionType = watch("session_type");

    // Form submission handler
    const onSubmit = useCallback(
      async (data: BookingFormData) => {
        try {
          await createSessionMutation.mutateAsync(data);

          toast.success("Session booked successfully", {
            description: `${SESSION_TYPE_LABELS[data.session_type]} has been added to the schedule.`,
          });

          onOpenChange(false);
          reset();
        } catch (error) {
          const message = error instanceof Error
            ? error.message
            : "An unexpected error occurred.";

          toast.error("Failed to book session", {
            description: message,
          });
        }
      },
      [createSessionMutation, onOpenChange, reset]
    );

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] w-[90vw] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Book Training Session</DialogTitle>
            <DialogDescription>
              Select session type and provide required information
            </DialogDescription>
          </DialogHeader>

          {scheduledStart && <SessionLimitWarning date={selectedDate} />}

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Session Type Selector - REPLACES RadioGroup */}
              <FormField
                control={form.control}
                name="session_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Type *</FormLabel>
                    <FormControl>
                      <SessionTypeSelector
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Machine Selection (all types) */}
              <FormField
                control={form.control}
                name="machine_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      Machine *
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={machinesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a machine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {machines.map((machine) => (
                          <SelectItem
                            key={machine.id}
                            value={machine.id}
                            disabled={!machine.is_available}
                          >
                            {machine.name}
                            {!machine.is_available && (
                              <span className="text-muted-foreground ml-2">
                                (Unavailable)
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* DYNAMIC SECTIONS - Based on session type */}

              {/* Trial: Quick Registration */}
              {createsNewMember(sessionType) && (
                <TrialMemberRegistration form={form} />
              )}

              {/* Member/Contractual/Makeup: Member Selection */}
              {requiresMember(sessionType) && (
                <FormField
                  control={form.control}
                  name="member_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {requiresTrialMember(sessionType)
                          ? 'Trial Member *'
                          : 'Member *'}
                      </FormLabel>
                      <FormControl>
                        <MemberCombobox
                          members={
                            requiresTrialMember(sessionType)
                              ? members.filter(m => m.member_type === 'trial')
                              : members
                          }
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={membersLoading}
                          placeholder={
                            requiresTrialMember(sessionType)
                              ? 'Select a trial member'
                              : 'Select a member'
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Multi-Site/Collaboration: Guest Info */}
              {isGuestSession(sessionType) && sessionType !== 'non_bookable' && (
                <GuestSessionInfo form={form} sessionType={sessionType} />
              )}

              {/* Non-Bookable: Just a note */}
              {sessionType === 'non_bookable' && (
                <p className="text-sm text-muted-foreground p-4 rounded-lg border bg-red-50 dark:bg-red-950/20">
                  This is a time blocker. No member information is needed.
                  You can add optional notes below.
                </p>
              )}

              {/* Trainer Selection (all types - optional) */}
              <FormField
                control={form.control}
                name="trainer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Trainer{" "}
                      <span className="text-muted-foreground text-sm font-normal">
                        (Optional - assign later)
                      </span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? null : value)
                      }
                      value={field.value || "none"}
                      disabled={trainersLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign later" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Assign later</SelectItem>
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {formatTrainerName(trainer)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date/Time Fields (all types) */}
              {/* ... existing date/time pickers ... */}

              {/* Notes (all types) */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createSessionMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createSessionMutation.isPending ||
                    (sessionLimit && !sessionLimit.can_book)
                  }
                >
                  {createSessionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {sessionLimit && !sessionLimit.can_book
                    ? "Capacity Reached"
                    : createSessionMutation.isPending
                      ? "Booking..."
                      : "Book Session"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }
);
```

---

## Testing Requirements

### Component Tests

```typescript
describe('SessionBookingDialog - Dynamic Forms', () => {
  it('shows trial registration for trial sessions', () => {
    render(<SessionBookingDialog open={true} />);
    selectSessionType('trial');

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.queryByText(/select a member/i)).not.toBeInTheDocument();
  });

  it('shows member combobox for member sessions', () => {
    render(<SessionBookingDialog open={true} />);
    selectSessionType('member');

    expect(screen.getByText(/select a member/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
  });

  it('filters to trial members for contractual sessions', () => {
    const members = [
      { id: '1', member_type: 'trial', name: 'Trial Member' },
      { id: '2', member_type: 'full', name: 'Full Member' },
    ];

    render(<SessionBookingDialog open={true} members={members} />);
    selectSessionType('contractual');

    // Should only show trial member
    expect(screen.getByText(/trial member/i)).toBeInTheDocument();
    expect(screen.queryByText(/full member/i)).not.toBeInTheDocument();
  });

  it('shows guest fields for multi-site sessions', () => {
    render(<SessionBookingDialog open={true} />);
    selectSessionType('multi_site');

    expect(screen.getByLabelText(/guest first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/origin gym/i)).toBeInTheDocument();
    expect(screen.queryByText(/select a member/i)).not.toBeInTheDocument();
  });

  it('shows collaboration textarea for collaboration sessions', () => {
    render(<SessionBookingDialog open={true} />);
    selectSessionType('collaboration');

    expect(screen.getByLabelText(/collaboration details/i)).toBeInTheDocument();
    expect(screen.queryByText(/select a member/i)).not.toBeInTheDocument();
  });

  it('hides member section for non-bookable sessions', () => {
    render(<SessionBookingDialog open={true} />);
    selectSessionType('non_bookable');

    expect(screen.getByText(/time blocker/i)).toBeInTheDocument();
    expect(screen.queryByText(/select a member/i)).not.toBeInTheDocument();
  });

  it('submits trial session with member creation', async () => {
    // ... test form submission
  });
});
```

---

## Dependencies

**Depends On**: US-003, US-004, US-005, US-006, US-007 (All components and validation)
**Blocks**: None (Final story)

---

## Definition of Done

- [ ] SessionTypeSelector integrated
- [ ] RadioGroup removed
- [ ] Dynamic sections render correctly
- [ ] Trial registration workflow works
- [ ] Member filtering works (contractual)
- [ ] Guest sections render correctly
- [ ] Non-bookable shows proper message
- [ ] Form submission handles all types
- [ ] Email uniqueness check works
- [ ] Error messages user-friendly
- [ ] Success toasts show correct type
- [ ] All component tests passing
- [ ] Manual testing completed
- [ ] No TypeScript errors
- [ ] No console warnings

---

## Notes

**Complexity**: Large - touches main booking workflow
**Testing Priority**: High - critical path
**Manual Testing**: Test each session type end-to-end
