# Member Weekly Session Limit Enforcement - START HERE

## 🎯 Quick Overview

**Feature Name**: Member Weekly Session Limit Enforcement

**Status**: 🚧 In Development

**Branch**: `feature/member-weekly-session-limit`

**Problem**: Members can currently book unlimited "Member" sessions per week, violating business rules that specify a maximum of 1 "Member" session per week (while allowing unlimited "Makeup" sessions).

**Solution**: Implement database and application-level validation to enforce the weekly limit for "Member" type sessions only.

---

## 📋 What You Need to Know

### Business Rule

- ✅ **Member Sessions**: Maximum 1 per week per member
- ✅ **Makeup Sessions**: Unlimited (bypass weekly limit)
- ✅ **Trial/Contractual/Collaboration Sessions**: Also bypass weekly limit
- ✅ **Cancelled Sessions**: Don't count toward limit
- ✅ **Week Boundaries**: Sunday to Saturday (local timezone)

### Target Users

- **Primary**: Gym administrators (booking sessions for members)
- **Primary**: Trainers (creating/managing sessions for members)
- **Indirect**: Members (affected by booking restrictions)

---

## 📂 User Stories

This feature is broken down into **4 user stories**:

| Story                                        | Description                                  | Status         | Priority |
| -------------------------------------------- | -------------------------------------------- | -------------- | -------- |
| [US-001](./US-001-database-rpc-function.md)  | Database RPC Function for Weekly Limit Check | 🔲 Not Started | P0       |
| [US-002](./US-002-application-validation.md) | Application-Level Booking Validation         | 🔲 Not Started | P0       |
| [US-003](./US-003-testing-suite.md)          | Comprehensive Testing Suite                  | 🔲 Not Started | P0       |
| [US-004](./US-004-production-readiness.md)   | Production Readiness & Optimization          | 🔲 Not Started | P0       |

**Implementation Order**: Must be completed sequentially (US-001 → US-002 → US-003 → US-004)

---

## 🚀 How to Implement

### For Claude Code Agent

**Read these files in order:**

1. **This file (START-HERE.md)** - ✅ You're here!
2. **[AGENT-GUIDE.md](./AGENT-GUIDE.md)** - Step-by-step implementation workflow
3. **[README.md](./README.md)** - Technical architecture and design decisions
4. **[STATUS.md](./STATUS.md)** - Track your progress

**Then start implementing:**

```bash
# Use the implement-userstory command
/implement-userstory US-001
```

### For Human Developers

1. Read [README.md](./README.md) for architecture overview
2. Read each user story file for detailed requirements
3. Check [STATUS.md](./STATUS.md) for current progress
4. Implement stories in dependency order

---

## 📊 Current Status

**Branch**: `feature/member-weekly-session-limit`

**Last Updated**: 2025-11-18

**Completed**: 0 / 4 user stories (0%)

**Next Action**: Implement US-001 (Database RPC Function)

---

## 🔗 Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Project coding standards
- [Session Types Documentation](../session-types-expansion/README.md) - Original session type definitions
- [RPC Signatures](../../docs/RPC_SIGNATURES.md) - Database function documentation
- [Type Guards](../../src/features/training-sessions/lib/type-guards.ts) - Existing `bypassesWeeklyLimit()` function

---

## ⚠️ Important Notes

**Before Starting:**

- ✅ Verify you're on `feature/member-weekly-session-limit` branch
- ✅ Run `npm install` to ensure dependencies are up to date
- ✅ Read AGENT-GUIDE.md for implementation workflow

**During Development:**

- Follow coding standards in CLAUDE.md
- Run `npm run lint && npm test` before each commit
- Update STATUS.md after completing each milestone

**Testing:**

- All stories must have comprehensive tests
- Edge cases MUST be covered (cancelled sessions, week boundaries, all session types)
- Run full test suite before marking story as complete

---

## 🎯 Success Criteria

This feature is complete when:

- ✅ Members cannot book 2nd "Member" session in same week
- ✅ Members can book unlimited "Makeup" sessions
- ✅ Clear error message shown when limit exceeded
- ✅ Database-level validation prevents data integrity issues
- ✅ All tests passing (100% pass rate)
- ✅ Documentation updated
- ✅ Code review approved
- ✅ Merged to `dev` branch

---

**Ready to start? Read [AGENT-GUIDE.md](./AGENT-GUIDE.md) next!**
