# US-013: Comments Testing & Polish

**Epic:** Member Profile Enhancement - Equipment & Referral Tracking
**Story ID:** US-013
**Priority:** P2 (Quality)
**Complexity:** Small (~45 minutes)
**Dependencies:** US-009, US-010, US-011, US-012
**Status:** 🔵 NOT STARTED

---

## 📝 User Story

**As a** developer
**I want** comprehensive tests and polished UX for the comments system
**So that** the feature is reliable, maintainable, and provides excellent user experience

---

## 💼 Business Value

**Why This Matters:**

- **Quality:** Ensures comments system works reliably
- **Maintainability:** Tests prevent regressions in future changes
- **User Experience:** Polish creates professional, intuitive interface
- **Confidence:** Allows safe deployment to production

**Impact:**

- Without this: Risk of bugs, poor UX, difficult maintenance
- With this: Production-ready feature with high quality standards

---

## ✅ Acceptance Criteria

### Unit Tests

**File:** `src/features/members/hooks/__tests__/use-member-comments.test.ts`

- [ ] **AC-001:** Test useMemberComments hook:

  ```typescript
  describe("useMemberComments", () => {
    it("fetches comments for a member", async () => {
      // Test implementation
    });

    it("returns empty array when no comments", async () => {
      // Test implementation
    });

    it("handles fetch errors gracefully", async () => {
      // Test implementation
    });
  });
  ```

- [ ] **AC-002:** Test useActiveCommentAlerts hook:

  ```typescript
  describe("useActiveCommentAlerts", () => {
    it("fetches only comments with future due dates", async () => {
      // Test implementation
    });

    it("excludes comments with past due dates", async () => {
      // Test implementation
    });

    it("orders alerts by due date ascending", async () => {
      // Test implementation
    });
  });
  ```

- [ ] **AC-003:** Test useCreateComment mutation:

  ```typescript
  describe("useCreateComment", () => {
    it("creates comment successfully", async () => {
      // Test implementation
    });

    it("invalidates queries after creation", async () => {
      // Test implementation
    });

    it("shows success toast on completion", async () => {
      // Test implementation
    });

    it("shows error toast on failure", async () => {
      // Test implementation
    });
  });
  ```

- [ ] **AC-004:** Test useUpdateComment mutation
- [ ] **AC-005:** Test useDeleteComment mutation

### Component Tests

**File:** `src/features/members/components/__tests__/MemberCommentsCard.test.tsx`

- [ ] **AC-006:** Test MemberCommentsCard rendering:

  ```typescript
  describe("MemberCommentsCard", () => {
    it("renders loading state", () => {
      // Test implementation
    });

    it("renders empty state when no comments", () => {
      // Test implementation
    });

    it("renders list of comments", () => {
      // Test implementation
    });

    it("opens add dialog when button clicked", () => {
      // Test implementation
    });

    it("opens edit dialog when edit clicked", () => {
      // Test implementation
    });

    it("confirms before deleting comment", () => {
      // Test implementation
    });
  });
  ```

**File:** `src/features/members/components/__tests__/CommentDialog.test.tsx`

- [ ] **AC-007:** Test CommentDialog:

  ```typescript
  describe("CommentDialog", () => {
    it("renders in add mode", () => {
      // Test implementation
    });

    it("renders in edit mode with comment data", () => {
      // Test implementation
    });

    it("validates form fields", () => {
      // Test implementation
    });

    it("disables save button when invalid", () => {
      // Test implementation
    });

    it("calls create mutation in add mode", () => {
      // Test implementation
    });

    it("calls update mutation in edit mode", () => {
      // Test implementation
    });

    it("closes dialog after successful save", () => {
      // Test implementation
    });
  });
  ```

### Integration Tests

- [ ] **AC-008:** Test full comment workflow:

  ```typescript
  describe("Comments Integration", () => {
    it("completes full add/edit/delete workflow", async () => {
      // 1. Navigate to member detail page
      // 2. Open add comment dialog
      // 3. Fill form and save
      // 4. Verify comment appears in list
      // 5. Edit comment
      // 6. Verify changes saved
      // 7. Delete comment
      // 8. Verify comment removed
    });
  });
  ```

- [ ] **AC-009:** Test alert integration:

  ```typescript
  describe("Comment Alerts Integration", () => {
    it("creates alert when comment has due date", async () => {
      // 1. Add comment with future due date
      // 2. Verify alert appears in MemberAlertsCard
      // 3. Verify alert type (critical/warning) based on urgency
    });

    it("removes alert when due date passes", async () => {
      // Test with date manipulation
    });
  });
  ```

### UX Polish

- [ ] **AC-010:** Loading states:
  - Skeleton loaders for initial fetch
  - Spinner for mutations (save/delete)
  - Disabled state for forms during save

- [ ] **AC-011:** Empty states:
  - Friendly message when no comments
  - Call-to-action button to add first comment
  - Icon for visual appeal

- [ ] **AC-012:** Error states:
  - Toast notifications for all errors
  - Clear error messages
  - Retry options where appropriate

- [ ] **AC-013:** Confirmation dialogs:
  - Confirm before deleting comment
  - Clear warning about permanent deletion
  - Cancel option always available

- [ ] **AC-014:** Form UX:
  - Clear field labels
  - Helpful placeholders
  - Validation error messages
  - Character count for comment body
  - Date picker with min date (today)
  - Auto-focus on first field

- [ ] **AC-015:** Accessibility:
  - Keyboard navigation works
  - Screen reader labels
  - Focus management in dialogs
  - ARIA attributes where needed

- [ ] **AC-016:** Responsive design:
  - Mobile-friendly layout
  - Touch targets sized appropriately
  - Works on all screen sizes

- [ ] **AC-017:** Dark mode:
  - All colors work in dark mode
  - Icons visible in both modes
  - Proper contrast ratios

### Performance Verification

- [ ] **AC-018:** Performance checks:
  - Component uses React.memo
  - Event handlers use useCallback
  - useMemo for expensive computations
  - No unnecessary re-renders
  - Query caching working
  - Network tab shows proper query deduplication

### Code Quality

- [ ] **AC-019:** Code quality standards:
  - No TypeScript errors
  - No ESLint warnings
  - Proper types (no `any`)
  - Consistent formatting (Prettier)
  - Comments for complex logic
  - Follows project patterns

---

## 🎯 Implementation Guide

### Step 1: Write Unit Tests

1. Create test files for hooks
2. Use Vitest and Testing Library
3. Mock Supabase client
4. Test happy paths and error cases
5. Aim for >80% coverage

### Step 2: Write Component Tests

1. Create test files for components
2. Test rendering and interactions
3. Mock hooks with custom return values
4. Test all user flows
5. Verify accessibility

### Step 3: Add UX Polish

1. Review each component for UX issues
2. Add loading/empty/error states
3. Improve form validation feedback
4. Add confirmation dialogs
5. Test on mobile devices
6. Verify dark mode

### Step 4: Performance Audit

1. Check React DevTools for re-renders
2. Verify query caching
3. Test with large data sets
4. Profile rendering performance
5. Optimize if needed

### Step 5: Code Review

1. Self-review all code
2. Check against CLAUDE.md guidelines
3. Run linter and fix issues
4. Format with Prettier
5. Add comments where helpful

---

## 🧪 Testing Checklist

### Automated Tests

- [ ] All unit tests pass
- [ ] All component tests pass
- [ ] All integration tests pass
- [ ] Test coverage >80%
- [ ] No console errors/warnings in tests

### Manual Testing

- [ ] Add comment (no due date)
- [ ] Add comment (with due date)
- [ ] Edit comment
- [ ] Delete comment
- [ ] Cancel operations
- [ ] Form validation
- [ ] Loading states
- [ ] Error handling
- [ ] Alert integration
- [ ] Mobile responsiveness
- [ ] Dark mode
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

### Browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari
- [ ] Mobile Chrome

### Performance Testing

- [ ] No unnecessary re-renders
- [ ] Query caching works
- [ ] Fast initial load
- [ ] Smooth interactions
- [ ] Network requests optimized

---

## 🚀 Performance Benchmarks

**Target Metrics:**

| Metric                   | Target     | Verified |
| ------------------------ | ---------- | -------- |
| Initial component render | <100ms     | [ ]      |
| Comment list render      | <50ms      | [ ]      |
| Dialog open              | <30ms      | [ ]      |
| Form submission          | <500ms     | [ ]      |
| Query cache hit          | <10ms      | [ ]      |
| Unnecessary re-renders   | 0          | [ ]      |
| Component size           | <300 lines | [ ]      |

---

## 📝 Notes

### Testing Best Practices

- Test user behavior, not implementation
- Mock external dependencies (Supabase)
- Use data-testid sparingly (prefer semantic queries)
- Test error cases and edge cases
- Keep tests simple and readable

### UX Best Practices

- Show loading feedback for all async operations
- Provide clear error messages
- Confirm destructive actions
- Auto-focus form fields
- Use consistent terminology
- Follow existing app patterns

### Code Quality Best Practices

- Follow CLAUDE.md performance guidelines
- Use TypeScript strictly (no `any`)
- Keep components focused and small
- Extract reusable logic to hooks
- Write self-documenting code
- Add comments for complex logic only

---

## 🔍 Code Examples

### Test Example

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useMemberComments } from "../use-member-comments";
import * as utils from "@/features/database/lib/utils";

vi.mock("@/features/database/lib/utils");

describe("useMemberComments", () => {
  it("fetches comments for a member", async () => {
    const mockComments = [
      {
        id: "1",
        member_id: "member-1",
        author: "Test User",
        body: "Test comment",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      },
    ];

    vi.mocked(utils.fetchMemberComments).mockResolvedValue(mockComments);

    const { result } = renderHook(() => useMemberComments("member-1"));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockComments);
    });
  });
});
```

### UX Polish Example

```typescript
// Empty state with call-to-action
{comments?.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <MessageSquare className="text-muted-foreground mb-4 h-12 w-12" />
    <h3 className="mb-2 text-lg font-medium">No comments yet</h3>
    <p className="text-muted-foreground mb-4 text-sm">
      Add notes and reminders about this member
    </p>
    <Button onClick={handleAddComment}>
      <Plus className="mr-2 h-4 w-4" />
      Add Your First Comment
    </Button>
  </div>
) : (
  // Comment list
)}
```
