---
description: "Systematically implement a user story following AGENT-GUIDE workflow"
---

# Implement User Story

I'll guide you through implementing a user story using our proven systematic workflow. This ensures quality, completeness, and adherence to project standards.

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

## 🧪 Step 4: Testing Phase (MANDATORY)

I will run ALL tests from the user story's "Testing Criteria":

### Test Execution

```
✓ Database tests (SQL queries if applicable)
✓ Unit tests (npm test -- <file>)
✓ Type safety (npx tsc --noEmit)
✓ Linting (npm run lint)
✓ Build (npm run build)
✓ Performance benchmarks (if specified)
```

### Test Results Format

```
Unit Tests: 12/12 passing ✓
Integration Tests: 5/5 passing ✓
Type Safety: No errors ✓
Linting: 0 errors, 0 warnings ✓
Build: Successful ✓
Performance: Query <500ms ✓
```

**If any test fails, I'll stop and report the issue.**

---

## ✅ Step 5: Definition of Done Verification

I will go through EVERY checkbox in "Definition of Done":

```
Definition of Done Checklist:
✓ All acceptance criteria met and verified
✓ All tests passing (unit, integration, performance)
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

**Only proceed when ALL checkboxes are checked.**

---

## 📝 Step 6: Completion

Once all DoD items are verified, I will:

### 1. Update STATUS.md

```markdown
| US-001 | Database Foundation | 🟢 Complete | Claude | 2025-01-15 | 2025-01-15 | All tests passing |
```

### 2. Create Commit

```
feat({scope}): Implement US-{number} {title}

{description of changes}

Tests: {test results}
Performance: {benchmarks}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 3. Ask User

**"User story US-{number} complete! Push changes? (yes/no)"**

### 4. Show Next Steps

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

STATUS.md updated ✓
Commit created ✓
```

---

## 🎯 Success Criteria

A user story is complete when:

✅ All acceptance criteria verified
✅ All tests passing (100%)
✅ All DoD checkboxes checked
✅ STATUS.md updated with metrics
✅ Code committed with proper message
✅ No regressions introduced
✅ Ready for next user story

---

## 💡 Tips for Best Results

1. **Have the feature folder ready** - Run `/create-feature` first
2. **Follow the order** - Don't skip user stories
3. **Provide feedback** - Approve/modify plans before implementation
4. **Review commits** - Check git diff before pushing
5. **Track progress** - STATUS.md keeps you informed

---

## 🚀 Ready to Implement?

Fill in the required information above, and I'll start the systematic implementation process!

**Remember:** Quality over speed. Following the workflow ensures we do it right the first time.
