---
description: "Systematically implement a user story following AGENT-GUIDE workflow"
---

# Implement User Story

I'll guide you through implementing a user story using our proven systematic workflow. This ensures quality, completeness, and adherence to project standards.

---

## ⚠️ CRITICAL RULE: NO STEPS MAY BE SKIPPED

**EVERY SINGLE STEP in the user story and this workflow MUST be completed. Skipping ANY step is UNACCEPTABLE.**

This includes (but is not limited to):

- All implementation steps
- Unit testing
- Linting
- **Manual testing checklists** (EVERY checkbox must be verified)
- Acceptance criteria verification
- Definition of Done verification
- STATUS.md updates
- User story file updates

**If a step exists in the user story, it MUST be completed. NO EXCEPTIONS.**

---

## 📋 Usage

```
/implement-userstory US-001
```

or

```
/implement-userstory 1
```

**Arguments:**

- User story number (e.g., `US-001`, `001`, or just `1`)

---

## 🔍 What I Need

### Required Information

**Which user story do you want to implement?**

→ **User Story:**

**Which feature does it belong to?**
_Example: members-table-rework, payment-dashboard, etc._

→ **Feature folder name:**

---

## ✅ Pre-flight Checks

I will automatically verify:

1. ✓ User story file exists (`user_stories/{feature}/US-{number}-*.md`)
2. ✓ START-HERE.md is present
3. ✓ AGENT-GUIDE.md is present
4. ✓ STATUS.md is present
5. ✓ All dependencies are complete (check STATUS.md)
6. ✓ CLAUDE.md and CLAUDE.local.md guidelines loaded

**If any check fails, I'll stop and tell you what's missing.**

---

## 📖 Step 1: Context Analysis

I will:

1. Read the complete user story
2. Parse all acceptance criteria
3. Identify dependencies (previous user stories)
4. Review technical implementation section
5. Extract all testing requirements
6. Identify files to modify/create

**Output:** A summary of what needs to be done

---

## 📐 Step 2: Implementation Plan

I will present a detailed plan:

### Plan Structure

```
📁 Files to Modify:
   - file1.ts (add new function)
   - file2.tsx (update component)

📄 Files to Create:
   - new-component.tsx
   - new-util.ts
   - new.test.ts

🗄️ Database Changes:
   - Create function: get_data()
   - Add indexes on: table.column

🧪 Testing Approach:
   - Unit tests: X tests
   - Integration tests: Y tests
   - Performance benchmarks: Z targets

⚙️ Complexity: [Small/Medium/Large]
⏱️ Estimated Time: [X hours]
```

**I'll ask:** "Approve to proceed? (yes/no/modify)"

---

## 🛠️ Step 3: Systematic Implementation

Following AGENT-GUIDE.md workflow, I will:

### Phase 1: Data Layer

```
✓ Database migrations/functions
✓ Type definitions
✓ API utilities
✓ Tests for data layer
```

### Phase 2: Component Layer

```
✓ UI components
✓ Hooks
✓ Utils
✓ Tests for components
```

### Phase 3: Integration

```
✓ Wire everything together
✓ Integration tests
✓ Manual verification
```

**I'll show progress and results at each phase.**

---

## 🧪 Step 4: Testing Phase (MANDATORY - NO STEPS SKIPPED)

**⚠️ CRITICAL: ALL testing steps below MUST be completed. Skipping any step makes the user story incomplete.**

I will complete ALL tests from the user story in this order:

### 4.1 Automated Testing (REQUIRED)

```
✓ Database tests (SQL queries if applicable)
✓ Unit tests (npm test -- <file>)
✓ Type safety (npx tsc --noEmit)
✓ Linting (npm run lint)
✓ Build (npm run build)
✓ Performance benchmarks (if specified)
```

### 4.2 Manual Testing Checklist (REQUIRED - CANNOT BE SKIPPED)

**Every checkbox in the user story's "Manual Testing Checklist" section MUST be verified:**

I will:

1. Read the COMPLETE manual testing checklist from the user story
2. Prompt the user to verify EACH item (or verify myself if possible)
3. Document results for EVERY checkbox
4. If ANY item fails, fix and re-test until it passes

**Example Manual Testing Items:**

- [ ] Feature X appears correctly in UI
- [ ] Button Y triggers expected action
- [ ] Navigation from page A to page B works
- [ ] Data refreshes after action Z
- [ ] Error states display correctly

### Test Results Format

```
Unit Tests: 12/12 passing ✓
Integration Tests: 5/5 passing ✓
Type Safety: No errors ✓
Linting: 0 errors, 0 warnings ✓
Build: Successful ✓
Performance: Query <500ms ✓
Manual Testing: 12/12 items verified ✓
```

**If any test fails (automated OR manual), I'll stop and report the issue.**

---

## ✅ Step 5: Definition of Done Verification (NO SKIPPING)

**⚠️ CRITICAL: I will verify EVERY SINGLE checkbox. If ANY checkbox cannot be checked, the user story is INCOMPLETE.**

I will go through EVERY checkbox in "Definition of Done":

```
Definition of Done Checklist:
✓ All acceptance criteria met and verified
✓ All tests passing (unit, integration, performance)
✓ ALL manual testing checklist items verified
✓ Code follows project standards (CLAUDE.md)
✓ TypeScript strict mode compliance (no `any` types)
✓ Components under 300 lines
✓ Performance optimization applied (memo, useCallback, useMemo)
✓ Server-side operations for data-heavy tasks
✓ Linting passed (`npm run lint`)
✓ Build successful (`npm run build`)
✓ Documentation updated
✓ Code reviewed (if applicable)
```

**MANDATORY: Only proceed when ALL checkboxes are checked. No exceptions.**

**If I cannot verify a manual testing item myself, I MUST ask the user to verify it.**

---

## 📝 Step 6: Completion

Once all DoD items are verified, I will:

### 1. Update User Story File

Mark the user story itself as completed:

**File**: `user_stories/{feature}/US-{number}-*.md`

```markdown
**Status**: ✅ Completed
**Completed**: 2025-01-15
**Implementation Notes**: Brief summary of approach/decisions made
```

**Example**:

```markdown
**Status**: ✅ Completed
**Priority**: P0 (Critical)
**Effort**: Medium
**Dependencies**: None
**Decision**: Option A - Remove Custom Tracker (chosen 2025-01-15)
**Completed**: 2025-01-15
```

### 2. Update STATUS.md

```markdown
| US-001 | Database Foundation | 🟢 Complete | Claude | 2025-01-15 | 2025-01-15 | All tests passing |
```

### 3. Create Commit

```bash
feat({scope}): Implement US-{number} {title}

{description of changes}

Tests: {test results}
Performance: {benchmarks}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 4. Ask User

**"User story US-{number} complete! Push changes? (yes/no)"**

### 5. Show Next Steps

**"Ready for US-{next}? (yes/no)"**

---

## 🚨 Error Handling

### If Dependencies Incomplete

```
❌ Cannot start US-003
   Requires: US-001 ✓ US-002 ✗

   Please complete US-002 first by running:
   /implement-userstory US-002
```

### If Tests Fail

```
❌ Tests Failed - Cannot Proceed

   Unit Tests: 10/12 passing
   Failed:
   - test-file.test.ts:45 - Expected X but got Y
   - test-file.test.ts:78 - Timeout exceeded

   Fix these issues before marking user story complete.
```

### If Acceptance Criteria Unclear

```
⚠️ Clarification Needed

   Acceptance Criteria #3 is ambiguous:
   "System should handle errors gracefully"

   Please clarify:
   - Which errors specifically?
   - What does "gracefully" mean in this context?
   - Any specific user feedback required?
```

### If Blocked

```
🔵 Blocked - Cannot Proceed

   Blocker: Missing design mockups for UI

   Actions:
   1. Documented in STATUS.md
   2. Notified user
   3. Suggested next steps
```

---

## 📊 Progress Tracking

Throughout implementation, I'll show:

### Real-time Updates

```
[1/6] ✓ Context Analysis Complete
[2/6] ✓ Plan Approved
[3/6] ⏳ Implementing Data Layer...
      ✓ Created database function
      ✓ Added type definitions
      ⏳ Writing tests...
```

### Final Summary

```
User Story US-001 Implementation Complete!

Files Changed: 8
Tests Added: 15
All Tests: 156/156 passing ✓
Coverage: 92%
Performance: All targets met ✓
Time: 2.5 hours

US-001 file updated ✓
STATUS.md updated ✓
Commit created ✓
```

---

## 🎯 Success Criteria

**⚠️ A user story is ONLY complete when ALL of these are true:**

✅ User story file (US-XXX-\*.md) marked as completed
✅ Completion date and implementation notes added
✅ **ALL acceptance criteria verified (no exceptions)**
✅ **ALL automated tests passing (100%)**
✅ **ALL manual testing checklist items verified**
✅ **ALL DoD checkboxes checked**
✅ STATUS.md updated with metrics
✅ Code committed with proper message
✅ No regressions introduced
✅ Ready for next user story

**If even ONE item above is not complete, the user story is NOT done.**

---

## 💡 Tips for Best Results

1. **Have the feature folder ready** - Run `/create-feature` first
2. **Follow the order** - Don't skip user stories
3. **NO SKIPPING STEPS** - Every step must be completed
4. **Manual testing is mandatory** - Be prepared to verify UI changes
5. **Provide feedback** - Approve/modify plans before implementation
6. **Review commits** - Check git diff before pushing
7. **Track progress** - STATUS.md keeps you informed

---

## 🚀 Ready to Implement?

Fill in the required information above, and I'll start the systematic implementation process!

**Remember:** Quality over speed. Following the workflow ensures we do it right the first time.
