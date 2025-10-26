# AGENT GUIDE - Session Types Expansion

## 🤖 For AI Agents Implementing This Feature

This guide provides a systematic workflow for implementing the session types expansion feature. Follow these steps sequentially.

---

## 📋 Pre-Implementation Checklist

Before starting any user story:

### 1. Git Branch Verification (MANDATORY)

```bash
git branch --show-current
```

**Must be**: `feature/session-types-expansion`
**If not**: STOP and create feature branch

### 2. Environment Check

```bash
# Verify no hanging processes
pgrep -f "vitest" | wc -l  # Should be 0

# Ensure dependencies are current
npm install
```

### 3. Read Project Standards

- [ ] Read `/Users/aissam/Dev/gym-manager/CLAUDE.md` - Project standards
- [ ] Review performance checklist
- [ ] Understand date handling standards
- [ ] Note testing requirements

---

## 🔄 Implementation Workflow

### Step 1: Select Next User Story

Check `STATUS.md` for current progress. Implement in dependency order:

**Dependency Tree:**

```
US-001 (Database) ✅ COMPLETED
  └─> US-002 (Types) 🟡 IN PROGRESS
        ├─> US-003 (Validation)
        ├─> US-004 (Colors)
        ├─> US-005 (Selector UI)
        ├─> US-006 (Trial Registration)
        └─> US-007 (Guest Info)
              └─> US-008 (Integration)
```

### Step 2: Read User Story

Open the specific US-XXX.md file and understand:

- Business value
- Acceptance criteria (what "done" means)
- Technical scope
- Testing requirements

### Step 3: Update Todo List

```typescript
TodoWrite([
  { content: "Read and understand US-XXX", status: "completed" },
  { content: "Implement feature X", status: "in_progress" },
  { content: "Write unit tests", status: "pending" },
  { content: "Update STATUS.md", status: "pending" },
]);
```

### Step 4: Implement Changes

Follow the technical implementation section in the user story.

**Key Principles:**

- One file at a time
- Test after each change
- No `any` types
- Use existing patterns from CLAUDE.md

### Step 5: Testing

**For each user story:**

```bash
# Run relevant tests
npm test path/to/test/file.test.ts

# Verify no TypeScript errors
npm run build

# Check linting
npm run lint
```

**Test Coverage Requirements:**

- New functions: 100% coverage
- Modified functions: Maintain or improve coverage
- Integration tests for user-facing features

### Step 6: Update STATUS.md

Mark story as completed:

```markdown
| US-XXX | Description | ✅ Completed | 2025-10-26 |
```

### Step 7: Commit (Per Story)

```bash
# Stage changes
git add <files>

# Commit with conventional format
git commit -m "feat(training-sessions): implement US-XXX - description

- Acceptance criterion 1
- Acceptance criterion 2
- All tests passing

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 🎯 Story-Specific Guidance

### US-001: Database Schema ✅ COMPLETED

**Status**: Already applied during feature setup
**Verification**: Check database for new columns

### US-002: TypeScript Types 🟡 IN PROGRESS

**Current State**: Database types partially updated
**Remaining Work**:

1. Complete `training-sessions/lib/types.ts`
2. Create `training-sessions/lib/type-guards.ts`
3. Update all imports

**Watch Out For**:

- Replace 'trail' with 'trial' everywhere
- Replace 'standard' with 'member' everywhere
- Add guest fields to TrainingSession interface

### US-003: Validation Schemas

**File**: `src/features/training-sessions/lib/validation.ts`

**Approach**:

1. Update `createSessionSchema` with all session types
2. Add conditional validation with `.refine()`
3. Test each session type separately

**Complex Validations**:

- Trial: requires 6 new*member*\* fields
- Member/Contractual/Makeup: require member_id
- Multi-site: requires 3 guest\_\* fields
- Collaboration: requires collaboration_details
- Non-bookable: no member required

### US-004: Session Colors

**Critical**: REPLACE, don't extend `session-colors.ts`

**Steps**:

1. Delete `getSessionColorVariant` function
2. Delete `SessionColorVariant` type
3. Add `getSessionTypeColor()` function
4. Update TimeSlot.tsx to use new function
5. Remove all "past"/"today"/"future" references

### US-005: Session Type Selector

**New Component**: `SessionTypeSelector.tsx`

**Design Requirements**:

- Grid layout (1 column on mobile, 2 on desktop is acceptable)
- Color-coded buttons (7 buttons)
- Selected state styling
- Uppercase labels

### US-006: Trial Member Registration

**New Component**: `TrialMemberRegistration.tsx`

**Key Logic**:

- Email uniqueness validation
- All fields required
- Inline form (not modal)
- Auto-set member_type='trial', status='pending'

### US-007: Guest Session Info

**New Component**: `GuestSessionInfo.tsx`

**Modes**:

- Multi-site: 3 text inputs
- Collaboration: 1 textarea
- Conditional rendering based on sessionType prop

### US-008: Dynamic Booking Form

**Major Refactor**: `SessionBookingDialog.tsx`

**Implementation Strategy**:

1. Add SessionTypeSelector (replace RadioGroup)
2. Watch session_type value
3. Conditionally render sections:
   - Trial → TrialMemberRegistration
   - Member/Makeup → MemberCombobox (all)
   - Contractual → MemberCombobox (trial only)
   - Multi-site/Collaboration → GuestSessionInfo
   - Non-bookable → Notes only
4. Update submission handler:
   - Create member if trial
   - Handle guest sessions (no TSM record)
   - Pass all fields to API

---

## ⚠️ Common Pitfalls

### 1. Database Changes

❌ **Don't**: Run migrations twice
✅ **Do**: Check if columns exist before altering

### 2. Type System

❌ **Don't**: Use inline types like 'trail' | 'standard'
✅ **Do**: Import SessionType from database types

### 3. Validation

❌ **Don't**: Have nested .refine() for same field
✅ **Do**: Use single .refine() with multiple conditions

### 4. Colors

❌ **Don't**: Keep time-based color logic
✅ **Do**: Complete replacement with session type logic

### 5. Forms

❌ **Don't**: Create separate dialogs per type
✅ **Do**: Single dialog with conditional sections

### 6. Testing

❌ **Don't**: Skip tests "to save time"
✅ **Do**: Write tests as you implement

---

## 🧪 Testing Strategy

### Unit Tests (Per Story)

**What to Test**:

- Type guards return correct booleans
- Validation accepts valid data, rejects invalid
- Color functions return correct Tailwind classes
- Helper functions work with all session types

**Test File Naming**:

- `__tests__/type-guards.test.ts`
- `__tests__/validation.test.ts`
- `__tests__/session-colors.test.ts`

### Integration Tests

**After US-008 Complete**:

- Create trial session → member created
- Create multi-site → guest data saved
- Create makeup → bypasses limit
- Create non-bookable → no member_id

### Component Tests

**For Each New Component**:

- Renders correctly
- Shows/hides fields based on props
- Validation messages display
- Form submission works

---

## 📊 Progress Tracking

### After Each Story

1. **Update STATUS.md**:

```markdown
| US-XXX | Story Name | ✅ Completed | YYYY-MM-DD |
```

2. **Update TodoList**:

```typescript
TodoWrite([
  { content: "US-XXX", status: "completed" },
  { content: "US-YYY", status: "in_progress" },
]);
```

3. **Commit Changes**:

```bash
git add .
git commit -m "feat: complete US-XXX"
```

### When All Stories Done

1. **Final Testing**:

```bash
npm test  # All tests
npm run build  # TypeScript compilation
npm run lint  # Code quality
```

2. **Update Documentation**:

- CLAUDE.md (if needed)
- Migration guide

3. **Create PR**:

```bash
git push -u origin feature/session-types-expansion
gh pr create --title "feat: session types expansion" --body "$(cat <<'EOF'
## Summary
- 7 session types with color coding
- Trial member quick registration
- Guest session tracking
- Dynamic form validation

## Testing
- [x] All unit tests passing
- [x] Integration tests passing
- [x] Manual testing completed

🤖 Generated with Claude Code
EOF
)"
```

---

## 🎓 Learning Resources

**CLAUDE.md Sections**:

- Performance Optimization Guidelines
- Testing Best Practices
- Git Branching Strategy
- Type System Standards

**Relevant Files to Study**:

- `src/features/members/components/ProgressiveMemberForm.tsx` - Form patterns
- `src/features/training-sessions/hooks/use-training-sessions.ts` - API patterns
- `src/features/training-sessions/lib/validation.ts` - Validation patterns

---

## 🚨 Emergency Procedures

### If Tests Fail

1. Don't proceed to next story
2. Fix failing tests first
3. Verify fix with `npm test`
4. Update STATUS.md with blocker

### If TypeScript Errors

1. Run `npm run build` to see all errors
2. Fix type mismatches
3. Don't use `any` or `@ts-ignore`
4. Ask for clarification if stuck

### If Database Migration Fails

1. Check existing schema first
2. Rollback if needed
3. Fix migration script
4. Re-apply carefully

---

**Current Status**: US-001 completed, US-002 in progress
**Next Action**: Complete US-002 type system updates
**Estimated Remaining**: 15-18 hours
