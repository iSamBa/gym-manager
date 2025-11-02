# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **⚠️ IMPORTANT FOR CLAUDE**: Always read this entire file before starting any coding task. Use the Quick Reference Checklist in the Performance section for all code changes.

## Quick Start

### Environment Requirements

- **Node.js 18+** (18.17.0 or higher recommended)
- **Package Manager**: `npm` (comes with Node.js)
- **Git** for version control
- **VS Code** recommended with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets

### Initial Setup

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd gym-manager
npm install

# 2. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Start development server
npm run dev
```

### First Time Setup Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Repository cloned and dependencies installed
- [ ] `.env.local` created with Supabase credentials
- [ ] Development server running on http://localhost:3000
- [ ] Can access Supabase dashboard
- [ ] Linting and tests pass (`npm run lint && npm test`)

## Development Commands

- `npm run dev` - Start development server with Turbopack (preferred for development)
- `npm run build` - Build production application with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks
- `npm test` - Run unit tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Run tests with Vitest UI

## Project Architecture

This is a **gym management system** built with Next.js 15.5 and React 19. The application is configured for modern development with:

### Core Stack

- **Next.js 15.5** with App Router (`src/app/` directory)
- **React 19** with TypeScript
- **Tailwind CSS v4** for styling
- **shadcn/ui** components (configured in `components.json`)
- **Supabase** for backend services (database, auth, real-time features)
- **Vitest** for unit testing with jsdom environment

### Directory Structure

```
src/
├── app/                          # Next.js App Router pages and layouts
├── components/
│   ├── ui/                      # shadcn/ui primitives (auto-generated)
│   ├── forms/                   # Composed form components (SearchInput, etc.)
│   ├── layout/                  # Layout & navigation (Header, Sidebar, MainLayout)
│   ├── data-display/            # Tables, cards, lists
│   └── feedback/                # Modals, alerts, notifications
├── features/                    # Feature-based organization
│   ├── auth/                    # Authentication features
│   ├── classes/                 # Class management and scheduling
│   ├── database/                # Database schema and utilities
│   ├── dashboard/               # Dashboard & analytics (StatsCard, etc.)
│   ├── equipment/               # Equipment management and tracking
│   ├── members/                 # Member management
│   ├── memberships/             # Membership management
│   ├── payments/                # Payment processing
│   └── trainers/                # Trainer management and sessions
├── lib/                         # Shared utilities and configurations
│   ├── supabase.ts             # Supabase client configuration
│   └── utils.ts                # Tailwind utility functions (`cn` helper)
└── hooks/                       # Shared hooks (useLocalStorage, etc.)
```

### Component Guidelines

- **ONLY use shadcn/ui components** - no custom CSS components
- **Composition over inheritance** - build complex components by composing primitives
- Use established import aliases (`@/lib`, `@/components`, `@/hooks`, etc.)
- Import Supabase client from `@/lib/supabase`
- Use `cn()` utility from `@/lib/utils` for conditional Tailwind classes
- Place feature-specific components in `src/features/[feature]/components/`
- Place reusable components in appropriate `src/components/[category]/` directories

#### shadcn/ui Dialog Width Override Issue

When customizing Dialog component widths, custom classes may not apply due to CSS specificity conflicts with default responsive classes.

**Problem:** Default Dialog includes `sm:max-w-lg` which overrides non-responsive custom width classes.

**Solution:** Match the responsive prefix to override properly:

```tsx
// ❌ Won't work - lower specificity
<DialogContent className="w-[60vw] max-w-[60vw]">

// ✅ Works - matches responsive specificity
<DialogContent className="w-[60vw] sm:max-w-[60vw]">
```

**Why:** The `sm:` prefix creates a media query with higher CSS specificity than plain utility classes. Always use responsive prefixes when overriding shadcn/ui responsive defaults.

## Authentication Architecture

### Overview

This application uses **Supabase Auth** with server-side validation for secure, reliable session management. The auth system was overhauled to eliminate security vulnerabilities and provide a robust foundation for user authentication.

### Key Components

| Component             | File                                 | Purpose                        |
| --------------------- | ------------------------------------ | ------------------------------ |
| **Supabase Client**   | `src/lib/supabase.ts`                | Client-side auth operations    |
| **Supabase Server**   | `src/lib/supabase-server.ts`         | Server-side session validation |
| **Auth Middleware**   | `src/middleware.ts`                  | Server-side route protection   |
| **Auth Provider**     | `src/lib/auth-provider.tsx`          | React context for auth state   |
| **useAuth Hook**      | `src/hooks/use-auth.ts`              | Auth state and actions         |
| **Session Validator** | `src/hooks/use-session-validator.ts` | Tab focus validation           |
| **Auth Store**        | `src/lib/store.ts`                   | In-memory auth state (Zustand) |

### Session Management

**How Sessions Work:**

1. **Login**: User credentials validated by Supabase
2. **Token Storage**: Supabase stores session tokens in httpOnly cookies
3. **Auto-Refresh**: Access tokens (1hr expiry) auto-refresh before expiration
4. **Server Validation**: Middleware validates session on every protected route
5. **Client Validation**: Session validated when tab regains focus
6. **Logout**: Tokens cleared from cookies, user state cleared from memory

**Session Lifecycle:**

```
Login → Session Token (httpOnly cookie) → Auto-Refresh (~55min)
  ↓
Protected Route → Middleware Validates → Allow/Redirect
  ↓
Tab Focus → Session Validator Checks → Continue/Logout
```

### Security Features

✅ **Server-Side Route Protection** - Middleware validates all protected routes
✅ **httpOnly Cookies** - Session tokens immune to XSS attacks
✅ **No localStorage Auth Data** - Prevents client-side manipulation
✅ **Automatic Token Refresh** - Seamless session extension
✅ **Session Expiry Handling** - Auto-logout on expired sessions
✅ **Multi-Tab Synchronization** - Logout in one tab logs out all tabs
✅ **Tab Focus Validation** - Validates session when user returns to tab

### Auth State Management

**In-Memory Only** (No Persistence):

```typescript
// src/lib/store.ts
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  authError: null,
  // ... actions
}));
// ✅ No persist middleware = no localStorage
```

**Why No Persistence?**

- **Security**: Prevents XSS attacks from accessing user data
- **Freshness**: Always fetches latest user profile on page load
- **Simplicity**: Supabase manages session persistence via cookies
- **Tradeoff**: ~100-300ms initial load time (acceptable for security)

### Common Auth Patterns

**Protecting a Route:**

```typescript
// src/middleware.ts already handles this
// All routes except /login and / require authentication
```

**Using Auth in Components:**

```typescript
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm onSubmit={signIn} />;
  }

  return <div>Welcome, {user.email}</div>;
}
```

**Server-Side Auth (API Routes, Server Components):**

```typescript
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // User is authenticated
  return Response.json({ user: session.user });
}
```

### Auth Events Handled

| Event                    | Handler      | Action                          |
| ------------------------ | ------------ | ------------------------------- |
| `INITIAL_SESSION`        | AuthProvider | Load user profile on page load  |
| `SIGNED_IN`              | AuthProvider | Load user profile, clear errors |
| `SIGNED_OUT`             | AuthProvider | Clear user state                |
| `TOKEN_REFRESHED`        | AuthProvider | Reload user profile             |
| `USER_UPDATED`           | AuthProvider | Reload user profile             |
| `PASSWORD_RECOVERY`      | AuthProvider | Log event                       |
| `MFA_CHALLENGE_VERIFIED` | AuthProvider | Load user profile               |

### Error Handling

**User-Friendly Error Messages:**

- Invalid credentials → "The email or password you entered is incorrect"
- Session expired → "Your session has expired. Please log in again"
- Network error → "Unable to connect to the server. Please check your internet connection"
- Token refresh failed → Auto-retry with exponential backoff (1s, 2s, 4s)

**Error Recovery:**

```typescript
// Automatic retry for network errors
const { error } = await supabase.auth.refreshSession();
if (error) {
  // Retry with exponential backoff
  await retryTokenRefresh(attempt + 1);
}
```

### Troubleshooting

**"Session expired" errors:**

- Check Supabase session duration settings
- Verify cookies are not being blocked
- Ensure httpOnly cookies are enabled

**Multi-tab logout not working:**

- Check that `useSessionValidator` is integrated in AuthProvider
- Verify Supabase client is using `createBrowserClient` from `@supabase/ssr`

**Token refresh failing:**

- Check network connection
- Verify Supabase project is active
- Check browser console for detailed error messages

For comprehensive auth documentation, see [`docs/AUTH.md`](./docs/AUTH.md).

---

## Collaboration Member System

### Overview

The collaboration member system enables tracking of commercial partnerships, influencer relationships, and promotional arrangements where members receive complimentary subscriptions. Collaboration members are tracked separately from regular members for analytics and reporting.

### Member Types

The system supports three member types:

| Type              | Description                         | Subscriptions        | Sessions           | Conversion                        |
| ----------------- | ----------------------------------- | -------------------- | ------------------ | --------------------------------- |
| **Trial**         | New members trying out the gym      | None initially       | Trial, Contractual | Auto → Full on first subscription |
| **Full**          | Regular paying members              | Paid subscriptions   | Member, Makeup     | Manual conversion only            |
| **Collaboration** | Partnership/influencer arrangements | $0 promotional plans | Collaboration only | Manual → Full                     |

### Database Schema

**Members Table - Partnership Fields**:

```sql
partnership_company VARCHAR(255)          -- Company/brand name (required for collaboration)
partnership_type VARCHAR(50)              -- influencer | corporate | brand | media | other
partnership_contract_start DATE           -- Partnership start date (optional)
partnership_contract_end DATE             -- Partnership end date (required for collaboration)
partnership_notes TEXT                    -- Contract terms, deliverables, etc.
```

**Subscription Plans Table**:

```sql
is_collaboration_plan BOOLEAN DEFAULT FALSE  -- Allows $0 price
```

**Constraints**:

- Collaboration plans: `price >= 0` (can be $0)
- Regular plans: `price > 0` (must be paid)
- Database enforces this via CHECK constraint

### Business Rules

#### Member Type Restrictions

**Collaboration Members**:

- ✅ Can ONLY book collaboration sessions
- ✅ Can ONLY have collaboration subscription plans
- ✅ Stay as "collaboration" type when getting subscriptions
- ✅ Can be manually converted to "full" members
- ❌ Cannot book member/makeup/trial/contractual sessions
- ❌ Cannot receive regular subscription plans

**Regular Members (Full/Trial)**:

- ✅ Can book member/makeup/trial/contractual sessions
- ✅ Can receive regular subscription plans
- ❌ Cannot book collaboration sessions
- ❌ Cannot receive collaboration plans

#### Partnership Requirements

**For Collaboration Members**:

- **Required**: Company name, Contract end date
- **Optional**: Partnership type, Contract start date, Partnership notes
- **Validation**: Contract end date must be future date

#### Member Type Lifecycle

```
Trial Member
  ↓ (first subscription)
Full Member
  ↓ (manual conversion if needed)
[No further changes]

Collaboration Member
  ↓ (subscription - NO auto-conversion)
Collaboration Member (stays as collaboration)
  ↓ (manual conversion)
Full Member
```

**Key Difference**: Collaboration members do NOT auto-convert to "full" when receiving a subscription.

### Creating Collaboration Members

**Progressive Member Form** (10 steps):

1. **Personal Information** - Name, DOB, gender, profile picture
2. **Contact Information** - Email, phone, preferred contact method
3. **Address** - Street, city, state, postal code, country
4. **Member Type** ⭐ - Select "Collaboration Partner"
5. **Partnership Details** ⭐ (conditional):
   - Company Name\* (required)
   - Partnership Type (dropdown: Influencer, Corporate, Brand, Media, Other)
   - Contract Start Date (optional)
   - Contract End Date\* (required, must be future)
   - Partnership Notes (textarea)
6. **Equipment & Sizes** - Uniform, vest, hip belt
7. **Referral Information** - Source, referred by
8. **Training Preference** - Mixed or women-only
9. **Health & Fitness** - Medical conditions, fitness goals
10. **Settings** - Marketing consent, waiver

**Step 5 only appears when "Collaboration Partner" is selected in Step 4.**

### Creating Collaboration Plans

**Plan Creation Dialog**:

1. Enter plan name (e.g., "Nike Partnership - 12 Sessions")
2. Set description (contract terms, deliverables)
3. **Check "Collaboration Plan"** ✓
4. Set price to $0 (or any amount >= 0)
5. Set signup fee (usually $0)
6. Set duration (months)
7. Set session count
8. Save

**Helpful info appears**: "Collaboration plans can have $0 price for partnership arrangements and can only be assigned to collaboration members."

### Assigning Subscriptions

**Subscription Dialog** (automatic filtering):

- For **collaboration members**: Only collaboration plans shown
- For **full/trial members**: Only regular plans shown
- If no plans available: Helpful message displayed

**No manual filtering needed** - system automatically filters based on member type.

### Booking Sessions

**Session Booking Dialog** (automatic filtering):

- For **collaboration sessions**: Only collaboration members shown in dropdown
- For **member/makeup sessions**: Collaboration members excluded from dropdown
- For **contractual sessions**: Only trial members shown (existing behavior)

**Validation**: System prevents mismatched bookings (e.g., collaboration member trying to book regular session).

### Converting Collaboration Members

**When to Convert**: Partnership ended, member wants to continue as paying member

**How to Convert**:

1. Navigate to collaboration member's detail page
2. Click **"Convert to Full"** button (UserCog icon)
3. Review partnership information in dialog
4. Options:
   - ✓ Mark partnership as ended today (sets contract_end to today)
   - ✓ Create regular subscription after conversion (optional)
   - Add conversion notes (audit trail)
5. Click **"Convert to Full Member"**
6. Member type changes to "full"
7. Partnership data preserved for historical reference
8. Conversion notes appended to member notes with timestamp

**Important**: This is a one-way conversion (no automatic undo).

**After Conversion**:

- Member type = "full"
- Partnership data still exists (historical reference)
- Can now receive regular subscription plans
- Can now book regular sessions
- "Convert to Full" button disappears

### UI Components

**MemberTypeBadge**:

```tsx
<MemberTypeBadge type="collaboration" size="sm" showIcon={true} />
```

- **Full**: Blue badge with UserCheck icon
- **Trial**: Purple badge with UserPlus icon
- **Collaboration**: Orange badge with Handshake icon

**SimpleMemberFilters**:

```tsx
<SimpleMemberFilters filters={filters} onFiltersChange={setFilters} />
```

Includes "Collaboration" option in Member Type dropdown.

### Code Patterns

**Filtering Members by Type**:

```typescript
// In subscription dialogs
const filteredPlans = useMemo(() => {
  if (!plans) return [];

  if (member?.member_type === "collaboration") {
    return plans.filter((plan) => plan.is_collaboration_plan === true);
  }

  return plans.filter((plan) => plan.is_collaboration_plan === false);
}, [plans, member?.member_type]);
```

**Checking Member Type**:

```typescript
if (member.member_type === "collaboration") {
  // Show collaboration-specific UI
}
```

**Converting Members**:

```typescript
import { convertCollaborationMember } from "@/features/members/lib/collaboration-utils";

const result = await convertCollaborationMember({
  member_id: member.id,
  end_partnership: true,
  conversion_notes: "Partnership ended, member continuing as full member",
});
```

### Database Queries

**Filter Out Collaboration Members** (for analytics):

```typescript
const { data } = await supabase
  .from("members")
  .select("*")
  .neq("member_type", "collaboration"); // Exclude collaboration
```

**Get Only Collaboration Members**:

```typescript
const { data } = await supabase
  .from("members")
  .select("*")
  .eq("member_type", "collaboration")
  .not("partnership_contract_end", "is", null); // Has contract
```

**Get Expiring Partnerships** (< 30 days):

```typescript
import { getLocalDateString } from "@/lib/date-utils";

const today = new Date();
const thirtyDaysFromNow = new Date(today);
thirtyDaysFromNow.setDate(today.getDate() + 30);

const { data } = await supabase
  .from("members")
  .select("*")
  .eq("member_type", "collaboration")
  .lte("partnership_contract_end", getLocalDateString(thirtyDaysFromNow))
  .gte("partnership_contract_end", getLocalDateString(today));
```

### Testing

**Test Coverage**:

- 1380 total tests passing
- 7 specific collaboration utility tests
- Session booking restriction tests
- Subscription creation tests
- Member conversion tests

**Manual Testing Checklist**:

- [ ] Create collaboration member with partnership details
- [ ] Create collaboration plan with $0 price
- [ ] Assign collaboration plan to collaboration member
- [ ] Book collaboration session for collaboration member
- [ ] Verify regular member cannot book collaboration session
- [ ] Verify collaboration member cannot book regular session
- [ ] Edit partnership information
- [ ] Convert collaboration member to full member
- [ ] Verify converted member can now receive regular plans

### Common Issues & Solutions

**Issue**: "Cannot assign this plan to this member"
**Solution**: Check member type matches plan type (collaboration ↔ collaboration, regular ↔ full/trial)

**Issue**: "This member cannot book this session type"
**Solution**: Collaboration members can only book collaboration sessions

**Issue**: "Contract end date must be in the future"
**Solution**: When creating collaboration member, set end date after today

**Issue**: Collaboration member auto-converted to "full" on subscription
**Solution**: This was fixed in Phase 2 - should no longer happen

### File Locations

**Utilities**:

- `src/features/members/lib/collaboration-utils.ts` - Conversion function
- `src/features/database/lib/types.ts` - Type definitions

**Components**:

- `src/features/members/components/ConvertCollaborationMemberDialog.tsx` - Conversion UI
- `src/features/members/components/cells/MemberTypeBadge.tsx` - Member type badge
- `src/features/members/components/ProgressiveMemberForm.tsx` - Member creation form

**Hooks**:

- `src/features/members/hooks/use-convert-collaboration-member.ts` - Conversion hook

**Tests**:

- `src/features/members/lib/__tests__/collaboration-utils.test.ts` - Conversion tests
- `src/features/training-sessions/lib/__tests__/validation.test.ts` - Session booking tests
- `src/features/memberships/lib/__tests__/subscription-utils.test.ts` - Subscription tests

**User Documentation**:

- `docs/COLLABORATION-MEMBERS.md` - Complete user guide for administrators

---

## Hook Organization

### `src/hooks/` - Shared/Global Hooks

Cross-feature, reusable hooks (useLocalStorage, useAuth, useTheme, etc.)

### `src/features/[feature]/hooks/` - Feature-Specific Hooks

Business logic hooks specific to a feature domain (useMemberForm, usePaymentProcessor, etc.)

**Decision**: Multiple features = `src/hooks/`, Single feature = `src/features/[feature]/hooks/`

## Date Handling Standards

### Overview

This application uses **local timezone** date handling to prevent timezone-related bugs. All date utilities are centralized in `src/lib/date-utils.ts` with 100% test coverage.

**Key Principle**: User-facing dates (join dates, subscription dates, scheduled changes) should display and store in the user's local timezone, NOT UTC.

### Core Functions

| Function                           | Purpose                                      | Use For                                   |
| ---------------------------------- | -------------------------------------------- | ----------------------------------------- |
| `getLocalDateString(date)`         | Convert Date to YYYY-MM-DD in local timezone | Extracting date strings, database queries |
| `compareDates(a, b)`               | Compare two dates (string or Date)           | Sorting, filtering, conditional logic     |
| `isFutureDate(date)`               | Check if date is after today                 | Validation, filtering upcoming items      |
| `isToday(date)`                    | Check if date is today                       | Highlighting current items                |
| `formatForDatabase(date)`          | Format for PostgreSQL `date` column          | join_date, start_date, end_date, due_date |
| `formatTimestampForDatabase(date)` | Format for PostgreSQL `timestamptz` column   | created_at, updated_at, scheduled_start   |
| `getStartOfDay(date)`              | Get Date at midnight (00:00:00.000)          | Date picker validation, UI comparisons    |

### Common Patterns

**Pattern 1: Database Date Storage**

```typescript
import {
  formatForDatabase,
  formatTimestampForDatabase,
} from "@/lib/date-utils";

// For date columns (no time component)
const member = {
  join_date: formatForDatabase(new Date()), // "2025-10-18"
  subscription_start: formatForDatabase(new Date(2025, 9, 20)), // "2025-10-20"
};

// For timestamptz columns (with time)
const comment = {
  created_at: formatTimestampForDatabase(), // "2025-10-18T01:26:00.000Z"
  updated_at: formatTimestampForDatabase(new Date()),
};
```

**Pattern 2: Date Picker Validation**

```typescript
import { getStartOfDay } from '@/lib/date-utils';

<Calendar
  selected={selectedDate}
  onSelect={setSelectedDate}
  disabled={(date) => date < getStartOfDay()}  // Prevent past dates
/>
```

**Pattern 3: Database Queries with Dates**

```typescript
import { getLocalDateString } from "@/lib/date-utils";

// Query for items on a specific date
const sessionDate = getLocalDateString(new Date(sessionTimestamp));

const { data } = await supabase
  .from("member_comments")
  .select("*")
  .gte("due_date", sessionDate); // Use string comparison
```

**Pattern 4: Date Comparisons**

```typescript
import { compareDates, isFutureDate } from "@/lib/date-utils";

// Sort by date
members.sort((a, b) => compareDates(a.join_date, b.join_date));

// Filter future items
const upcomingSubscriptions = subscriptions.filter((sub) =>
  isFutureDate(sub.start_date)
);
```

### Database Column Types

**Use `date` columns for:**

- User-selected dates (join_date, birth_date, start_date, end_date)
- Scheduled dates (effective_from, due_date)
- **Storage**: Local date (YYYY-MM-DD)
- **Function**: `formatForDatabase()`

**Use `timestamptz` columns for:**

- System timestamps (created_at, updated_at, deleted_at)
- Event times (scheduled_start, cancelled_at, completed_at)
- **Storage**: ISO timestamp with timezone
- **Function**: `formatTimestampForDatabase()`

### Anti-Patterns

**❌ NEVER do these:**

```typescript
// ❌ BAD: Using UTC for user-facing dates
const date = new Date().toISOString().split("T")[0]; // UTC, may be wrong day

// ❌ BAD: Manual timezone manipulation
const today = new Date();
today.setHours(0, 0, 0, 0);
const comparison = today.getTime(); // Fragile, verbose

// ❌ BAD: Inconsistent date formatting
const date = `${year}-${month}-${day}`; // Manual formatting, error-prone

// ❌ BAD: Client-side timezone conversion
const localDate = new Date(utcDate).toLocaleDateString(); // Inconsistent format
```

**✅ DO this instead:**

```typescript
// ✅ GOOD: Use date-utils functions
import {
  getLocalDateString,
  getStartOfDay,
  formatForDatabase,
} from "@/lib/date-utils";

const dateString = getLocalDateString(new Date()); // "2025-10-18"
const midnight = getStartOfDay(); // Clean, tested
const dbDate = formatForDatabase(new Date()); // Consistent
```

### Migration Guide

When updating existing code:

1. **Find problematic patterns**:

   ```bash
   # Search for UTC date conversions
   grep -r "toISOString().split" src/

   # Search for manual midnight calculations
   grep -r "setHours(0, 0, 0, 0)" src/
   ```

2. **Replace with date-utils**:

   ```typescript
   // Before
   const dateStr = new Date().toISOString().split("T")[0];

   // After
   import { getLocalDateString } from "@/lib/date-utils";
   const dateStr = getLocalDateString(new Date());
   ```

3. **Test thoroughly**:
   - Run unit tests: `npm test`
   - Verify database queries return correct results
   - Check UI displays dates correctly

For detailed migration examples, see `docs/DATE-HANDLING-MIGRATION.md`.

## Database and Type Standards

### Overview

This project maintains strict alignment between PostgreSQL database schema and TypeScript type definitions. Follow these standards to prevent runtime errors and maintain type safety.

### Field Naming Conventions

**Database (PostgreSQL)**:

- Use `snake_case` for all column names
- Example: `member_id`, `created_at`, `subscription_end_date`

**TypeScript**:

- Use `camelCase` for JavaScript/TypeScript variables
- Use `snake_case` in interfaces matching database tables
- Example:

  ```typescript
  interface Member {
    member_id: string; // Matches database column
    created_at: string;
  }

  const memberId = member.member_id; // camelCase for variables
  ```

### Enum Type Standards

**CRITICAL**: TypeScript enums MUST match database CHECK constraints exactly.

**Verification Process**:

1. Check database constraint:

   ```sql
   SELECT constraint_definition
   FROM pg_constraint
   WHERE conname LIKE '%status_check';
   ```

2. Update TypeScript type to match:

   ```typescript
   // ✅ CORRECT - Matches database
   export type MemberStatus =
     | "active"
     | "inactive"
     | "suspended"
     | "expired"
     | "pending";

   // ❌ WRONG - Missing values from database
   export type MemberStatus = "active" | "inactive";
   ```

**Reference**: See `docs/ENUM_VALIDATION_REPORT.md` for complete audit results.

### RPC Function Patterns

When using Supabase RPC (database stored procedures), field names may differ from base tables.

**Common Pattern - Field Mapping**:

```typescript
// RPC function returns session_id, but TypeScript expects id
import { mapSessionRpcResponse } from "@/features/training-sessions/lib/rpc-mappers";

const { data } = await supabase.rpc("get_sessions_with_planning_indicators", {
  p_start_date: getLocalDateString(startDate),
  p_end_date: getLocalDateString(endDate),
});

// Map session_id → id
const sessions = mapSessionRpcResponse<TrainingSession>(data || []);
```

**Best Practices**:

- Always check RPC function return structure against TypeScript interface
- Use mapper utilities for field name transformations
- Document field mappings in `docs/RPC_SIGNATURES.md`

**Reference**: See `docs/RPC_SIGNATURES.md` for all RPC function signatures and mappings.

### Database Triggers

Many tables have automatic triggers - do NOT manually set these fields:

**Auto-Managed Fields**:

- `updated_at` - Auto-updated by `update_updated_at_column()` trigger
- `receipt_number` - Auto-generated by `generate_receipt_number()` trigger
- `equipment_number` - Auto-generated by `generate_equipment_number()` trigger

**Example**:

```typescript
// ❌ WRONG - Trigger handles this
await supabase.from("members").update({
  status: "active",
  updated_at: new Date().toISOString(), // Don't do this!
});

// ✅ CORRECT - Let trigger handle updated_at
await supabase.from("members").update({ status: "active" });
```

### Type Maintenance Checklist

When adding new database tables or modifying schema:

- [ ] Create/update TypeScript interface in `src/features/database/lib/types.ts`
- [ ] Verify enum types match database CHECK constraints
- [ ] Document any RPC functions in `docs/RPC_SIGNATURES.md`
- [ ] Create mapper utilities if RPC returns different field names
- [ ] Remove or document unused type definitions
- [ ] Run `npm run build` to verify type safety
- [ ] Update tests to use new types

### Common Anti-Patterns

**❌ DON'T**:

```typescript
// Don't use 'any' type
const data: any = await fetchData();

// Don't create interfaces with fields that don't exist in database
interface Member {
  status: "active" | "inactive"; // Missing values from database!
  completedSessions: number; // Not a database column!
}

// Don't manually format dates
const date = new Date().toISOString().split("T")[0]; // Use getLocalDateString()
```

**✅ DO**:

```typescript
// Use specific types
const data: Member[] = await fetchData();

// Match database schema exactly
interface Member {
  status: MemberStatus; // Use defined enum
  // Only include actual database columns
}

// Use date utilities
import { getLocalDateString } from "@/lib/date-utils";
const date = getLocalDateString(new Date());
```

### Documentation References

- **RPC Functions**: `docs/RPC_SIGNATURES.md` - All database function signatures
- **Enum Validation**: `docs/ENUM_VALIDATION_REPORT.md` - Enum audit results
- **Date Handling**: See "Date Handling Standards" section above
- **Type Definitions**: `src/features/database/lib/types.ts` - Central type file

## Git Branching

**🚨 CRITICAL: ALL new features MUST use feature branches!**

### ⚠️ MANDATORY PRE-CODING CHECK (NO EXCEPTIONS)

**BEFORE writing ANY code, modifying ANY files, or applying ANY database migrations:**

1. **Check current branch:**

   ```bash
   git branch --show-current
   ```

2. **Verify you are on a feature branch:**
   - ✅ `feature/*` - Allowed for new features
   - ✅ `bugfix/*` - Allowed for bug fixes
   - ✅ `hotfix/*` - Allowed for production emergencies ONLY
   - ❌ `dev` - **FORBIDDEN** for direct commits
   - ❌ `main` - **FORBIDDEN** for direct commits
   - ❌ Any other branch - **FORBIDDEN**

3. **If NOT on a feature branch, STOP and create one:**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

**⚠️ This check is MANDATORY for:**

- All code changes (TypeScript, JavaScript, CSS, etc.)
- Database migrations (Supabase MCP)
- Configuration files
- Documentation files (if part of feature work)
- Test files
- ANY file modification

**🚫 NEVER proceed without a feature branch. NO EXCEPTIONS. NO SHORTCUTS.**

**Why This Matters:**

- ❌ Database migrations cannot be reviewed before production
- ❌ Changes cannot be rolled back cleanly
- ❌ No PR review process
- ❌ Work cannot be isolated
- ❌ Violates team workflow
- ❌ Creates audit trail problems

### Branch Strategy

This project uses a **dev → main** branching strategy for stable releases:

| Branch Type | Purpose                   | Merges To | Deploy Target       |
| ----------- | ------------------------- | --------- | ------------------- |
| `main`      | Production-ready code     | N/A       | Production          |
| `dev`       | Integration & staging     | `main`    | Staging/Testing     |
| `feature/*` | New features              | `dev`     | N/A                 |
| `bugfix/*`  | Bug fixes                 | `dev`     | N/A                 |
| `hotfix/*`  | Critical production fixes | `main`    | Production (urgent) |

### Branch Naming Conventions

- `feature/[name]` - New features (e.g., `feature/member-management`)
- `bugfix/[name]` - Bug fixes (e.g., `bugfix/login-validation-error`)
- `hotfix/[name]` - Critical production issues (e.g., `hotfix/security-vulnerability`)

### Standard Workflow (Features & Bugfixes)

```bash
# 1. Create branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name

# 2. Develop and commit
# ... make changes ...
git add .
git commit -m "feat(scope): description"

# 3. Push and create PR to dev
git push -u origin feature/your-feature-name
# Create pull request: feature/your-feature-name → dev

# 4. After merge, delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

**⚠️ NEVER commit directly to `dev` or `main`! Always use pull requests.**

### Hotfix Workflow (Production Emergencies)

For critical bugs that need immediate production fixes:

```bash
# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-name

# 2. Fix and test thoroughly
# ... make minimal changes ...
git add .
git commit -m "fix(scope)!: critical bug description"

# 3. PR to main (urgent)
git push -u origin hotfix/critical-bug-name
# Create pull request: hotfix/critical-bug-name → main

# 4. After merge to main, sync back to dev
git checkout dev
git pull origin dev
git merge main
git push origin dev

# 5. Delete hotfix branch
git branch -d hotfix/critical-bug-name
git push origin --delete hotfix/critical-bug-name
```

### Release Workflow (dev → main)

Promote `dev` to `main` when ready for production release:

**Merge Criteria** (all must be satisfied):

- [ ] All tests passing in dev
- [ ] QA approval received
- [ ] No known critical bugs
- [ ] Staging deployment verified
- [ ] Release notes prepared

**Release Process:**

```bash
# 1. Create PR from dev to main
# Review changes carefully - this goes to production!

# 2. After merge, tag the release
git checkout main
git pull origin main
git tag -a v1.2.3 -m "Release v1.2.3: Description"
git push origin v1.2.3

# 3. Sync dev with main to ensure alignment
git checkout dev
git merge main
git push origin dev
```

### Branch Maintenance

- **Delete merged branches**: Feature/bugfix branches should be deleted immediately after merge
- **Keep dev synchronized**: Regularly sync dev with main after releases
- **Use descriptive names**: Branch names should clearly indicate their purpose
- **Keep branches short-lived**: Merge within 1-2 weeks to avoid merge conflicts

## Development Workflow

### Daily Process

```bash
# Start of day - always work from dev branch
git checkout dev && git pull origin dev

# Create feature branch from dev
git checkout -b feature/your-feature-name

# Development
npm run dev
# Make changes, test frequently
npm run lint && npm test  # Before each commit

# Commit and push
git add .
git commit -m "type(scope): description"
git push -u origin feature/your-feature-name

# Create pull request to dev (not main!)
# After PR approval and merge, delete the feature branch
```

**Important Notes:**

- Always branch from and merge to `dev` for features/bugfixes
- Only create PRs to `main` for hotfixes (emergency production fixes)
- Keep your feature branch updated: `git checkout dev && git pull && git checkout - && git merge dev`

### Code Quality Checklist

**During Development:**

- [ ] Run `npm test -- <test-file>` for focused testing
- [ ] Use React DevTools to check for unnecessary re-renders
- [ ] Follow hook placement guidelines (see Hook Organization)
- [ ] Write tests for utilities and business logic

**Before PR:**

- [ ] Complete performance checklist (see optimization guidelines)
- [ ] Verify all linting rules pass
- [ ] Ensure no `any` types or console.logs remain
- [ ] Test edge cases and error scenarios

## 🚀 Performance Optimization Guidelines

This section contains **CRITICAL** optimization rules learned from the 6-phase codebase optimization. These patterns MUST be followed to maintain optimal performance and prevent technical debt.

### 📋 Quick Reference Checklist

**Before Writing Code:**

- [ ] Will this be a complex component? → Use `React.memo`
- [ ] Does this have event handlers? → Use `useCallback`
- [ ] Heavy computation? → Use `useMemo`
- [ ] Form with >5 fields? → Split into sections
- [ ] Need sorting/filtering? → Do it server-side
- [ ] Importing heavy library? → Use dynamic import

**Performance Targets:**

| Metric           | Target           | Check With          |
| ---------------- | ---------------- | ------------------- |
| React Re-renders | <30% unnecessary | React DevTools      |
| Database Queries | <5 per page      | Network tab         |
| Component Size   | <300 lines       | File length         |
| Hook Count       | <4 per feature   | Directory structure |

### React Performance Patterns

#### React.memo Usage - MANDATORY for Complex Components

```tsx
// ✅ ALWAYS use React.memo for components with:
// - Complex rendering logic, Large datasets, Frequent prop changes
const MyComplexComponent = memo(function MyComplexComponent({
  data,
  onSelect,
}: MyComponentProps) {
  // Component implementation
});
```

#### useCallback - MANDATORY for Event Handlers

```tsx
// ✅ ALWAYS wrap event handlers in useCallback
const handleSort = useCallback((field: string) => {
  setSortConfig((prev) => ({
    field,
    direction: prev.direction === "asc" ? "desc" : "asc",
  }));
}, []); // Include dependencies only when necessary

// ❌ NEVER create functions inline for frequently updating components
<Button onClick={() => handleClick(item.id)} />; // Causes re-renders
```

#### useMemo - MANDATORY for Expensive Computations

```tsx
// ✅ ALWAYS memoize expensive data transformations
const processedData = useMemo(() => {
  if (!data) return [];
  return data.pages.flat().filter((item) => item.status === "active");
}, [data]); // Only recalculate when data changes
```

### Database Optimization Rules

#### Server-Side Operations - MANDATORY

```tsx
// ✅ ALWAYS move sorting/filtering to database
const { data } = useInfiniteQuery({
  queryKey: ["members", { search, sortField, sortDirection, filters }],
  queryFn: ({ pageParam }) =>
    fetchMembers({
      search,
      sortBy: `${sortField}:${sortDirection}`, // Database sorting
      ...filters,
      page: pageParam,
    }),
});

// ❌ NEVER sort/filter large datasets on client
const sortedData = data.sort((a, b) => a.name.localeCompare(b.name)); // Bad!
```

#### SQL Aggregations - Use Database Functions

```sql
-- ✅ CREATE database functions for analytics
CREATE OR REPLACE FUNCTION get_member_stats()
RETURNS JSON AS $$
SELECT json_build_object(
  'total', COUNT(*),
  'active', COUNT(*) FILTER (WHERE status = 'active'),
  'inactive', COUNT(*) FILTER (WHERE status = 'inactive')
) FROM members;
$$ LANGUAGE SQL;
```

### Hook Architecture Rules

#### Hook Consolidation - Maximum 4 Hooks Per Feature

```tsx
// ✅ CONSOLIDATE related functionality
// Good: useMembers (includes CRUD + search + export)
export function useMembers() {
  const query = useInfiniteQuery(["members"], fetchMembers);
  const createMutation = useMutation(createMember);
  const updateMutation = useMutation(updateMember);
  const deleteMutation = useMutation(deleteMember);

  return {
    ...query,
    createMember: createMutation.mutateAsync,
    updateMember: updateMutation.mutateAsync,
    deleteMember: deleteMutation.mutateAsync,
  };
}

// ❌ NEVER create over-specialized hooks
// Bad: useMemberCount, useMemberExport, useMemberBulkOps (separate hooks)
```

### Bundle Optimization Rules

#### Dynamic Imports - MANDATORY for Heavy Libraries

```tsx
// ✅ LAZY load heavy components/libraries
const PDFGenerator = lazy(() => import("../lib/pdf-generator"));
const ChartComponent = lazy(() => import("./ChartComponent"));

// ✅ Dynamic imports for large libraries
const generatePDF = async (data: PaymentData) => {
  const { generatePaymentReceiptPDF } = await import("../lib/pdf-generator");
  return generatePaymentReceiptPDF(data);
};

// ❌ NEVER import heavy libraries at module level
import jsPDF from "jspdf"; // Adds to initial bundle
```

### Performance Checklist for New Features

Before adding any new feature, verify:

- [ ] **React Performance**: Components use memo/callback/useMemo appropriately
- [ ] **Database Operations**: Sorting/filtering done server-side
- [ ] **Bundle Impact**: Heavy libraries loaded dynamically
- [ ] **Hook Architecture**: Maximum 4 hooks per feature domain
- [ ] **Component Size**: No single component >300 lines
- [ ] **Shared Code**: No duplicated utility functions
- [ ] **Type Safety**: No `any` types, proper interfaces defined

### Anti-Patterns - NEVER DO THESE

```tsx
// ❌ NEVER: Inline object/array creation in render
<Component config={{ option: 'value' }} /> // Creates new object every render

// ❌ NEVER: Conditional hooks
if (condition) {
  const data = useQuery(...); // Breaks rules of hooks
}

// ❌ NEVER: Client-side operations on large datasets
const filtered = data.filter(item => item.name.includes(search)); // Use database WHERE
const sorted = data.sort((a, b) => a.date - b.date); // Use database ORDER BY

// ❌ NEVER: Import entire libraries
import * as _ from 'lodash'; // Imports everything
```

## Testing

### Test Framework

- **Vitest** with jsdom environment and Testing Library
- **Storybook** integration for component testing
- Unit tests: `src/**/*.{test,spec}.{ts,tsx}`
- Use `vi.mocked()`, `vi.stubEnv()`, dynamic imports for testing
- Clean up with `vi.resetModules()` and `vi.unstubAllEnvs()` in beforeEach/afterEach

### Running Tests (IMPORTANT: Process Cleanup)

**⚠️ CRITICAL**: Always ensure test processes are cleaned up to prevent memory leaks

**DO NOT** pipe test output directly (causes hanging processes):

```bash
# ❌ BAD - Can leave zombie processes
npm test | head -100
npm test | grep "passing"
```

**DO** use one of these approaches:

**Option 1: Use the safe test runner script (RECOMMENDED)**

```bash
# Run tests with automatic cleanup (shows summary only)
./scripts/run-tests-safe.sh

# Show full test output
./scripts/run-tests-safe.sh --full

# Run with coverage
./scripts/run-tests-safe.sh --coverage
```

**Option 2: Manual safe test run**

```bash
# Run tests fully, save output to temp file
npm test > /tmp/test-output.txt 2>&1
EXIT_CODE=$?

# Read what you need
tail -30 /tmp/test-output.txt

# Clean up
rm -f /tmp/test-output.txt

# Verify no hanging processes
pgrep -f "vitest" > /dev/null && pkill -f "vitest" || true

exit $EXIT_CODE
```

**Option 3: Simple with cleanup verification**

```bash
# Run tests
npm test

# Check for hanging processes
if pgrep -f "vitest" > /dev/null; then
  echo "⚠️ Cleaning up vitest processes..."
  pkill -f vitest
fi
```

### Test Best Practices

- Always run full test suite before commits
- Use `npm run test:watch` for local development only
- Run `npm run test:coverage` to check coverage thresholds
- Verify no processes remain: `ps aux | grep vitest | grep -v grep`

## Quality Control

### Pre-Commit Requirements

**MUST pass before any commit:**

1. `npm run lint` - 0 errors, 0 warnings
2. `npm run build` - successful compilation
3. `npm test` - 100% test pass rate
4. Manual verification of changed functionality

### Development Standards

**TypeScript Rules:**

- ❌ **NEVER use `any` type** - always define proper interfaces
- ✅ Use specific types: `Member`, `BulkOperationResult`, etc.
- ✅ For complex types, create interfaces in `types.ts`

**Common Anti-Patterns to Avoid:**

- ❌ Commenting out failing tests instead of fixing them
- ❌ Using `// @ts-ignore` to bypass TypeScript errors
- ❌ Leaving console.log statements in production code
- ❌ Creating overly complex integration tests without proper cleanup

---

**Remember**: These optimizations were achieved through systematic refactoring. Maintain them by following these patterns in all new development!

## Additional Resources

- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Team Collaboration](./docs/COLLABORATION.md) - PR templates, code review guidelines
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment and monitoring
- you should never skip a test
