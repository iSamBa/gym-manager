# US-007: Implement Dynamic Imports for Heavy Libraries

## User Story

**As a** developer  
**I want** all heavy libraries (charts, PDF generators) loaded dynamically  
**So that** initial bundle size is minimized and page load time improves

## Business Value

Reduces initial bundle size by ~400KB, improving First Contentful Paint and Time to Interactive. Critical for mobile users and slow networks.

## Acceptance Criteria

1. [ ] Dynamic import 9 chart components (SessionsByTypeChart, SubscriptionMetricsChart, etc.)
2. [ ] Verify PDF generators already use dynamic imports
3. [ ] Add loading fallbacks using LoadingSkeleton
4. [ ] Bundle size <300 KB per route
5. [ ] All tests pass

## Estimated Effort

8 hours

## Priority

P1 (Should Have)

## Dependencies

US-002 (needs LoadingSkeleton for fallbacks)
