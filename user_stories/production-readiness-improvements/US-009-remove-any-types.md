# US-009: Remove TypeScript `any` Types with Proper Interfaces

## User Story

**As a** developer  
**I want** all `any` types replaced with proper interfaces  
**So that** type safety is maintained and IDE autocomplete works correctly

## Business Value

Improves code maintainability, catches bugs at compile time, and enhances developer experience with better IDE support.

## Acceptance Criteria

1. [ ] Reorganize types into modular structure (database.types.ts, member.types.ts, etc.)
2. [ ] Fix 92 files containing `any` types
3. [ ] Create proper interfaces for all function parameters
4. [ ] Enable TypeScript strict mode
5. [ ] Verify npx tsc --noEmit passes
6. [ ] All tests pass

## Technical Implementation

Split 711-line types.ts into logical modules in src/features/database/lib/types/

## Estimated Effort

24 hours

## Priority

P2 (Nice to Have)

## Dependencies

None
