# US-002: Bottom Sidebar Utilities

## 📋 User Story

**As a** gym management system user
**I want** quick access to Settings and my User Profile at the bottom of the sidebar
**So that** I can easily manage my account and application settings without searching through menus

---

## 💼 Business Value

### Problem

Currently, settings and user profile management are not easily accessible. Users must:

- Navigate through multiple menus to find settings
- Search for account management options
- Cannot quickly log out or access profile

### Solution

Add persistent Settings link and User Profile dropdown at the bottom of the sidebar, always visible and easily accessible.

### Impact

- **Improved Accessibility:** Settings and profile are 1 click away
- **Better UX:** Matches modern app patterns (Gmail, Slack, VS Code)
- **Reduced Friction:** Faster logout and account management

---

## ✅ Acceptance Criteria

### AC-1: Settings Link Visible

- [ ] Settings link appears at bottom of sidebar
- [ ] Settings link is always visible (sticky positioning)
- [ ] Settings link has appropriate icon (gear/cog icon)
- [ ] Clicking Settings navigates to `/settings` page

### AC-2: User Profile Component

- [ ] User profile component appears below Settings
- [ ] Shows user avatar (or fallback initials)
- [ ] Shows user name
- [ ] Shows user email
- [ ] Component is styled consistently with shadcn/ui

### AC-3: User Dropdown Menu

- [ ] Clicking user profile opens dropdown menu
- [ ] Dropdown contains these items (in order):
  1. Account
  2. Billing
  3. Notifications
  4. (Separator)
  5. Log out
- [ ] Each menu item has appropriate icon
- [ ] Menu items are keyboard accessible

### AC-4: Logout Functionality

- [ ] Clicking "Log out" triggers logout action
- [ ] User is redirected to login page after logout
- [ ] Session is cleared properly (via `useAuth` hook)
- [ ] Loading state shown during logout process

### AC-5: Layout & Positioning

- [ ] Bottom utilities are fixed at bottom of sidebar
- [ ] Utilities remain visible when scrolling navigation
- [ ] Separator exists above bottom utilities section
- [ ] Proper spacing between Settings and User Profile

### AC-6: Design Consistency

- [ ] Matches design references (Images #1, #3)
- [ ] Uses shadcn/ui components only
- [ ] Consistent with existing sidebar styling
- [ ] Works in both light and dark themes

### AC-7: Responsive Design

- [ ] Bottom utilities visible on desktop
- [ ] Accessible in mobile drawer/sheet
- [ ] No layout breaking on small screens

---

## 🔧 Technical Implementation

### Files to Create

1. **src/components/layout/UserProfileDropdown.tsx** (CREATE)
   - User profile dropdown component
   - Integrates with `useAuth` hook
   - Handles logout functionality

### Files to Modify

2. **src/components/layout/Sidebar.tsx** (MODIFY)
   - Add bottom utilities section
   - Update layout for sticky positioning
   - Import and use UserProfileDropdown

### shadcn/ui Components Needed

```bash
# Install required components
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add button
npx shadcn@latest add separator
```

### Implementation Steps

1. **Install Dependencies**

   ```bash
   npx shadcn@latest add dropdown-menu avatar button separator
   ```

2. **Create UserProfileDropdown Component**

   ```tsx
   // src/components/layout/UserProfileDropdown.tsx
   import { memo, useCallback } from "react";
   import { useAuth } from "@/hooks/use-auth";
   import { useRouter } from "next/navigation";
   import {
     DropdownMenu,
     DropdownMenuContent,
     DropdownMenuItem,
     DropdownMenuSeparator,
     DropdownMenuTrigger,
   } from "@/components/ui/dropdown-menu";
   import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
   import { Button } from "@/components/ui/button";
   import { User, CreditCard, Bell, LogOut } from "lucide-react";

   export const UserProfileDropdown = memo(function UserProfileDropdown() {
     const { user, signOut } = useAuth();
     const router = useRouter();

     const handleLogout = useCallback(async () => {
       await signOut();
       router.push("/login");
     }, [signOut, router]);

     if (!user) return null;

     // Generate initials from user name
     const initials = user.email?.substring(0, 2).toUpperCase() || "U";

     return (
       <DropdownMenu>
         <DropdownMenuTrigger asChild>
           <Button
             variant="ghost"
             className="h-auto w-full justify-start gap-2 px-2 py-2"
           >
             <Avatar className="h-8 w-8">
               <AvatarImage src={user.avatar_url} />
               <AvatarFallback>{initials}</AvatarFallback>
             </Avatar>
             <div className="flex flex-col items-start overflow-hidden text-left">
               <p className="w-full truncate text-sm font-medium">
                 {user.full_name || "User"}
               </p>
               <p className="text-muted-foreground w-full truncate text-xs">
                 {user.email}
               </p>
             </div>
           </Button>
         </DropdownMenuTrigger>

         <DropdownMenuContent align="end" className="w-56">
           <DropdownMenuItem>
             <User className="mr-2 h-4 w-4" />
             Account
           </DropdownMenuItem>
           <DropdownMenuItem>
             <CreditCard className="mr-2 h-4 w-4" />
             Billing
           </DropdownMenuItem>
           <DropdownMenuItem>
             <Bell className="mr-2 h-4 w-4" />
             Notifications
           </DropdownMenuItem>
           <DropdownMenuSeparator />
           <DropdownMenuItem onClick={handleLogout}>
             <LogOut className="mr-2 h-4 w-4" />
             Log out
           </DropdownMenuItem>
         </DropdownMenuContent>
       </DropdownMenu>
     );
   });
   ```

3. **Modify Sidebar Layout**

   ```tsx
   // src/components/layout/Sidebar.tsx
   import { Separator } from "@/components/ui/separator";
   import { Button } from "@/components/ui/button";
   import { Settings } from "lucide-react";
   import { UserProfileDropdown } from "./UserProfileDropdown";
   import Link from "next/link";

   export function Sidebar() {
     return (
       <aside className="bg-background flex h-screen w-64 flex-col border-r">
         {/* Main navigation - scrollable */}
         <div className="flex-1 overflow-y-auto py-4">
           {/* Navigation sections from US-001 */}
           <div className="sidebar-section">
             <h4 className="text-muted-foreground px-4 py-2 text-sm font-semibold">
               Home
             </h4>
             {/* nav items */}
           </div>

           <Separator className="my-4" />

           <div className="sidebar-section">
             <h4 className="text-muted-foreground px-4 py-2 text-sm font-semibold">
               Documents
             </h4>
             {/* nav items */}
           </div>
         </div>

         {/* Bottom utilities - sticky */}
         <div className="bg-background space-y-2 border-t p-2">
           <Link href="/settings">
             <Button variant="ghost" className="w-full justify-start gap-2">
               <Settings className="h-4 w-4" />
               Settings
             </Button>
           </Link>
           <UserProfileDropdown />
         </div>
       </aside>
     );
   }
   ```

4. **Test Implementation**

   ```bash
   npm run dev
   # Visit http://localhost:3000
   # Test dropdown functionality
   # Test logout flow
   ```

5. **Run Quality Checks**

   ```bash
   npm run lint
   npm test
   npm run build
   ```

---

## 🎨 Design Specifications

### Bottom Utilities Container

```tsx
<div className="bg-background space-y-2 border-t p-2">
  {/* Settings + User Profile */}
</div>
```

**Classes Breakdown:**

- `border-t` - Top border separator
- `bg-background` - Background color (important for sticky behavior)
- `p-2` - Padding around content
- `space-y-2` - Vertical spacing between children

### Settings Button

```tsx
<Button variant="ghost" className="w-full justify-start gap-2">
  <Settings className="h-4 w-4" />
  Settings
</Button>
```

**Classes Breakdown:**

- `variant="ghost"` - Subtle button style
- `w-full` - Full width of container
- `justify-start` - Left-align content
- `gap-2` - Space between icon and text

### User Profile Button

```tsx
<Button variant="ghost" className="h-auto w-full justify-start gap-2 px-2 py-2">
  <Avatar className="h-8 w-8">{/* avatar content */}</Avatar>
  <div className="flex flex-col items-start overflow-hidden text-left">
    <p className="w-full truncate text-sm font-medium">Name</p>
    <p className="text-muted-foreground w-full truncate text-xs">Email</p>
  </div>
</Button>
```

**Layout:**

- Horizontal layout (avatar + text)
- Text stacked vertically
- Truncate long names/emails
- Left-aligned for consistency

---

## 🧪 Testing Requirements

### Manual Testing

**Visual QA:**

1. Sidebar bottom shows Settings and User Profile
2. User profile displays correct avatar/initials
3. User profile displays correct name and email
4. Dropdown menu opens on click
5. Dropdown menu items are styled correctly
6. Both light and dark themes work

**Functional Testing:**

1. Click Settings → navigates to `/settings`
2. Click User Profile → dropdown opens
3. Click Account → (placeholder, no action yet)
4. Click Billing → (placeholder, no action yet)
5. Click Notifications → (placeholder, no action yet)
6. Click Log out → user is logged out and redirected to `/login`
7. Verify session is cleared after logout

**Responsive Testing:**

1. Desktop: Bottom utilities visible and functional
2. Mobile: Accessible in sidebar drawer
3. No layout breaking on any screen size

### Automated Testing

```typescript
// src/components/layout/UserProfileDropdown.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfileDropdown } from './UserProfileDropdown';
import { useAuth } from '@/hooks/use-auth';

vi.mock('@/hooks/use-auth');

describe('UserProfileDropdown - US-002', () => {
  const mockUser = {
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: null,
  };

  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
      isAuthenticated: true,
      isLoading: false,
      authError: null,
    });
  });

  it('should render user info', () => {
    render(<UserProfileDropdown />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should show dropdown menu on click', async () => {
    const user = userEvent.setup();
    render(<UserProfileDropdown />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('should call signOut on logout click', async () => {
    const user = userEvent.setup();
    render(<UserProfileDropdown />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    const logoutButton = screen.getByText('Log out');
    await user.click(logoutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledOnce();
    });
  });

  it('should show initials when no avatar', () => {
    render(<UserProfileDropdown />);

    expect(screen.getByText('TE')).toBeInTheDocument(); // First 2 letters
  });
});
```

---

## 📊 Complexity Analysis

**Estimated Effort:** 2-3 hours

**Complexity Factors:**

- ⚠️ New component creation (UserProfileDropdown)
- ⚠️ Integration with auth system (useAuth hook)
- ✅ Using shadcn/ui components (straightforward)
- ⚠️ Testing logout flow
- ⚠️ Sticky positioning layout

**Risk Level:** Medium

---

## 🔗 Dependencies

### Before This User Story

- **US-001** (Sidebar Section Organization) - provides sidebar structure

### Required Systems

- `useAuth` hook must be implemented and working
- Supabase auth session management
- Login page (`/login`) must exist
- Settings page (`/settings`) should exist (or create placeholder)

### After This User Story

- User can access account management (future implementation)
- User can access billing (future implementation)
- User can access notifications (future implementation)

---

## 📝 Definition of Done

- [ ] Code implemented and committed
- [ ] All acceptance criteria met
- [ ] UserProfileDropdown component created
- [ ] Sidebar layout updated with bottom utilities
- [ ] Settings link functional
- [ ] User profile dropdown functional
- [ ] Logout functionality tested and working
- [ ] Visual QA passed (light + dark themes)
- [ ] Responsive design verified
- [ ] Tests written and passing
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] STATUS.md updated

---

## 🎯 Success Metrics

**How to verify this is complete:**

1. ✅ Settings and User Profile visible at sidebar bottom
2. ✅ User profile shows correct user data
3. ✅ Dropdown menu works and shows all items
4. ✅ Logout functionality works correctly
5. ✅ Design matches reference images
6. ✅ No regressions in existing functionality

---

## 📚 References

- [shadcn/ui Dropdown Menu](https://ui.shadcn.com/docs/components/dropdown-menu)
- [shadcn/ui Avatar](https://ui.shadcn.com/docs/components/avatar)
- [shadcn/ui Button](https://ui.shadcn.com/docs/components/button)
- [useAuth Hook](src/hooks/use-auth.ts)
- Design References: Images #1, #3 (user-provided screenshots)

---

## 💡 Implementation Tips

1. **Use `useCallback` for `handleLogout`** - prevents unnecessary re-renders
2. **Memoize UserProfileDropdown** - it's always visible
3. **Handle missing user data gracefully** - show fallback initials
4. **Test logout flow thoroughly** - critical user function
5. **Consider loading state** - show spinner during logout

---

## ⚠️ Edge Cases to Handle

1. **No user data:** Component should return `null` if not authenticated
2. **Missing avatar:** Show fallback initials
3. **Long names/emails:** Truncate with ellipsis
4. **Logout failure:** Show error message, don't redirect
5. **Mobile responsive:** Ensure dropdown doesn't overflow screen

---

**Ready to implement? Follow the steps in AGENT-GUIDE.md!**
