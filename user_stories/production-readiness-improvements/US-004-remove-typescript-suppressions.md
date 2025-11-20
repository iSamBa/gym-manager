# US-004: Remove TypeScript Suppressions and Console Statements

## User Story

**As a** developer  
**I want** all TypeScript errors properly fixed and console statements replaced with logger  
**So that** code quality is maintained and production logs are clean

## Business Value

Improves code maintainability, catches type errors at compile time, and provides proper production logging infrastructure.

## Acceptance Criteria

1. [ ] Fix TrainerCalendarView.tsx (@ts-nocheck removal)
2. [ ] Replace all console statements with logger utility (10 files)
3. [ ] Verify npx tsc --noEmit passes with no errors
4. [ ] ESLint passes with no console violations
5. [ ] All tests pass

## Technical Implementation

- Remove @ts-nocheck and fix underlying type issues
- Import logger utility and replace console.\* calls

## Estimated Effort

8 hours

## Priority

P0 (Must Have)

## Dependencies

None
