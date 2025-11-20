# US-006: Move Client-Side Operations to Server-Side

## User Story

**As a** developer  
**I want** all filtering, sorting, and pagination to happen on the server  
**So that** application performance doesn't degrade with large datasets

## Business Value

Dramatically improves performance for datasets >100 records and reduces client-side memory usage. Essential for scalability.

## Acceptance Criteria

1. [ ] Refactor use-training-sessions.ts (move trainer, status, date filtering to query)
2. [ ] Refactor use-members.ts (move type, status, search to query)
3. [ ] Refactor use-payments.ts (move date range, status filtering to query)
4. [ ] Update affected components (MemberPayments, ProgressiveMemberForm, etc.)
5. [ ] Verify query performance <100ms average
6. [ ] All tests pass

## Estimated Effort

16 hours

## Priority

P1 (Should Have)

## Dependencies

None
