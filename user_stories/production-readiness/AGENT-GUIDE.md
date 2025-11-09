# AGENT-GUIDE: Production Readiness Implementation Workflow

This guide provides step-by-step instructions for systematically implementing production readiness improvements.

---

## 🎯 Implementation Philosophy

**Approach**: Incremental, test-driven implementation with continuous validation

**Key Principles**:

1. **Security First** - All P0 security issues before performance
2. **Test Everything** - Run tests after each change
3. **Document Decisions** - Update docs as you go
4. **Verify Benchmarks** - Measure performance improvements
5. **Never Skip Tests** - All tests must pass before moving forward

---

## 📋 Pre-Implementation Checklist

Before starting ANY user story:

- [ ] Read CLAUDE.md production readiness standards
- [ ] Verify on feature branch (`git branch --show-current`)
- [ ] Run baseline tests: `npm test` (all passing)
- [ ] Run baseline build: `npm run build` (successful)
- [ ] Review the specific user story markdown file
- [ ] Understand dependencies on previous user stories

---

## 🔄 Standard Implementation Workflow

### For EACH User Story:

#### Phase 1: Preparation

```bash
# 1. Verify branch
git branch --show-current  # Should be feature/*

# 2. Read user story file
cat user_stories/production-readiness/US-XXX-*.md

# 3. Review affected files (listed in user story)

# 4. Run baseline tests
npm test
npm run build
```

#### Phase 2: Implementation

1. **Create or modify files** as specified in user story
2. **Follow patterns** from CLAUDE.md
3. **Write tests** for new functionality
4. **Test incrementally** - don't batch changes

#### Phase 3: Validation

```bash
# 1. Run linter
npm run lint  # Must be 0 errors, 0 warnings

# 2. Run tests
npm test  # Must be 100% pass rate

# 3. Run build
npm run build  # Must succeed

# 4. Manual verification
# - Check UI if applicable
# - Verify database changes in Supabase
# - Test error scenarios
```

#### Phase 4: Documentation

1. **Update STATUS.md** with completion status
2. **Document changes** in relevant docs/ files
3. **Add comments** for complex logic
4. **Update types** if schema changed

#### Phase 5: Commit

```bash
# Only if all tests pass and validation complete
git add .
git commit -m "feat(production): [User Story] - description

Implements US-XXX: [story name]

- Specific change 1
- Specific change 2
- Specific change 3

Tests: All passing
Build: Successful

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 📊 User Story Implementation Order

### Week 1: Security Hardening (P0)

#### US-001: Security Hardening & RLS Documentation

**Dependencies**: None
**Estimated Time**: 4-6 hours

**Steps**:

1. Audit all Supabase tables for RLS policies
2. Create `docs/RLS-POLICIES.md` with comprehensive documentation
3. Test RLS policies with different user roles
4. Document security best practices
5. Run security audit checklist

**Validation**:

- [ ] `docs/RLS-POLICIES.md` exists and is complete
- [ ] All sensitive tables have documented RLS policies
- [ ] Security audit finds zero vulnerabilities
- [ ] Tests verify RLS enforcement

**Command**: `/implement-userstory US-001`

---

#### US-003: Environment Validation & Input Sanitization

**Dependencies**: None
**Estimated Time**: 4-5 hours

**Steps**:

1. Create `src/lib/env.ts` with Zod validation
2. Create `src/lib/sanitize.ts` with DOMPurify
3. Update all env variable usage to use validated env
4. Add sanitization to comment/note inputs
5. Add file upload validation

**Validation**:

- [ ] Invalid env vars cause startup failure
- [ ] User input is sanitized before display
- [ ] File uploads are validated
- [ ] Tests cover all validation scenarios

**Command**: `/implement-userstory US-003`

---

### Week 2: Database & Performance (P0)

#### US-002: Database Indexes & Query Optimization

**Dependencies**: US-001 (RLS docs should be complete)
**Estimated Time**: 8-10 hours

**Steps**:

1. Create migration for members table indexes
2. Create migration for subscriptions indexes
3. Create migration for payments indexes
4. Create migration for sessions indexes
5. Identify and fix N+1 queries in:
   - `src/features/members/lib/database-utils.ts`
   - `src/features/training-sessions/hooks/use-training-sessions.ts`
   - `src/features/payments/hooks/use-payments.ts`
6. Replace separate queries with joins
7. Benchmark query performance

**Validation**:

- [ ] All migrations applied successfully
- [ ] Indexes verified in Supabase
- [ ] N+1 queries eliminated (use network tab)
- [ ] Query performance <100ms average
- [ ] Tests still passing

**Command**: `/implement-userstory US-002`

---

#### US-004: Transaction Handling & Data Integrity

**Dependencies**: US-002 (database setup complete)
**Estimated Time**: 6-8 hours

**Steps**:

1. Create RPC function `create_subscription_with_payment`
2. Create RPC function `process_refund_with_transaction`
3. Update subscription creation to use RPC
4. Update refund processing to use RPC
5. Add rollback error handling
6. Test failure scenarios

**Validation**:

- [ ] RPC functions deployed to Supabase
- [ ] Transactions prevent partial data writes
- [ ] Rollback works on errors
- [ ] Integration tests cover atomic operations

**Command**: `/implement-userstory US-004`

---

### Week 3: Optimization (P1)

#### US-005: Error Handling & User Experience

**Dependencies**: US-003 (validation in place)
**Estimated Time**: 5-6 hours

**Steps**:

1. Audit all useMutation calls (104 total)
2. Add onError handlers to all mutations
3. Create error boundary components
4. Add error.tsx to dynamic routes
5. Improve error messages
6. Test error scenarios

**Validation**:

- [ ] All mutations have error handlers
- [ ] Error boundaries catch route errors
- [ ] User-friendly error messages shown
- [ ] Errors logged with context

**Command**: `/implement-userstory US-005`

---

#### US-006: Bundle Size Optimization & Performance

**Dependencies**: US-002 (queries optimized)
**Estimated Time**: 8-10 hours

**Steps**:

1. Add dynamic imports for jsPDF (already done, verify)
2. Add dynamic imports for chart libraries
3. Code split large components
4. Add pagination to payments table
5. Add pagination to subscriptions table
6. Implement virtual scrolling for member list
7. Optimize images with Next.js Image
8. Run bundle analysis

**Validation**:

- [ ] Bundle size <300 KB per route
- [ ] Heavy libraries lazy loaded
- [ ] Pagination working on all large tables
- [ ] Images optimized (WebP)
- [ ] Build size report shows improvements

**Command**: `/implement-userstory US-006`

---

### Week 4: Monitoring & Final Verification (P1)

#### US-007: Production Monitoring & Deployment

**Dependencies**: All previous US completed
**Estimated Time**: 6-8 hours

**Steps**:

1. Setup Sentry account and project
2. Configure Sentry in Next.js
3. Add error tracking to key operations
4. Setup performance monitoring
5. Configure database query monitoring
6. Document deployment process
7. Create monitoring dashboards

**Validation**:

- [ ] Sentry capturing errors
- [ ] Performance metrics tracked
- [ ] Database queries monitored
- [ ] Deployment docs complete
- [ ] Monitoring alerts configured

**Command**: `/implement-userstory US-007`

---

#### US-008: Production Readiness & Final Verification

**Dependencies**: ALL previous user stories (US-001 through US-007)
**Estimated Time**: 4-6 hours

**Steps**:

1. Run complete production readiness checklist
2. Review all previous user story implementations
3. Load test with 50+ concurrent users
4. Security audit final verification
5. Performance benchmarking
6. Documentation review
7. Create deployment runbook

**Validation**:

- [ ] Production readiness score ≥95/100
- [ ] All P0 items completed
- [ ] Load testing successful
- [ ] Documentation complete
- [ ] Ready for production deployment

**Command**: `/implement-userstory US-008`

---

## 🚨 Error Handling Protocol

### If Tests Fail

1. **STOP** - Do not proceed
2. **Investigate** - Read error messages carefully
3. **Fix** - Address the root cause
4. **Re-test** - Run full test suite
5. **Document** - Note what broke and why

### If Build Fails

1. **Check TypeScript errors** - `npm run build`
2. **Fix type issues** - Add proper interfaces
3. **Verify imports** - Check for missing dependencies
4. **Re-build** - Ensure successful compilation

### If Database Migration Fails

1. **Check Supabase logs** - Review error messages
2. **Rollback if needed** - Use Supabase dashboard
3. **Fix SQL syntax** - Correct migration file
4. **Re-apply** - Test migration locally first

---

## 📊 Progress Tracking

### After Each User Story:

1. **Update STATUS.md**:

   ```markdown
   ## US-XXX: [Story Name]

   **Status**: ✅ Complete
   **Completed**: 2025-11-XX
   **Time Spent**: X hours
   **Notes**: Key learnings or issues encountered
   ```

2. **Update Metrics**:
   - Bundle size changes
   - Query performance improvements
   - Test coverage changes
   - Security score updates

3. **Document Issues**:
   - Blockers encountered
   - Workarounds implemented
   - Technical debt created

---

## 🎯 Quality Gates

### Before Marking User Story Complete:

- [ ] All acceptance criteria met
- [ ] Tests passing (100% pass rate)
- [ ] Linter clean (0 errors, 0 warnings)
- [ ] Build successful
- [ ] Documentation updated
- [ ] STATUS.md updated
- [ ] Code committed with proper message
- [ ] Manual verification complete

### Before Final Deployment (US-008):

- [ ] All 8 user stories complete
- [ ] Production readiness checklist 100%
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Load testing successful
- [ ] Monitoring configured
- [ ] Deployment docs complete
- [ ] Team review completed

---

## 💡 Tips for Success

1. **Read CLAUDE.md First** - Always reference production standards
2. **Small Commits** - Commit after each logical change
3. **Test Often** - Don't batch testing
4. **Ask Questions** - Use comments to document complexity
5. **Measure Impact** - Track performance improvements
6. **Document Decisions** - Explain "why" not just "what"
7. **Follow Patterns** - Consistency matters

---

## 🆘 Getting Help

### If Stuck:

1. Review CLAUDE.md troubleshooting section
2. Check user story acceptance criteria
3. Look for similar patterns in codebase
4. Review test files for examples
5. Check docs/ folder for guidance

### Common Issues:

- **Type errors**: Check `src/features/database/lib/types.ts`
- **Database errors**: Review `docs/RPC_SIGNATURES.md`
- **Test failures**: Check mock setup and cleanup
- **Build errors**: Verify imports and dependencies

---

## ✅ Success Criteria

### Feature Complete When:

1. All 8 user stories implemented
2. Production readiness score ≥95/100
3. Zero P0 issues remaining
4. All tests passing
5. Performance benchmarks met
6. Monitoring configured
7. Documentation complete
8. Ready for production deployment

---

**Last Updated**: 2025-11-09
**Status**: Ready for Implementation
**Start With**: `/implement-userstory US-001`
