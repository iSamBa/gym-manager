# AGENT-GUIDE.md - Dashboard Styling Rework

## 🤖 Agent Implementation Workflow

This guide provides a **systematic, step-by-step workflow** for implementing the Dashboard Styling Rework feature. Follow this guide exactly to ensure consistent, high-quality implementation.

---

## 📋 Pre-Implementation Checklist

**Before starting ANY user story, verify:**

- [ ] Read `CLAUDE.md` completely (project standards)
- [ ] Read `START-HERE.md` (feature overview)
- [ ] Read `README.md` (technical architecture)
- [ ] **Git branch created** (see Phase 0 below - MANDATORY FIRST STEP)
- [ ] Development server is running (`npm run dev`)
- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)

---

## 🎯 Implementation Order

**CRITICAL:** User stories MUST be completed in this order:

1. **US-001** - Sidebar Section Organization (foundation)
2. **US-002** - Bottom Sidebar Utilities (depends on US-001 structure)
3. **US-003** - Dark Theme Contrast (independent)

---

## 📝 User Story Implementation Template

For each user story, follow this workflow:

### Phase 0: Git Branch Setup (MANDATORY - DO THIS FIRST!)

**🚨 CRITICAL: This MUST be done BEFORE any code changes!**

1. **Verify current branch and status**

   ```bash
   git status
   git branch --show-current
   ```

2. **Create feature branch (if not already created)**

   ```bash
   # Create and switch to feature branch
   git checkout -b feature/dashboard-styling-rework

   # Verify you're on the correct branch
   git branch --show-current
   # Expected output: feature/dashboard-styling-rework
   ```

3. **Verify branch creation**

   ```bash
   # List all branches (current branch marked with *)
   git branch

   # Confirm you're NOT on main
   git branch --show-current | grep -q "main" && echo "❌ ERROR: Still on main!" || echo "✅ On feature branch"
   ```

4. **Document branch name**
   - Branch name: `feature/dashboard-styling-rework`
   - Base branch: `main`
   - Created: [current date]

**⚠️ If you're already on main with commits:**

- STOP immediately
- Ask user how to handle existing commits
- Options: create branch from current state, stash changes, etc.

**✅ Checklist before proceeding:**

- [ ] Feature branch created
- [ ] Verified current branch is NOT main
- [ ] Branch name follows convention: `feature/dashboard-styling-rework`
- [ ] Ready to start making changes

---

### Phase 1: Discovery & Planning

1. **Read the user story file completely**

   ```bash
   cat user_stories/dashboard-styling-rework/US-00X-{name}.md
   ```

2. **Identify affected files**
   - Use Glob tool to find existing components
   - Read current implementation
   - Note dependencies

3. **Create implementation checklist**
   - Break acceptance criteria into tasks
   - Identify shadcn/ui components needed
   - Plan component structure

4. **Update STATUS.md**

   ```markdown
   ## US-00X: {Name}

   - Status: In Progress
   - Started: {date}
   ```

### Phase 2: Implementation

5. **Install/verify shadcn/ui components**

   ```bash
   # Check if component exists
   ls src/components/ui/{component}.tsx

   # Install if needed
   npx shadcn@latest add {component}
   ```

6. **Implement changes**
   - Modify existing components OR create new ones
   - Follow performance guidelines (memo, useCallback, useMemo)
   - Use TypeScript - NO `any` types
   - Keep components under 300 lines

7. **Test visually**

   ```bash
   # Development server should be running
   npm run dev

   # Test in browser at http://localhost:3000
   # Check both light and dark themes
   # Test responsive behavior
   ```

8. **Fix linting errors**
   ```bash
   npm run lint
   ```

### Phase 3: Testing & Validation

9. **Run tests**

   ```bash
   npm test
   ```

10. **Verify acceptance criteria**
    - Check each criterion from user story
    - Test edge cases
    - Verify no regressions

11. **Visual QA checklist**
    - [ ] Light theme works correctly
    - [ ] Dark theme works correctly
    - [ ] Responsive on mobile (< 768px)
    - [ ] Responsive on tablet (768px - 1024px)
    - [ ] Responsive on desktop (> 1024px)
    - [ ] No console errors or warnings
    - [ ] Matches design references

### Phase 4: Completion

12. **Update STATUS.md**

    ```markdown
    ## US-00X: {Name}

    - Status: Completed
    - Started: {date}
    - Completed: {date}
    - Notes: {any important notes}
    ```

13. **Commit changes**

    ```bash
    git add .
    git commit -m "feat(dashboard): implement US-00X {name}

    - {achievement 1}
    - {achievement 2}
    - {achievement 3}

    🤖 Generated with [Claude Code](https://claude.com/claude-code)

    Co-Authored-By: Claude <noreply@anthropic.com>"
    ```

14. **Move to next user story**

---

## 🔍 User Story Summaries

### US-001: Sidebar Section Organization

**Goal:** Group navigation items into logical sections

**Key Tasks:**

1. Identify navigation groupings (Home section, Documents section)
2. Add section headers/labels
3. Add visual separators between sections
4. Update Sidebar component structure

**Files to Modify:**

- `src/components/layout/Sidebar.tsx` (or similar)
- Possibly create section component if needed

**shadcn/ui Components:**

- `Separator` (for section dividers)
- Potentially `Accordion` (if sections are collapsible)

**Acceptance Criteria:**

- Navigation items are grouped into sections
- Section labels are visible and styled
- Visual separators exist between sections
- Matches design reference (Image #4)

---

### US-002: Bottom Sidebar Utilities

**Goal:** Add Settings and User Profile at bottom of sidebar

**Key Tasks:**

1. Create bottom section in sidebar layout
2. Add Settings link
3. Add User Profile component
4. Create user dropdown menu (Account, Billing, Notifications, Log out)
5. Implement logout functionality

**Files to Modify:**

- `src/components/layout/Sidebar.tsx`
- Create `src/components/layout/UserProfileDropdown.tsx` (or similar)

**shadcn/ui Components:**

- `DropdownMenu` (for user profile menu)
- `Avatar` (for user profile picture)
- `Button` (for settings link)

**Acceptance Criteria:**

- Settings and User Profile are fixed at sidebar bottom
- User profile shows avatar, name, email
- Dropdown menu has Account, Billing, Notifications, Log out
- Log out functionality works
- Matches design references (Images #1, #3)

---

### US-003: Dark Theme Contrast Improvements

**Goal:** Replace pure black with gray color palette

**Key Tasks:**

1. Identify current dark theme color variables
2. Update Tailwind config with gray palette
3. Update CSS variables for dark mode
4. Test all components in new dark theme
5. Ensure sufficient contrast for accessibility

**Files to Modify:**

- `src/app/globals.css` (CSS variables)
- `tailwind.config.ts` (color palette)

**shadcn/ui Components:**

- No new components (theme update only)

**Acceptance Criteria:**

- Dark theme uses gray tones instead of pure black
- Background has visible contrast with cards/panels
- Text remains readable (WCAG AA compliance)
- Matches design reference (Image #2)

---

## 🛠️ Common Patterns

### Adding a New Section to Sidebar

```tsx
// Example structure
<nav className="flex flex-col gap-4">
  {/* Section 1 */}
  <div>
    <h4 className="mb-2 px-4 text-sm font-semibold">Section Name</h4>
    <div className="space-y-1">
      <NavItem href="/path" icon={Icon}>
        Label
      </NavItem>
      {/* More items */}
    </div>
  </div>

  <Separator />

  {/* Section 2 */}
  <div>{/* Similar structure */}</div>
</nav>
```

### Creating User Profile Dropdown

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserProfileDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src="/avatar.jpg" />
          <AvatarFallback>UN</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Account</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuItem>Notifications</DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Updating Dark Theme Colors

```css
/* globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    /* ... other light theme colors */
  }

  .dark {
    --background: 0 0% 10%; /* Gray instead of 0% (black) */
    --foreground: 0 0% 98%;
    --card: 0 0% 14%; /* Lighter gray for cards */
    /* ... other dark theme colors */
  }
}
```

---

## ⚠️ Common Pitfalls

### ❌ Don't Do This:

1. **Creating custom CSS components**

   ```tsx
   // ❌ Bad
   <div className="custom-sidebar-section">
   ```

2. **Using inline styles**

   ```tsx
   // ❌ Bad
   <div style={{ backgroundColor: '#1a1a1a' }}>
   ```

3. **Hardcoding colors**

   ```tsx
   // ❌ Bad
   <div className="bg-[#1a1a1a]">
   ```

4. **Skipping responsive design**
   ```tsx
   // ❌ Bad - no mobile consideration
   <div className="w-64">
   ```

### ✅ Do This Instead:

1. **Use shadcn/ui components**

   ```tsx
   // ✅ Good
   <Separator className="my-4" />
   ```

2. **Use Tailwind utilities**

   ```tsx
   // ✅ Good
   <div className="bg-background">
   ```

3. **Use CSS variables**

   ```tsx
   // ✅ Good
   <div className="bg-card">
   ```

4. **Include responsive classes**
   ```tsx
   // ✅ Good
   <div className="w-full md:w-64">
   ```

---

## 🔄 Workflow Summary

```
┌─────────────────────────────────────────┐
│ PHASE 0: GIT BRANCH SETUP (FIRST!)     │
│ 0. Create feature branch                │
│ 0. Verify NOT on main                   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ PHASE 1: DISCOVERY & PLANNING           │
│ 1. Read user story                      │
│ 2. Identify affected files              │
│ 3. Create implementation checklist      │
│ 4. Update STATUS.md (In Progress)       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ PHASE 2: IMPLEMENTATION                 │
│ 5. Install shadcn/ui components         │
│ 6. Implement changes                    │
│ 7. Test visually                        │
│ 8. Fix linting errors                   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ PHASE 3: TESTING & VALIDATION           │
│ 9. Run tests                            │
│ 10. Verify acceptance criteria          │
│ 11. Visual QA checklist                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ PHASE 4: COMPLETION                     │
│ 12. Update STATUS.md (Completed)        │
│ 13. Commit changes                      │
│ 14. Move to next user story             │
└─────────────────────────────────────────┘
```

---

## 🚀 Ready to Start?

1. Ensure pre-implementation checklist is complete
2. Start with US-001: `cat user_stories/dashboard-styling-rework/US-001-sidebar-sections.md`
3. Follow the implementation template above
4. Update STATUS.md as you progress

**Good luck! 🎉**
