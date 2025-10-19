# US-011: Edge Cases and Error Scenario Testing

**Phase**: Phase 4 - Polish (Week 7)
**Priority**: P2 (Nice to Have)
**Estimated Effort**: 10 hours
**Dependencies**: US-001 through US-010 (All previous stories)

---

## User Story

**As a** developer
**I want** comprehensive tests for edge cases and error scenarios
**So that** the application handles unusual inputs and failures gracefully

---

## Business Value

Edge case testing catches bugs that only appear with unusual data or failure conditions. Without edge case tests:

- Application could crash with unexpected inputs
- Error messages could be unclear
- Network failures could leave inconsistent state
- Race conditions could cause data corruption

**Impact**: Improves application reliability and user experience

---

## Detailed Acceptance Criteria

### AC1: Boundary Value Tests

- [ ] Test empty strings in required fields
- [ ] Test maximum length strings (255+ characters)
- [ ] Test negative numbers where only positive allowed
- [ ] Test zero values in price fields
- [ ] Test decimal precision (e.g., $99.999)
- [ ] Test date edge cases (Feb 29 leap year, Dec 31, Jan 1)
- [ ] Test minimum/maximum session counts

### AC2: Network Failure Handling

- [ ] Test API timeout shows error message
- [ ] Test network disconnect during submission
- [ ] Test retry logic (exponential backoff)
- [ ] Test offline mode handling (if applicable)
- [ ] Test slow connection (loading states)

### AC3: Concurrency Tests

- [ ] Test two users editing same member simultaneously
- [ ] Test two admins booking same time slot
- [ ] Test race condition in session count decrement
- [ ] Test concurrent payment recordings
- [ ] Test optimistic locking prevents overwrites

### AC4: Data Validation Edge Cases

- [ ] Test SQL injection attempts blocked
- [ ] Test XSS attempts sanitized
- [ ] Test international characters (é, ñ, 中文)
- [ ] Test email with + symbol (user+tag@domain.com)
- [ ] Test phone numbers (international formats)
- [ ] Test very long member names

### AC5: Session/Auth Edge Cases

- [ ] Test expired session during form submission
- [ ] Test session expiry mid-operation
- [ ] Test multiple tabs logout synchronization
- [ ] Test auth refresh token expiry

---

## Technical Implementation

```typescript
// src/features/members/__tests__/boundary-values.test.tsx
describe('Member Form Boundary Values', () => {
  it('should reject empty first name', async () => {
    // Test
  });

  it('should handle very long names (255 chars)', async () => {
    const longName = 'A'.repeat(255);
    // Should truncate or show error
  });

  it('should handle international characters', async () => {
    await createMember({ name: 'José García 中文' });
    // Should store and display correctly
  });

  it('should validate email with + symbol', async () => {
    await createMember({ email: 'user+test@example.com' });
    // Should accept as valid
  });
});

// src/features/payments/__tests__/decimal-precision.test.ts
describe('Payment Decimal Precision', () => {
  it('should round $99.999 to $100.00', async () => {
    const payment = await recordPayment({ amount: 99.999 });
    expect(payment.amount).toBe(100.0);
  });

  it('should handle $0.01 payment', async () => {
    const payment = await recordPayment({ amount: 0.01 });
    expect(payment.amount).toBe(0.01);
  });
});

// src/features/subscriptions/__tests__/date-edge-cases.test.ts
describe('Subscription Date Edge Cases', () => {
  it('should handle leap year Feb 29', async () => {
    await createSubscription({
      startDate: '2024-02-29',
      duration: 30,
    });
    // Should calculate end date correctly
  });

  it('should handle year boundary (Dec 31 → Jan 1)', async () => {
    await createSubscription({
      startDate: '2024-12-20',
      duration: 30,
    });
    // End date should be 2025-01-19
  });
});

// src/__tests__/network-failures.integration.test.ts
describe('Network Failure Handling', () => {
  it('should show error on API timeout', async () => {
    // Mock timeout
    vi.mocked(supabase.from).mockImplementation(() => {
      return new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 100)
      );
    });

    render(<MemberForm />);
    // Fill and submit
    // Verify error toast appears
  });

  it('should retry failed requests', async () => {
    let attempts = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ data: {}, error: null });
    });

    await createMember({ name: 'John' });

    expect(attempts).toBe(3); // Retried 2 times
  });
});

// src/__tests__/concurrency.integration.test.ts
describe('Concurrency Handling', () => {
  it('should prevent double booking race condition', async () => {
    const trainerId = await createTrainer();

    // Simulate two simultaneous bookings
    const promise1 = bookSession({
      trainerId,
      date: '2025-01-15',
      startTime: '10:00',
    });

    const promise2 = bookSession({
      trainerId,
      date: '2025-01-15',
      startTime: '10:00',
    });

    const results = await Promise.allSettled([promise1, promise2]);

    // One should succeed, one should fail
    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
  });

  it('should use optimistic locking to prevent overwrites', async () => {
    const memberId = await createMember({ name: 'John', updatedAt: '2025-01-01T10:00:00Z' });

    // Two users edit simultaneously with old timestamp
    const update1 = updateMember({
      id: memberId,
      name: 'John Doe',
      updatedAt: '2025-01-01T10:00:00Z', // Old timestamp
    });

    const update2 = updateMember({
      id: memberId,
      name: 'John Smith',
      updatedAt: '2025-01-01T10:00:00Z', // Same old timestamp
    });

    const [result1, result2] = await Promise.allSettled([update1, update2]);

    // Second update should fail (stale data)
    expect(result2.status).toBe('rejected');
  });
});
```

---

## Testing Requirements

1. **Test Realistic Scenarios**: Use real-world edge cases (not just contrived examples)
2. **Document Edge Cases**: Add comments explaining why each test is important
3. **Fix Bugs Found**: If tests reveal bugs, fix them before marking story complete
4. **Add Tests to CI**: All edge case tests must run in CI

---

## Definition of Done

- [ ] All 5 acceptance criteria met
- [ ] Boundary value tests passing (7 tests)
- [ ] Network failure tests passing (5 tests)
- [ ] Concurrency tests passing (4 tests)
- [ ] Data validation tests passing (6 tests)
- [ ] Session/auth edge case tests passing (4 tests)
- [ ] All discovered bugs fixed
- [ ] Edge cases documented in test comments
- [ ] Tests pass in CI
- [ ] Code reviewed and approved

---

## Dependencies

**Requires**: All previous user stories (US-001 through US-010)
