# US-003: Fix Environment Variable Validation

## User Story

**As a** developer  
**I want** all environment variable access to be validated through the centralized env object  
**So that** configuration errors are caught at build time instead of runtime

## Business Value

Prevents production crashes from missing or invalid environment variables. Improves developer experience with clear error messages during development.

## Acceptance Criteria

1. [ ] Audit and replace all direct process.env usage (10 instances)
2. [ ] Update middleware.ts environment access
3. [ ] Verify env.ts has all required variables
4. [ ] Build fails gracefully with helpful error for missing vars
5. [ ] Update .env.example with all variables

## Technical Implementation

Replace `process.env.VAR` with `env.VAR` from `@/lib/env`

## Estimated Effort

4 hours

## Priority

P0 (Must Have)

## Dependencies

None
