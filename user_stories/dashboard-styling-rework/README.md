# Dashboard Styling Rework - Technical Documentation

## 📖 Overview

This document provides technical architecture, design decisions, and implementation details for the Dashboard Styling Rework feature.

---

## 🎯 Feature Goals

### Primary Objectives

1. **Improve Navigation Hierarchy** - Organize sidebar items into logical sections
2. **Enhance Accessibility** - Add persistent Settings and User Profile utilities
3. **Improve Visual Contrast** - Replace pure black dark theme with gray palette

### Success Metrics

- Navigation findability improved (user testing)
- Dark theme contrast ratio meets WCAG AA (4.5:1 minimum)
- Zero visual regressions on existing pages
- 100% responsive on all screen sizes

---

## 🏗️ Architecture

### Component Structure

```
src/components/layout/
├── Sidebar.tsx                    # Main sidebar container (MODIFIED)
│   ├── SidebarSection.tsx        # Section grouping component (NEW)
│   ├── SidebarNavItem.tsx        # Individual nav item (EXISTS)
│   └── UserProfileDropdown.tsx   # User profile menu (NEW)
├── MainLayout.tsx                # App layout wrapper (MODIFIED)
└── Header.tsx                    # Top header (NO CHANGES)
```

### File Changes

| File                                            | Type     | Description                             |
| ----------------------------------------------- | -------- | --------------------------------------- |
| `src/components/layout/Sidebar.tsx`             | Modified | Add section structure, bottom utilities |
| `src/components/layout/UserProfileDropdown.tsx` | New      | User profile dropdown menu              |
| `src/app/globals.css`                           | Modified | Dark theme color variables              |
| `tailwind.config.ts`                            | Modified | Color palette configuration             |

---

## 🎨 Design System

### Color Palette (Dark Theme)

**Current (Pure Black):**

```css
.dark {
  --background: 0 0% 0%; /* Pure black */
  --card: 0 0% 5%; /* Near black */
  --foreground: 0 0% 100%; /* Pure white */
}
```

**New (Gray Palette):**

```css
.dark {
  --background: 0 0% 10%; /* Dark gray */
  --card: 0 0% 14%; /* Lighter gray for cards */
  --muted: 0 0% 18%; /* Muted backgrounds */
  --foreground: 0 0% 98%; /* Off-white text */
}
```

**Rationale:**

- 10% background provides sufficient contrast with 14% cards
- Maintains readability while reducing eye strain
- Matches modern design patterns (GitHub, VS Code dark themes)

### Sidebar Sections

**Section Groupings:**

1. **Home Section**
   - Home
   - Dashboard
   - Lifecycle
   - Analytics
   - Projects
   - Team

2. **Documents Section**
   - Data Library
   - Reports
   - Word Assistant
   - More

3. **Bottom Utilities**
   - Settings
   - User Profile

**Visual Separators:**

- `<Separator />` component between sections
- Section headers with subtle text styling
- Consistent spacing (padding, margins)

---

## 🧩 Component Specifications

### Sidebar.tsx

**Responsibilities:**

- Render navigation sections
- Position bottom utilities (sticky)
- Handle responsive behavior

**Props:**

```typescript
interface SidebarProps {
  className?: string;
}
```

**Structure:**

```tsx
<aside className="sidebar">
  <div className="sidebar-content">
    {/* Logo/Brand */}
    <SidebarSection title="Home">{/* Home nav items */}</SidebarSection>

    <Separator />

    <SidebarSection title="Documents">
      {/* Document nav items */}
    </SidebarSection>
  </div>

  {/* Bottom utilities (sticky) */}
  <div className="sidebar-footer">
    <Separator />
    <Link href="/settings">Settings</Link>
    <UserProfileDropdown />
  </div>
</aside>
```

**Styling Considerations:**

- Use `sticky` positioning for bottom footer
- Flexbox for vertical layout with `space-between`
- Responsive: collapse to hamburger on mobile

---

### UserProfileDropdown.tsx

**Responsibilities:**

- Display user avatar, name, email
- Dropdown menu with utilities
- Handle logout action

**Props:**

```typescript
interface UserProfileDropdownProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout: () => void;
}
```

**Structure:**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="user-trigger">
      <Avatar>
        <AvatarImage src={user.avatar} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="user-info">
        <p className="user-name">{user.name}</p>
        <p className="user-email">{user.email}</p>
      </div>
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end">
    <DropdownMenuItem>
      <User className="mr-2" />
      Account
    </DropdownMenuItem>
    <DropdownMenuItem>
      <CreditCard className="mr-2" />
      Billing
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Bell className="mr-2" />
      Notifications
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={onLogout}>
      <LogOut className="mr-2" />
      Log out
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Integration with Auth:**

```tsx
import { useAuth } from "@/hooks/use-auth";

export function UserProfileDropdown() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return <DropdownMenu>{/* ... use user data and signOut */}</DropdownMenu>;
}
```

---

### SidebarSection.tsx (Optional)

**Responsibilities:**

- Group related navigation items
- Display section title
- Provide consistent spacing

**Props:**

```typescript
interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
}
```

**Structure:**

```tsx
<div className="sidebar-section">
  {title && <h4 className="section-title">{title}</h4>}
  <nav className="section-nav">{children}</nav>
</div>
```

---

## 🎯 Implementation Details

### US-001: Sidebar Section Organization

**Changes Required:**

1. **Modify Sidebar.tsx**
   - Add section containers
   - Add section headers
   - Add `<Separator />` components

2. **Group Navigation Items**

   ```tsx
   // Before
   <nav>
     <NavItem>Home</NavItem>
     <NavItem>Dashboard</NavItem>
     <NavItem>Data Library</NavItem>
     <NavItem>Reports</NavItem>
   </nav>

   // After
   <nav>
     <SidebarSection title="Home">
       <NavItem>Home</NavItem>
       <NavItem>Dashboard</NavItem>
     </SidebarSection>
     <Separator />
     <SidebarSection title="Documents">
       <NavItem>Data Library</NavItem>
       <NavItem>Reports</NavItem>
     </SidebarSection>
   </nav>
   ```

3. **Install shadcn/ui Components**
   ```bash
   npx shadcn@latest add separator
   ```

---

### US-002: Bottom Sidebar Utilities

**Changes Required:**

1. **Create UserProfileDropdown.tsx**
   - New component file
   - Integrate with `useAuth` hook
   - Handle logout functionality

2. **Modify Sidebar.tsx Layout**

   ```tsx
   <aside className="flex h-screen flex-col">
     {/* Main navigation - flex-1 allows it to grow */}
     <div className="flex-1 overflow-y-auto">{/* Sections */}</div>

     {/* Bottom utilities - sticky at bottom */}
     <div className="space-y-2 border-t p-4">
       <Link href="/settings">
         <Button variant="ghost" className="w-full justify-start">
           <Settings className="mr-2" />
           Settings
         </Button>
       </Link>
       <UserProfileDropdown />
     </div>
   </aside>
   ```

3. **Install shadcn/ui Components**
   ```bash
   npx shadcn@latest add dropdown-menu avatar button
   ```

---

### US-003: Dark Theme Contrast Improvements

**Changes Required:**

1. **Update globals.css**

   ```css
   @layer base {
     .dark {
       /* Background colors */
       --background: 222.2 84% 4.9%; /* Was: 0 0% 0% */
       --card: 222.2 84% 4.9%; /* Was: 0 0% 5% */
       --popover: 222.2 84% 4.9%;

       /* Foreground colors */
       --foreground: 210 40% 98%; /* Was: 0 0% 100% */
       --card-foreground: 210 40% 98%;

       /* Muted colors */
       --muted: 217.2 32.6% 17.5%; /* New */
       --muted-foreground: 215 20.2% 65.1%; /* New */

       /* Border colors */
       --border: 217.2 32.6% 17.5%; /* Was: 0 0% 20% */
     }
   }
   ```

2. **Update Card Backgrounds**
   - Cards should use `bg-card` instead of `bg-background`
   - Ensure proper contrast between card and background

3. **Test Contrast Ratios**
   - Use browser DevTools or contrast checker
   - Verify WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)

---

## 🧪 Testing Strategy

### Visual Testing

**Manual QA Checklist:**

- [ ] **Light Theme**
  - Sidebar sections render correctly
  - Bottom utilities are visible
  - No visual regressions

- [ ] **Dark Theme**
  - Gray palette is applied
  - Contrast is sufficient
  - Cards are distinguishable from background
  - Text is readable

- [ ] **Responsive**
  - Mobile (< 768px): Sidebar collapses or becomes drawer
  - Tablet (768px - 1024px): Sidebar visible
  - Desktop (> 1024px): Full sidebar visible

### Functional Testing

**User Profile Dropdown:**

```typescript
// Test logout functionality
it('should call signOut when logout is clicked', async () => {
  const signOut = vi.fn();
  render(<UserProfileDropdown user={mockUser} onLogout={signOut} />);

  const trigger = screen.getByRole('button');
  await userEvent.click(trigger);

  const logoutItem = screen.getByText('Log out');
  await userEvent.click(logoutItem);

  expect(signOut).toHaveBeenCalledOnce();
});
```

**Sidebar Sections:**

```typescript
// Test section rendering
it('should render all navigation sections', () => {
  render(<Sidebar />);

  expect(screen.getByText('Home')).toBeInTheDocument();
  expect(screen.getByText('Documents')).toBeInTheDocument();
  expect(screen.getByText('Settings')).toBeInTheDocument();
});
```

---

## 🚨 Edge Cases

### Mobile Responsive Behavior

**Challenge:** Sidebar takes up full screen on mobile

**Solution:**

- Use drawer/sheet component for mobile
- Hamburger menu triggers drawer
- Bottom utilities accessible in drawer

### Missing User Avatar

**Challenge:** User has no avatar image

**Solution:**

- Use `AvatarFallback` with initials
- Generate initials from user name
- Default avatar if name is missing

```tsx
const initials =
  user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";
```

### Dark Theme Color Conflicts

**Challenge:** Some components override dark theme colors

**Solution:**

- Use CSS variables consistently
- Avoid hardcoded colors
- Test all components after theme update

---

## 📊 Performance Considerations

### Component Memoization

```tsx
// UserProfileDropdown should be memoized
export const UserProfileDropdown = memo(function UserProfileDropdown() {
  const { user, signOut } = useAuth();

  const handleLogout = useCallback(() => {
    signOut();
  }, [signOut]);

  // ... component implementation
});
```

### Lazy Loading

**Not needed for this feature** - sidebar is always visible and critical for navigation.

---

## 🔒 Security Considerations

### Logout Functionality

- Ensure `signOut` from `useAuth` properly clears session
- Redirect to login page after logout
- Clear any client-side auth state

### User Data Display

- Only display necessary user info (name, email)
- Don't expose sensitive data in dropdown
- Validate user object before rendering

---

## 🎓 Design Patterns

### Composition Over Inheritance

```tsx
// Good: Compose sections from primitives
<SidebarSection>
  <NavItem />
  <NavItem />
</SidebarSection>

// Bad: Create complex monolithic component
<ComplexSidebarWithEverything />
```

### Separation of Concerns

```tsx
// Good: Separate layout from business logic
function Sidebar() {
  return (
    <aside>
      <SidebarNavigation />
      <SidebarFooter />
    </aside>
  );
}

// Bad: Mix layout and data fetching
function Sidebar() {
  const data = useFetch("/api/nav"); // Don't do this
  return <aside>{/* ... */}</aside>;
}
```

---

## 📚 References

### shadcn/ui Components

- [Separator](https://ui.shadcn.com/docs/components/separator)
- [Dropdown Menu](https://ui.shadcn.com/docs/components/dropdown-menu)
- [Avatar](https://ui.shadcn.com/docs/components/avatar)
- [Button](https://ui.shadcn.com/docs/components/button)

### Design Inspiration

- [shadcn Dashboard Example](https://ui.shadcn.com/examples/dashboard)
- [shadcn Sidebar Component](https://ui.shadcn.com/docs/components/sidebar)

### Tailwind CSS

- [Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Customizing Colors](https://tailwindcss.com/docs/customizing-colors)

---

## 🤝 Contributing

When implementing this feature:

1. Follow `CLAUDE.md` project standards
2. Use only shadcn/ui components
3. Apply performance optimization guidelines
4. Write tests for new components
5. Update this documentation if architecture changes

---

## 📝 Changelog

| Date       | Version | Changes                       |
| ---------- | ------- | ----------------------------- |
| 2025-10-05 | 1.0.0   | Initial feature specification |

---

**Ready to implement? Start with the AGENT-GUIDE.md!**
