# US-011: Comments UI Component

**Epic:** Member Profile Enhancement - Equipment & Referral Tracking
**Story ID:** US-011
**Priority:** P1 (Required)
**Complexity:** Medium (~1.5 hours)
**Dependencies:** US-009, US-010
**Status:** 🔵 NOT STARTED

---

## 📝 User Story

**As a** gym administrator or trainer
**I want** to view, add, edit, and delete comments on a member's profile page
**So that** I can track important notes and set reminders about members

---

## 💼 Business Value

**Why This Matters:**

- **User Interface:** Provides intuitive UI for managing member comments
- **Visibility:** Makes member notes easily accessible to staff
- **Workflow:** Streamlines communication about members between staff
- **Reminders:** Enables setting due-date alerts for follow-ups

**Impact:**

- Without this: Comments data exists but no UI to use it
- With this: Complete comments system accessible to staff

---

## ✅ Acceptance Criteria

### MemberCommentsCard Component

**File:** `src/features/members/components/MemberCommentsCard.tsx`

- [ ] **AC-001:** Component displays list of member comments:

  ```typescript
  interface MemberCommentsCardProps {
    member: MemberWithSubscription;
  }

  export const MemberCommentsCard = memo(function MemberCommentsCard({
    member,
  }: MemberCommentsCardProps) {
    // Implementation
  });
  ```

- [ ] **AC-002:** Component features:
  - Shows loading state while fetching comments
  - Shows empty state when no comments exist
  - Displays comments in reverse chronological order (newest first)
  - Each comment shows: date, author, body, due date (if set)
  - Edit/Delete buttons on each comment (inline or dropdown menu)
  - "Add Comment" button at top

- [ ] **AC-003:** Comment display format:

  ```tsx
  <div className="comment-item">
    <div className="comment-header">
      <span className="author">{comment.author}</span>
      <span className="date">{formatDate(comment.created_at)}</span>
      {comment.due_date && (
        <Badge variant="secondary">Due: {formatDate(comment.due_date)}</Badge>
      )}
    </div>
    <div className="comment-body">{comment.body}</div>
    <div className="comment-actions">
      <Button variant="ghost" size="sm" onClick={handleEdit}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={handleDelete}>
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  </div>
  ```

- [ ] **AC-004:** Component uses React.memo for performance:

  ```typescript
  export const MemberCommentsCard = memo(function MemberCommentsCard({
    member,
  }: MemberCommentsCardProps) {
    // ...
  });
  ```

- [ ] **AC-005:** Event handlers use useCallback:

  ```typescript
  const handleAddComment = useCallback(() => {
    setDialogMode("add");
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((comment: MemberComment) => {
    setEditingComment(comment);
    setDialogMode("edit");
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (confirm("Are you sure you want to delete this comment?")) {
        await deleteComment.mutateAsync({ id: commentId, memberId: member.id });
      }
    },
    [member.id, deleteComment]
  );
  ```

### CommentDialog Component

**File:** `src/features/members/components/CommentDialog.tsx`

- [ ] **AC-006:** Reusable dialog for add/edit modes:

  ```typescript
  interface CommentDialogProps {
    member: MemberWithSubscription;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "add" | "edit";
    comment?: MemberComment; // Required for edit mode
  }

  export function CommentDialog({
    member,
    isOpen,
    onOpenChange,
    mode,
    comment,
  }: CommentDialogProps) {
    // Implementation
  }
  ```

- [ ] **AC-007:** Form fields:
  - **Author** (Text Input, required): Name of person adding comment
  - **Comment** (Textarea, required): Comment text (multiline, min 10 chars)
  - **Due Date** (Date Picker, optional): When set, creates an alert

- [ ] **AC-008:** Form validation:
  - Author cannot be empty
  - Comment must be at least 10 characters
  - Due date must be today or future (if provided)

- [ ] **AC-009:** Dialog actions:
  - **Save** button: Creates or updates comment, closes dialog
  - **Cancel** button: Closes dialog without saving
  - Loading state during save operation
  - Disabled save button if validation fails

- [ ] **AC-010:** Initial values for edit mode:
  ```typescript
  const [formData, setFormData] = useState({
    author: comment?.author || "",
    body: comment?.body || "",
    due_date: comment?.due_date || undefined,
  });
  ```

### Integration with Member Detail Page

**File:** `src/app/members/[id]/page.tsx`

- [ ] **AC-011:** Add MemberCommentsCard to Profile tab:

  ```tsx
  <TabsContent value="profile" className="space-y-6">
    <ContactInformationCard member={member} />
    <PersonalDetailsCard member={member} />
    <Card>{/* Equipment & Referral Card */}</Card>
    <MemberCommentsCard member={member} /> {/* NEW */}
    {member.gender === "female" && <Card>{/* Training Preferences */}</Card>}
  </TabsContent>
  ```

- [ ] **AC-012:** Import MemberCommentsCard:
  ```typescript
  import {
    MemberProfileHeader,
    EditMemberDialog,
    // ... other imports
    MemberCommentsCard, // NEW
  } from "@/features/members/components";
  ```

### Component Exports

**File:** `src/features/members/components/index.ts`

- [ ] **AC-013:** Export new components:
  ```typescript
  export { MemberCommentsCard } from "./MemberCommentsCard";
  export { CommentDialog } from "./CommentDialog";
  ```

---

## 🎯 Implementation Guide

### Step 1: Create CommentDialog Component

1. Create `src/features/members/components/CommentDialog.tsx`
2. Use shadcn/ui Dialog, Input, Textarea, Button components
3. Add form state management with useState
4. Implement validation logic
5. Connect to useCreateComment and useUpdateComment hooks
6. Add loading and error states

**Example Structure:**

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { useCreateComment, useUpdateComment } from "@/features/members/hooks";

export function CommentDialog({ member, isOpen, onOpenChange, mode, comment }: CommentDialogProps) {
  const [formData, setFormData] = useState({...});
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();

  const handleSave = async () => {
    // Validation
    if (formData.body.trim().length < 10) {
      toast.error("Comment must be at least 10 characters");
      return;
    }

    // Create or update
    if (mode === "add") {
      await createComment.mutateAsync({
        member_id: member.id,
        author: formData.author,
        body: formData.body,
        due_date: formData.due_date,
        created_by: currentUser.id, // Get from auth context
      });
    } else {
      await updateComment.mutateAsync({
        id: comment.id,
        data: {
          author: formData.author,
          body: formData.body,
          due_date: formData.due_date,
        },
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Form fields */}
    </Dialog>
  );
}
```

### Step 2: Create MemberCommentsCard Component

1. Create `src/features/members/components/MemberCommentsCard.tsx`
2. Use shadcn/ui Card, Button components
3. Connect to useMemberComments and useDeleteComment hooks
4. Implement comment list display
5. Add CommentDialog integration
6. Add loading and empty states

**Example Structure:**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Edit, Trash } from "lucide-react";
import { useMemberComments, useDeleteComment } from "@/features/members/hooks";
import { CommentDialog } from "./CommentDialog";

export const MemberCommentsCard = memo(function MemberCommentsCard({
  member,
}: MemberCommentsCardProps) {
  const { data: comments, isLoading } = useMemberComments(member.id);
  const deleteComment = useDeleteComment();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingComment, setEditingComment] = useState<
    MemberComment | undefined
  >();

  if (isLoading) {
    return <LoadingSkeleton className="h-64" />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Comments & Notes
            </span>
            <Button onClick={handleAddComment}>Add Comment</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comments?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No comments yet</p>
          ) : (
            <div className="space-y-4">
              {comments?.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onEdit={() => handleEdit(comment)}
                  onDelete={() => handleDelete(comment.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CommentDialog
        member={member}
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        comment={editingComment}
      />
    </>
  );
});
```

### Step 3: Integrate into Member Detail Page

1. Open `src/app/members/[id]/page.tsx`
2. Import MemberCommentsCard
3. Add to Profile tab after Equipment & Referral card

### Step 4: Export Components

1. Open `src/features/members/components/index.ts`
2. Add exports for both new components

---

## 🧪 Testing Checklist

### Manual Testing

- [ ] Can view all comments for a member
- [ ] Comments sorted newest first
- [ ] Can add a new comment (no due date)
- [ ] Can add a comment with due date
- [ ] Can edit an existing comment
- [ ] Can delete a comment
- [ ] Delete confirmation works
- [ ] Loading states display correctly
- [ ] Empty state displays when no comments
- [ ] Due date badge displays correctly
- [ ] Form validation works (empty fields rejected)
- [ ] Toast notifications appear on success/error
- [ ] Dialog closes after successful save
- [ ] UI updates immediately after add/edit/delete

### Visual Testing

- [ ] Component matches design system
- [ ] Responsive on mobile/tablet/desktop
- [ ] Dark mode support works
- [ ] Comments are readable and well-formatted
- [ ] Buttons have appropriate hover states
- [ ] Date formatting is consistent with app

### Edge Cases

- [ ] Member with 0 comments
- [ ] Member with 50+ comments
- [ ] Very long comment body (test text wrapping)
- [ ] Comment with past due date (should not show in alerts)
- [ ] Comment with future due date (should show in alerts)
- [ ] Network error handling
- [ ] Concurrent edits (multiple users)

---

## 🚀 Performance Considerations

**Must follow CLAUDE.md guidelines:**

- ✅ Use React.memo for MemberCommentsCard
- ✅ Use useCallback for all event handlers
- ✅ Avoid inline function creation in renders
- ✅ Use TanStack Query for automatic caching
- ✅ Implement optimistic updates if needed
- ✅ Keep component under 300 lines

---

## 📝 Notes

- Only admins and trainers can add/edit/delete comments
- Comments with due dates will appear in MemberAlertsCard (US-012)
- Consider adding rich text editor for comment body in future
- Consider adding @mentions for team collaboration in future
- Comment author is free-form text (not linked to user_profiles yet)
