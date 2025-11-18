# AGENT-GUIDE: Member Weekly Session Limit Enforcement

This guide provides a systematic workflow for implementing the Member Weekly Session Limit Enforcement feature.

---

## 🎯 Implementation Workflow

### Pre-Implementation Checklist

**Before starting ANY user story:**

- [ ] Verify you're on `feature/member-weekly-session-limit` branch
- [ ] Read START-HERE.md completely
- [ ] Read README.md for architecture understanding
- [ ] Check STATUS.md for dependencies
- [ ] Run `git pull origin feature/member-weekly-session-limit` to get latest changes
- [ ] Run `npm install` to ensure dependencies are current

---

## 📋 User Story Implementation Order

### Phase 1: Database Foundation (US-001)

**Story**: [US-001-database-rpc-function.md](./US-001-database-rpc-function.md)

**Goal**: Create database-level validation function

**Steps**:

1. **Read the user story file** completely
2. **Create migration file** in `supabase/migrations/`
3. **Implement RPC function** `check_member_weekly_session_limit()`
4. **Add database index** for performance
5. **Test with Supabase MCP** (manual queries)
6. **Update types** in `src/features/database/lib/types.ts`
7. **Document in RPC_SIGNATURES.md**
8. **Mark US-001 as complete** in STATUS.md

**Success Criteria**:

- RPC function exists and can be called
- Returns proper validation result
- Index improves query performance
- TypeScript types defined

**Estimated Time**: 1-2 hours

---

### Phase 2: Application Integration (US-002)

**Story**: [US-002-application-validation.md](./US-002-application-validation.md)

**Goal**: Integrate validation in booking flow

**Dependencies**: US-001 MUST be complete

**Steps**:

1. **Read the user story file** completely
2. **Add helper function** in `src/features/training-sessions/lib/session-limit-utils.ts`
3. **Integrate in hook** `src/features/training-sessions/hooks/use-training-sessions.ts`
4. **Use existing type guard** `bypassesWeeklyLimit()` from `type-guards.ts`
5. **Add error handling** with user-friendly messages
6. **Test manually** via UI (attempt to book 2 member sessions)
7. **Mark US-002 as complete** in STATUS.md

**Success Criteria**:

- Booking validation works end-to-end
- Error messages are clear and actionable
- Makeup sessions bypass validation
- No breaking changes to existing functionality

**Estimated Time**: 2-3 hours

---

### Phase 3: Testing & Quality (US-003)

**Story**: [US-003-testing-suite.md](./US-003-testing-suite.md)

**Goal**: Comprehensive test coverage

**Dependencies**: US-001 and US-002 MUST be complete

**Steps**:

1. **Read the user story file** completely
2. **Create test file** `src/features/training-sessions/__tests__/lib/member-weekly-limit.test.ts`
3. **Write unit tests** for helper functions
4. **Write integration tests** for booking flow
5. **Test all session types** (member, makeup, trial, contractual, collaboration)
6. **Test edge cases** (cancelled sessions, week boundaries, timezone handling)
7. **Run full test suite** `npm test`
8. **Verify coverage** `npm run test:coverage`
9. **Mark US-003 as complete** in STATUS.md

**Success Criteria**:

- 100% test pass rate
- All edge cases covered
- Coverage meets project standards
- No flaky tests

**Estimated Time**: 2-3 hours

---

### Phase 4: Production Readiness (US-004)

**Story**: [US-004-production-readiness.md](./US-004-production-readiness.md)

**Goal**: Security, performance, and monitoring

**Dependencies**: US-001, US-002, US-003 MUST be complete

**Steps**:

1. **Read the user story file** completely
2. **Security audit** (RLS policies, input validation)
3. **Performance optimization** (query analysis, bundle size)
4. **Error handling review** (all mutations have onError)
5. **Documentation completion** (all files updated)
6. **Final testing** (lint, build, full test suite)
7. **Code review preparation** (clean commits, PR description)
8. **Mark US-004 as complete** in STATUS.md

**Success Criteria**:

- Meets all Production Readiness Standards from CLAUDE.md
- `npm run lint` - 0 errors, 0 warnings
- `npm run build` - successful compilation
- `npm test` - 100% pass rate
- Documentation complete and accurate

**Estimated Time**: 2-3 hours

---

## 🔄 After Each User Story

**Commit Checklist**:

- [ ] Run `npm run lint` - must pass with 0 errors
- [ ] Run `npm test` - must pass with 100% success rate
- [ ] Run `npm run build` - must compile successfully
- [ ] Update STATUS.md with completed story
- [ ] Commit with descriptive message following project conventions
- [ ] Push to feature branch

**Commit Message Format**:

```bash
git add .
git commit -m "feat(sessions): US-XXX - [brief description]

- Implementation details
- Key changes made
- Related files modified

🤖 Generated with Claude Code"
git push origin feature/member-weekly-session-limit
```

---

## ⚠️ Common Pitfalls to Avoid

### Database Layer

❌ **DON'T**: Forget to add database index
✅ **DO**: Add composite index on (member_id, session_type, scheduled_start)

❌ **DON'T**: Use `SELECT *` in RPC
✅ **DO**: Select only needed columns (COUNT(\*))

### Application Layer

❌ **DON'T**: Bypass validation for any session type without checking type guard
✅ **DO**: Use `bypassesWeeklyLimit(sessionType)` for all validation logic

❌ **DON'T**: Show generic error message
✅ **DO**: Provide clear, actionable error message suggesting makeup session

### Testing

❌ **DON'T**: Only test happy path
✅ **DO**: Test all session types, edge cases, and error scenarios

❌ **DON'T**: Mock database calls in integration tests
✅ **DO**: Use real Supabase test database for integration tests

### Code Quality

❌ **DON'T**: Use `any` types
✅ **DO**: Define proper TypeScript interfaces

❌ **DON'T**: Use `console.log` for debugging
✅ **DO**: Use logger utility from `@/lib/logger`

---

## 🐛 Troubleshooting

### Issue: RPC function not found

**Solution**: Verify migration applied successfully

```bash
# Check migrations in Supabase dashboard
# Or use Supabase MCP to list migrations
```

### Issue: Validation not triggering

**Solution**: Check session type and type guard logic

```typescript
// Verify bypasses logic is correct
if (!bypassesWeeklyLimit(data.session_type)) {
  // Run validation
}
```

### Issue: Week boundary issues

**Solution**: Use date-utils.ts functions

```typescript
import { getLocalDateString, getStartOfDay } from "@/lib/date-utils";
// Always work in local timezone
```

### Issue: Tests failing inconsistently

**Solution**: Clean up test state

```typescript
beforeEach(async () => {
  // Clean up test data
  await supabase.from("training_sessions").delete().match({ test: true });
});
```

---

## 📊 Progress Tracking

**Use STATUS.md** to track progress:

```markdown
## User Story Status

- [x] US-001: Database RPC Function - ✅ Complete
- [ ] US-002: Application Validation - 🚧 In Progress
- [ ] US-003: Testing Suite - 🔲 Not Started
- [ ] US-004: Production Readiness - 🔲 Not Started
```

**Update after each milestone:**

1. Mark story as complete in STATUS.md
2. Add completion date
3. Note any blockers or issues encountered
4. Update next actions

---

## ✅ Definition of Done

**A user story is complete when:**

- [ ] All acceptance criteria met (see individual user story files)
- [ ] Code follows CLAUDE.md standards
- [ ] All tests passing (100% pass rate)
- [ ] No TypeScript errors or `any` types
- [ ] No console statements (use logger instead)
- [ ] Documentation updated
- [ ] Changes committed with proper message
- [ ] STATUS.md updated
- [ ] Ready for next user story or code review

---

## 🚀 Ready for Implementation

**Current Status**: Documentation complete, ready for implementation

**Next Action**:

```bash
/implement-userstory US-001
```

**Questions?** Refer to:

- [START-HERE.md](./START-HERE.md) - Feature overview
- [README.md](./README.md) - Architecture details
- Individual user story files for detailed requirements
- [CLAUDE.md](../../CLAUDE.md) - Project standards

---

**Good luck! Follow this guide systematically for successful implementation.**
