# Training Sessions Rework - Agent Implementation Guide

## 📘 Purpose

This guide provides a systematic workflow for implementing the Training Sessions Rework feature using the `/implement-userstory` command.

---

## 🔄 Implementation Workflow

### Step 1: Understand the Feature

1. ✅ Read `START-HERE.md` completely
2. ✅ Read this `AGENT-GUIDE.md`
3. ✅ Read `README.md` for technical architecture
4. ✅ Review `STATUS.md` to check current progress

### Step 2: Verify Prerequisites

```bash
# Confirm you're on the correct branch
git branch --show-current
# Expected: feature/training-sessions-rework

# Verify Supabase MCP server is available
# Check that member_comments table exists for notification integration

# Run existing tests to ensure clean baseline
npm test
```

### Step 3: Implement User Stories in Order

**CRITICAL: Follow dependency order strictly!**

#### Phase 1: Database Foundation

```bash
# US-001: Create machines table
/implement-userstory US-001

# Wait for completion, then verify:
# - machines table created
# - 3 machine records inserted (machine_number 1, 2, 3)
# - RLS policies applied

# US-002: Modify training_sessions schema
/implement-userstory US-002

# Wait for completion, then verify:
# - max_participants column removed
# - trainer_id is now nullable
# - machine_id column added with foreign key
# - Default machine assigned to existing sessions

# US-003: Update database functions
/implement-userstory US-003

# Wait for completion, then verify:
# - Trainer availability check removed from create_training_session_with_members
# - Function signature updated for machine_id
# - Views updated to include machine data
```

**Checkpoint 1:** Run database verification script

```bash
# Verify schema changes
npm run db:verify
# Or manually check with Supabase MCP tools
```

#### Phase 2: Backend Updates

```bash
# US-004: Update TypeScript types
/implement-userstory US-004

# Wait for completion, then verify:
# - TrainingSession interface updated
# - CreateSessionData includes machine_id
# - UpdateSessionData updated
# - max_participants removed from all types
# - trainer_id properly marked as optional

# US-005: Modify hooks and API
/implement-userstory US-005

# Wait for completion, then verify:
# - useTrainingSessions accepts machine_id filter
# - useCreateTrainingSession handles machine selection
# - max_participants logic removed
# - Trainer assignment optional in mutations
```

**Checkpoint 2:** Run type checking and linting

```bash
npx tsc --noEmit
npm run lint
```

#### Phase 3: UI Development

```bash
# US-006: Build MachineSlotGrid component
/implement-userstory US-006

# Wait for completion, then verify:
# - MachineSlotGrid.tsx created
# - 3-column layout renders
# - Responsive design works
# - Loading/error states handled

# US-007: Implement slot rendering logic
/implement-userstory US-007

# Wait for completion, then verify:
# - 30 time slots generated (9:00 - 00:00)
# - Slots show member name when booked
# - Status colors applied correctly
# - Empty slots clickable for booking

# US-008: Integrate due-date notifications
/implement-userstory US-008

# Wait for completion, then verify:
# - SessionNotificationBadge component created
# - Queries member_comments with due_date
# - Badge shows count of active alerts
# - Only appears on sessions before due_date
```

**Checkpoint 3:** Run component tests

```bash
npm test -- src/features/training-sessions/components/
```

#### Phase 4: Forms & Admin Controls

```bash
# US-009: Update session booking form
/implement-userstory US-009

# Wait for completion, then verify:
# - Form shows machine selection
# - Single member dropdown (not multi-select)
# - Trainer field optional
# - Validation updated

# US-010: Add machine availability admin controls
/implement-userstory US-010

# Wait for completion, then verify:
# - Admin can toggle machine availability
# - Unavailable machines grayed out
# - Can't book on unavailable machines
# - RLS policies enforce admin-only access
```

**Checkpoint 4:** Run full test suite

```bash
npm test
npm run test:coverage
```

---

## ✅ Quality Gates

### After Each User Story

1. **Code compiles** - `npx tsc --noEmit` passes
2. **Linting passes** - `npm run lint` shows 0 errors
3. **Tests pass** - `npm test` for affected files
4. **Manual verification** - Test in browser if UI changes

### After Each Phase

1. **Full build succeeds** - `npm run build` completes
2. **All tests pass** - `npm test` shows 100% pass rate
3. **Coverage maintained** - No significant coverage drops
4. **Visual testing** - Check UI in development server

### Before Final PR

1. **Complete test suite** - All tests passing
2. **Type safety** - Zero TypeScript errors
3. **Performance** - No unnecessary re-renders (React DevTools)
4. **Accessibility** - Keyboard navigation works
5. **Database migration** - Test on clean database
6. **Documentation** - All user stories marked complete in STATUS.md

---

## 🐛 Troubleshooting

### Database Issues

**Problem:** Migration fails

```bash
# Check current migrations
# Use Supabase MCP list_migrations

# Rollback if needed (manual via Supabase dashboard)
# Re-run migration
```

**Problem:** RLS policies block queries

```bash
# Verify you're authenticated as admin
# Check RLS policies in Supabase dashboard
# Ensure policies allow SELECT for authenticated users
```

### TypeScript Errors

**Problem:** Type mismatches after schema changes

```bash
# Regenerate Supabase types
# Use mcp__supabase__generate_typescript_types

# Update import paths
# Restart TypeScript server in VS Code
```

### Component Rendering Issues

**Problem:** Slots not displaying correctly

```bash
# Check browser console for errors
# Verify data structure matches types
# Use React DevTools to inspect props
# Check CSS classes applied correctly
```

---

## 📊 Progress Tracking

### Update STATUS.md After Each Story

```markdown
## Implementation Progress

- [x] US-001: Machines Database Schema (Completed YYYY-MM-DD)
- [x] US-002: Training Sessions Schema Updates (Completed YYYY-MM-DD)
- [ ] US-003: Database Functions Cleanup (In Progress)
      ...
```

### Commit Strategy

**Pattern:** One commit per user story completion

```bash
# After completing US-001
git add .
git commit -m "feat(training-sessions): implement machines database schema (US-001)

- Create machines table with RLS policies
- Insert 3 default machines
- Add machine_number constraint (1, 2, 3)
- Configure admin-only write access

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin feature/training-sessions-rework
```

---

## 🚀 Final Steps

### When All User Stories Complete

1. **Update STATUS.md** - Mark all stories complete
2. **Run full test suite** - `npm test && npm run test:coverage`
3. **Build production** - `npm run build`
4. **Update CLAUDE.md** - Add any new patterns discovered
5. **Create PR** using GitHub CLI:

```bash
gh pr create \
  --title "feat: Training Sessions Rework - Machine Slot System" \
  --body "$(cat <<EOF
## Summary
- Replaced calendar-based system with 3-machine slot grid
- Single member per session (removed max_participants)
- Optional trainer assignment (assigned at completion)
- Added due-date notification badges
- Admin-controlled machine availability

## Test Plan
- [x] All database migrations pass
- [x] Type checking passes (npx tsc --noEmit)
- [x] Linting passes (npm run lint)
- [x] Full test suite passes (npm test)
- [x] Manual testing completed in development
- [x] Performance verified (React DevTools)

## User Stories Completed
- US-001 through US-010 (all 10 stories)

## Breaking Changes
- Calendar views removed (only daily machine grid)
- Multi-participant support removed
- Trainer now optional field

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 📞 Need Help?

### Common Questions

**Q: Can I implement stories out of order?**
A: No! Follow dependency order in START-HERE.md diagram

**Q: What if tests fail after my changes?**
A: Fix tests immediately - don't proceed to next story

**Q: How do I test machine availability toggle?**
A: Use Supabase dashboard to verify is_available updates

**Q: Where do I find member comments for notifications?**
A: Use existing `useMemberComments` hook from members feature

---

## ✨ Best Practices

1. **Read the user story completely** before implementing
2. **Follow acceptance criteria exactly** - they define done
3. **Test incrementally** - don't batch testing at the end
4. **Commit after each story** - makes rollback easier
5. **Update STATUS.md** - tracks progress for team visibility

---

**Ready to implement?** Start with US-001!

**Command:** `/implement-userstory US-001`
