# US-007: Trainers Feature Unit Tests

**Phase**: Phase 2 - Unit Test Coverage (Week 3)
**Priority**: P1 (Should Have)
**Estimated Effort**: 12 hours
**Dependencies**: US-001 (Infrastructure)

---

## User Story

**As a** developer
**I want** comprehensive unit tests for the trainers feature
**So that** trainer CRUD operations, analytics, and form validation work correctly

---

## Business Value

The trainers feature currently has **0% test coverage**, representing a significant gap. Without tests:

- Trainer creation/editing could break silently
- Analytics calculations could be incorrect
- Form validation could fail
- Business logic bugs could reach production

**Impact**: Increases trainers feature coverage from 0% to 85%+

---

## Detailed Acceptance Criteria

### AC1: useTrainers Hook Tests (src/features/trainers/hooks/**tests**/use-trainers.test.ts)

- [ ] Test fetches trainers with success
- [ ] Test handles fetch error gracefully
- [ ] Test filters trainers by status (active/inactive)
- [ ] Test searches trainers by name
- [ ] Test creates new trainer and updates cache
- [ ] Test updates trainer and refetches data
- [ ] Test deletes trainer and removes from cache
- [ ] Test pagination with infinite query
- [ ] Test optimistic updates on mutations

### AC2: TrainerForm Component Tests (src/features/trainers/components/**tests**/TrainerForm.test.tsx)

- [ ] Test renders all form fields
- [ ] Test validates required fields (first name, last name, email)
- [ ] Test validates email format
- [ ] Test validates phone format
- [ ] Test validates specializations (at least one required)
- [ ] Test submits form with valid data
- [ ] Test shows error toast on submission failure
- [ ] Test clears form after successful submission
- [ ] Test disabled submit button while submitting

### AC3: TrainerAnalytics Component Tests (src/features/trainers/components/**tests**/TrainerAnalytics.test.tsx)

- [ ] Test calculates total sessions correctly
- [ ] Test calculates sessions this month
- [ ] Test calculates active members count
- [ ] Test calculates average sessions per month
- [ ] Test renders chart with correct data points
- [ ] Test handles zero sessions gracefully
- [ ] Test filters by date range
- [ ] Test shows loading state while fetching

### AC4: Trainer Database Utils Tests (src/features/trainers/lib/**tests**/trainer-db-utils.test.ts)

- [ ] Test validateTrainerEmail checks for duplicates
- [ ] Test formatTrainerData transforms correctly
- [ ] Test calculateTrainerStats aggregates sessions
- [ ] Test getActiveTrainers filters by status
- [ ] Test getTrainerSchedule returns correct sessions
- [ ] Test handles database errors gracefully

### AC5: useTrainerSearch Hook Tests (src/features/trainers/hooks/**tests**/use-trainer-search.test.ts)

- [ ] Test debounces search input (waits 300ms)
- [ ] Test searches by name (first and last)
- [ ] Test searches by email
- [ ] Test searches by specialization
- [ ] Test clears results when search cleared
- [ ] Test handles empty results
- [ ] Test limits results to 10 items

### AC6: TrainerSpecializations Tests (src/features/trainers/lib/**tests**/specializations.test.ts)

- [ ] Test getAllSpecializations returns all options
- [ ] Test validateSpecialization checks valid options
- [ ] Test formatSpecializationLabel displays correctly
- [ ] Test groupSpecializations by category

---

## Technical Implementation

### Files to Create

#### 1. `src/features/trainers/hooks/__tests__/use-trainers.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTrainers } from '../use-trainers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase');

describe('useTrainers', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch trainers successfully', async () => {
    const mockTrainers = [
      { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@gym.com' },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockTrainers, error: null }),
    } as any);

    const { result } = renderHook(() => useTrainers(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTrainers);
  });

  it('should handle fetch error gracefully', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    } as any);

    const { result } = renderHook(() => useTrainers(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('should filter trainers by status', async () => {
    const mockTrainers = [
      { id: '1', first_name: 'Active', is_active: true },
      { id: '2', first_name: 'Inactive', is_active: false },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: mockTrainers.filter(t => t.is_active),
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useTrainers({ status: 'active' }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].first_name).toBe('Active');
  });

  // Add tests for create, update, delete mutations...
});
```

#### 2. `src/features/trainers/components/__tests__/TrainerForm.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TrainerForm } from '../TrainerForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('TrainerForm', () => {
  const mockOnSuccess = vi.fn();
  const queryClient = new QueryClient();

  const renderForm = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TrainerForm onSuccess={mockOnSuccess} />
      </QueryClientProvider>
    );
  };

  it('should render all form fields', () => {
    renderForm();

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/specializations/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    renderForm();

    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /create trainer/i }));

    await waitFor(() => {
      expect(screen.getByText(/first name.*required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name.*required/i)).toBeInTheDocument();
      expect(screen.getByText(/email.*required/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    renderForm();

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@gym.com');
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');

    // Select specialization
    await user.click(screen.getByLabelText(/specializations/i));
    await user.click(screen.getByText(/strength training/i));

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
```

#### 3. `src/features/trainers/components/__tests__/TrainerAnalytics.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TrainerAnalytics } from '../TrainerAnalytics';
import { useTrainerStats } from '../../hooks/use-trainer-stats';

vi.mock('../../hooks/use-trainer-stats');

describe('TrainerAnalytics', () => {
  it('should calculate total sessions correctly', () => {
    vi.mocked(useTrainerStats).mockReturnValue({
      data: {
        sessions: [
          { date: '2025-01-01', count: 5 },
          { date: '2025-01-02', count: 3 },
        ],
      },
      isLoading: false,
    } as any);

    render(<TrainerAnalytics trainerId="123" />);

    expect(screen.getByText(/8.*total sessions/i)).toBeInTheDocument();
  });

  it('should handle zero sessions gracefully', () => {
    vi.mocked(useTrainerStats).mockReturnValue({
      data: { sessions: [] },
      isLoading: false,
    } as any);

    render(<TrainerAnalytics trainerId="123" />);

    expect(screen.getByText(/no sessions yet/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useTrainerStats).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(<TrainerAnalytics trainerId="123" />);

    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });
});
```

---

## Testing Requirements

### Verification Steps

1. **Run trainer tests locally**

   ```bash
   npm test src/features/trainers
   ```

2. **Check coverage**

   ```bash
   npm run test:coverage -- src/features/trainers
   ```

3. **Verify target coverage**
   - Lines: >85%
   - Functions: >85%
   - Branches: >80%

---

## Definition of Done

- [ ] All 6 acceptance criteria met
- [ ] useTrainers hook tests passing (9 tests)
- [ ] TrainerForm component tests passing (9 tests)
- [ ] TrainerAnalytics component tests passing (8 tests)
- [ ] Trainer database utils tests passing
- [ ] useTrainerSearch hook tests passing
- [ ] Specializations tests passing
- [ ] Coverage >85% for trainers feature
- [ ] All tests pass in CI
- [ ] No console errors or warnings
- [ ] Code reviewed and approved

---

## Implementation Notes

### Best Practices

1. **Mock Supabase**: Always mock database calls in unit tests
2. **Test User Interactions**: Use userEvent for realistic interactions
3. **Test Loading States**: Verify spinners/skeletons appear
4. **Test Error States**: Verify error messages displayed

### Common Pitfalls

- ❌ **Don't** test implementation details (internal state)
- ❌ **Don't** make real API calls in unit tests
- ❌ **Don't** skip edge cases (empty arrays, nulls)
- ❌ **Don't** forget to test error scenarios

---

## Dependencies

**Requires**: US-001 (Playwright Infrastructure - for test utilities)
