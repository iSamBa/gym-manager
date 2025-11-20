# US-010: Consolidate Hooks Per 4-Hook Rule

## User Story

**As a** developer  
**I want** hooks consolidated per feature following the 4-hook maximum rule  
**So that** code is maintainable and follows CLAUDE.md standards

## Business Value

Reduces complexity, improves code organization, and makes features easier to understand and maintain.

## Acceptance Criteria

1. [ ] Consolidate Members hooks: 25 → 4
   - use-members.ts (CRUD + search + export)
   - use-member-form.ts (form state + validation)
   - use-member-filters.ts (filter state + URL sync)
   - use-member-analytics.ts (stats + charts)
2. [ ] Consolidate Trainers hooks: 17 → 4
3. [ ] Consolidate Subscriptions hooks: 15 → 4
4. [ ] Create barrel exports for each feature
5. [ ] Update all component imports
6. [ ] All tests pass

## Estimated Effort

24 hours

## Priority

P2 (Nice to Have)

## Dependencies

None
