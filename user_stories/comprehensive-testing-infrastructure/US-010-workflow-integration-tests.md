# US-010: Workflow Integration Tests

**Phase**: Phase 3 - Integration Tests (Week 6)
**Priority**: P1 (Should Have)
**Estimated Effort**: 12 hours
**Dependencies**: US-001 (Infrastructure)

---

## User Story

**As a** developer
**I want** integration tests for complex multi-step workflows
**So that** form submissions, optimistic updates, and real-time features work correctly

---

## Business Value

Complex workflows span multiple components and database operations. Integration tests verify:

- Forms submit data correctly to backend
- Optimistic UI updates work as expected
- Error rollbacks restore correct state
- Real-time subscriptions update UI

**Impact**: Catches integration bugs that unit tests miss

---

## Detailed Acceptance Criteria

### AC1: Form Submission Workflows

- [ ] Test member creation form submits to Supabase and navigates
- [ ] Test payment form updates subscription balance
- [ ] Test subscription form creates member_subscription record
- [ ] Test form shows validation errors from backend
- [ ] Test form handles network errors gracefully

### AC2: Multi-Step Processes

- [ ] Test member → subscription → payment flow (end-to-end)
- [ ] Test subscription upgrade calculates and applies credit
- [ ] Test session booking decrements member session count
- [ ] Test session cancellation restores credits and updates status

### AC3: Optimistic UI Updates

- [ ] Test member list updates immediately on create (optimistic)
- [ ] Test member list rolls back on error
- [ ] Test payment balance updates immediately
- [ ] Test subscription status updates optimistically
- [ ] Test React Query cache invalidation after mutations

### AC4: Real-Time Updates (if implemented)

- [ ] Test session booking broadcast updates calendar
- [ ] Test payment notification appears for other users
- [ ] Test subscription cancellation updates member status
- [ ] Test channel cleanup on unmount

---

## Technical Implementation

```typescript
// src/features/members/__tests__/member-creation-workflow.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberForm } from '../components/MemberForm';
import { testSupabase } from '@/test/test-supabase';

describe('Member Creation Workflow', () => {
  it('should create member and redirect', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();

    render(<MemberForm onSuccess={mockNavigate} />);

    // Fill form
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@test.com');

    // Submit
    await user.click(screen.getByRole('button', { name: /create/i }));

    // Verify API call
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/\/members\/.+/)
      );
    });

    // Verify database record created
    const { data } = await testSupabase
      .from('members')
      .select()
      .eq('email', 'john@test.com')
      .single();

    expect(data).toBeDefined();
    expect(data.first_name).toBe('John');
  });

  it('should show backend validation errors', async () => {
    // Mock Supabase error
    vi.mocked(testSupabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' },
      }),
    } as any);

    render(<MemberForm />);

    // Fill and submit
    // ...

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });
});

// src/features/subscriptions/__tests__/subscription-upgrade-workflow.integration.test.ts
describe('Subscription Upgrade Workflow', () => {
  it('should calculate and apply credit correctly', async () => {
    // Create member with $50 plan (fully paid)
    const memberId = await createMemberWithSubscription({
      plan: { price: 50, sessions: 8 },
      paidAmount: 50,
    });

    // Upgrade to $100 plan
    const creditAmount = await upgradeSubscription({
      memberId,
      newPlanId: premiumPlanId,
    });

    // Verify credit applied
    expect(creditAmount).toBeGreaterThan(0);

    // Verify new subscription
    const { data: subscription } = await testSupabase
      .from('member_subscriptions')
      .select()
      .eq('member_id', memberId)
      .eq('status', 'active')
      .single();

    expect(subscription.paid_amount).toBe(creditAmount);
    expect(subscription.total_amount_snapshot).toBe(100);
  });
});

// src/features/training-sessions/__tests__/session-booking-workflow.integration.test.ts
describe('Session Booking Workflow', () => {
  it('should decrement member session count', async () => {
    const memberId = await createMemberWithSubscription({
      sessions: 12,
    });

    // Book session
    await bookSession({
      trainerId: trainer1Id,
      memberIds: [memberId],
      date: '2025-01-15',
    });

    // Verify session count decremented
    const { data: subscription } = await testSupabase
      .from('member_subscriptions')
      .select('remaining_sessions')
      .eq('member_id', memberId)
      .single();

    expect(subscription.remaining_sessions).toBe(11);
  });

  it('should restore credits on cancellation', async () => {
    const { sessionId, memberId } = await createBookedSession();

    // Cancel session
    await cancelSession(sessionId, 'Member sick');

    // Verify credits restored
    const { data } = await testSupabase
      .from('member_subscriptions')
      .select('remaining_sessions')
      .eq('member_id', memberId)
      .single();

    expect(data.remaining_sessions).toBe(12); // Restored from 11
  });
});
```

---

## Testing Requirements

1. **Use Test Database**: All integration tests use isolated test database
2. **Test Real Flows**: Don't mock Supabase calls
3. **Verify Side Effects**: Check database, cache, UI updates
4. **Clean Up**: Reset database between tests

---

## Definition of Done

- [ ] All 4 acceptance criteria met
- [ ] Form submission tests passing (5 tests)
- [ ] Multi-step workflow tests passing (4 tests)
- [ ] Optimistic update tests passing (5 tests)
- [ ] Real-time update tests passing (4 tests - if applicable)
- [ ] All tests pass in CI
- [ ] Code reviewed and approved

---

## Dependencies

**Requires**: US-001 (Infrastructure), US-003 through US-006 (Feature tests)
