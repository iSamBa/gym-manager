# US-010: Comments CRUD Operations

**Epic:** Member Profile Enhancement - Equipment & Referral Tracking
**Story ID:** US-010
**Priority:** P0 (Must Have)
**Complexity:** Medium (~1 hour)
**Dependencies:** US-009
**Status:** 🔵 NOT STARTED

---

## 📝 User Story

**As a** gym administrator or trainer
**I want** to create, read, update, and delete member comments
**So that** I can manage notes and alerts for members through the application

---

## 💼 Business Value

**Why This Matters:**

- **Data Access:** Provides programmatic interface to comments data
- **React Integration:** Enables React components to use comments
- **Type Safety:** Ensures type-safe database operations
- **Performance:** Implements optimized queries with TanStack Query caching

**Impact:**

- Without this: No way to interact with comments from UI
- With this: Full CRUD operations available for UI components

---

## ✅ Acceptance Criteria

### Database Utility Functions

**File:** `src/features/database/lib/utils.ts`

- [ ] **AC-001:** `fetchMemberComments(memberId)` function:

  ```typescript
  /**
   * Fetch all comments for a specific member, ordered by creation date (newest first)
   */
  export async function fetchMemberComments(
    memberId: string
  ): Promise<MemberComment[]> {
    const { data, error } = await supabase
      .from("member_comments")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    if (error) throw new DatabaseError(error.message, error.code);
    return data || [];
  }
  ```

- [ ] **AC-002:** `fetchActiveCommentAlerts(memberId)` function:

  ```typescript
  /**
   * Fetch comments with due dates in the future (active alerts)
   */
  export async function fetchActiveCommentAlerts(
    memberId: string
  ): Promise<MemberComment[]> {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("member_comments")
      .select("*")
      .eq("member_id", memberId)
      .gte("due_date", today)
      .order("due_date", { ascending: true });

    if (error) throw new DatabaseError(error.message, error.code);
    return data || [];
  }
  ```

- [ ] **AC-003:** `createMemberComment(data)` function:

  ```typescript
  /**
   * Create a new comment for a member
   */
  export async function createMemberComment(
    data: Omit<MemberComment, "id" | "created_at" | "updated_at">
  ): Promise<MemberComment> {
    const { data: comment, error } = await supabase
      .from("member_comments")
      .insert([data])
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    if (!comment) throw new DatabaseError("Failed to create comment");
    return comment;
  }
  ```

- [ ] **AC-004:** `updateMemberComment(id, data)` function:

  ```typescript
  /**
   * Update an existing comment
   */
  export async function updateMemberComment(
    id: string,
    data: Partial<Pick<MemberComment, "author" | "body" | "due_date">>
  ): Promise<MemberComment> {
    const { data: comment, error } = await supabase
      .from("member_comments")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    if (!comment) throw new DatabaseError("Comment not found");
    return comment;
  }
  ```

- [ ] **AC-005:** `deleteMemberComment(id)` function:

  ```typescript
  /**
   * Delete a comment
   */
  export async function deleteMemberComment(id: string): Promise<void> {
    const { error } = await supabase
      .from("member_comments")
      .delete()
      .eq("id", id);

    if (error) throw new DatabaseError(error.message, error.code);
  }
  ```

### React Hooks

**File:** `src/features/members/hooks/use-member-comments.ts`

- [ ] **AC-006:** `useMemberComments(memberId)` query hook:

  ```typescript
  import { useQuery } from "@tanstack/react-query";
  import { fetchMemberComments } from "@/features/database/lib/utils";

  export function useMemberComments(memberId: string) {
    return useQuery({
      queryKey: ["member-comments", memberId],
      queryFn: () => fetchMemberComments(memberId),
      staleTime: 30000, // 30 seconds
    });
  }
  ```

- [ ] **AC-007:** `useActiveCommentAlerts(memberId)` query hook:

  ```typescript
  export function useActiveCommentAlerts(memberId: string) {
    return useQuery({
      queryKey: ["member-comment-alerts", memberId],
      queryFn: () => fetchActiveCommentAlerts(memberId),
      refetchInterval: 60000, // Refresh every minute
    });
  }
  ```

- [ ] **AC-008:** `useCreateComment()` mutation hook:

  ```typescript
  import { useMutation, useQueryClient } from "@tanstack/react-query";
  import { createMemberComment } from "@/features/database/lib/utils";
  import { toast } from "sonner";

  export function useCreateComment() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: createMemberComment,
      onSuccess: (data) => {
        // Invalidate member comments query
        queryClient.invalidateQueries({
          queryKey: ["member-comments", data.member_id],
        });
        // Invalidate alerts if due date is set
        if (data.due_date) {
          queryClient.invalidateQueries({
            queryKey: ["member-comment-alerts", data.member_id],
          });
        }
        toast.success("Comment added successfully");
      },
      onError: (error: Error) => {
        toast.error(`Failed to add comment: ${error.message}`);
      },
    });
  }
  ```

- [ ] **AC-009:** `useUpdateComment()` mutation hook:

  ```typescript
  export function useUpdateComment() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: string;
        data: Partial<Pick<MemberComment, "author" | "body" | "due_date">>;
      }) => updateMemberComment(id, data),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["member-comments", data.member_id],
        });
        queryClient.invalidateQueries({
          queryKey: ["member-comment-alerts", data.member_id],
        });
        toast.success("Comment updated successfully");
      },
      onError: (error: Error) => {
        toast.error(`Failed to update comment: ${error.message}`);
      },
    });
  }
  ```

- [ ] **AC-010:** `useDeleteComment()` mutation hook:

  ```typescript
  export function useDeleteComment() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, memberId }: { id: string; memberId: string }) =>
        deleteMemberComment(id),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ["member-comments", variables.memberId],
        });
        queryClient.invalidateQueries({
          queryKey: ["member-comment-alerts", variables.memberId],
        });
        toast.success("Comment deleted successfully");
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete comment: ${error.message}`);
      },
    });
  }
  ```

- [ ] **AC-011:** Export from `src/features/members/hooks/index.ts`:
  ```typescript
  export {
    useMemberComments,
    useActiveCommentAlerts,
    useCreateComment,
    useUpdateComment,
    useDeleteComment,
  } from "./use-member-comments";
  ```

---

## 🎯 Implementation Guide

### Step 1: Add Database Functions

1. Open `src/features/database/lib/utils.ts`
2. Add the 5 database utility functions (see AC-001 to AC-005)
3. Import `MemberComment` type from `./types`

### Step 2: Create Hooks File

1. Create `src/features/members/hooks/use-member-comments.ts`
2. Implement all 5 hooks (see AC-006 to AC-010)
3. Use TanStack Query patterns from existing hooks
4. Follow performance guidelines (use `React.memo`, `useCallback`, etc.)

### Step 3: Update Exports

1. Open `src/features/members/hooks/index.ts`
2. Add export statement for new hooks (see AC-011)

### Step 4: Manual Testing

```typescript
// Test in browser console or temporary component
import { useMemberComments, useCreateComment } from "@/features/members/hooks";

// In component
const { data: comments } = useMemberComments("member-uuid");
const createComment = useCreateComment();

// Create test comment
createComment.mutate({
  member_id: "member-uuid",
  author: "Test User",
  body: "This is a test comment",
  due_date: "2025-12-31", // Optional
  created_by: "user-uuid", // Optional
});
```

---

## 🧪 Testing Checklist

- [ ] Database functions compile without TypeScript errors
- [ ] Hooks compile without TypeScript errors
- [ ] Can fetch comments for a member
- [ ] Can fetch active alerts for a member
- [ ] Can create a new comment
- [ ] Can update an existing comment
- [ ] Can delete a comment
- [ ] Query invalidation works (UI updates after mutations)
- [ ] Toast notifications appear on success/error
- [ ] Comments ordered correctly (newest first)
- [ ] Alerts ordered correctly (earliest due date first)
- [ ] Handles empty results gracefully
- [ ] Handles database errors gracefully

---

## 🚀 Performance Considerations

**Must follow CLAUDE.md guidelines:**

- ✅ Use TanStack Query for caching
- ✅ Implement query key factory pattern
- ✅ Set appropriate staleTime (30s for comments)
- ✅ Use optimistic updates where possible
- ✅ Invalidate queries after mutations
- ✅ Limit data fetching to required fields only

**Query Keys Pattern:**

```typescript
export const commentKeys = {
  all: ["member-comments"] as const,
  lists: () => [...commentKeys.all, "list"] as const,
  list: (memberId: string) => [...commentKeys.lists(), memberId] as const,
  alerts: (memberId: string) => ["member-comment-alerts", memberId] as const,
};
```

---

## 📝 Notes

- All CRUD operations require admin or trainer role (enforced by RLS)
- Comments are ordered newest first for display
- Alerts are ordered by due date (earliest first)
- Query invalidation ensures UI stays in sync
- Toast notifications provide user feedback
- Error handling follows project standards
