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

This is a **gym management system** built with Next.js 15.5 and React 19.

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
│   ├── forms/                   # Composed form components
│   ├── layout/                  # Layout & navigation
│   ├── data-display/            # Tables, cards, lists
│   └── feedback/                # Modals, alerts, notifications
├── features/                    # Feature-based organization
│   ├── auth/                    # Authentication features
│   ├── classes/                 # Class management and scheduling
│   ├── database/                # Database schema and utilities
│   ├── dashboard/               # Dashboard & analytics
│   ├── equipment/               # Equipment management
│   ├── members/                 # Member management
│   ├── memberships/             # Membership management
│   ├── payments/                # Payment processing
│   └── trainers/                # Trainer management
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

#### shadcn/ui Dialog Width Override

**Problem:** Default Dialog includes `sm:max-w-lg` which overrides non-responsive custom width classes.

**Solution:** Match the responsive prefix: `<DialogContent className="w-[60vw] sm:max-w-[60vw]">`

**Why:** The `sm:` prefix creates a media query with higher CSS specificity than plain utility classes.

## Authentication Architecture

### Overview

This application uses **Supabase Auth** with server-side validation for secure session management. All auth data is in-memory only (no localStorage) for security.

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

### Security Features

✅ Server-side route protection via middleware
✅ httpOnly cookies (immune to XSS)
✅ No localStorage auth data
✅ Automatic token refresh
✅ Multi-tab synchronization
✅ Session validation on tab focus

### Common Patterns

**Using Auth in Components:**

```typescript
import { useAuth } from "@/hooks/use-auth";
const { user, isAuthenticated, signIn, signOut } = useAuth();
```

**Server-Side Auth:**

```typescript
import { createClient } from "@/lib/supabase-server";
const supabase = createClient();
const {
  data: { session },
} = await supabase.auth.getSession();
```

**For detailed auth documentation, see [`docs/AUTH.md`](./docs/AUTH.md).**

---

## Collaboration Member System

### Overview

Tracks commercial partnerships, influencer relationships, and promotional arrangements where members receive complimentary subscriptions. Collaboration members are tracked separately from regular members for analytics.

### Member Types

| Type              | Description                         | Subscriptions        | Sessions           | Conversion                        |
| ----------------- | ----------------------------------- | -------------------- | ------------------ | --------------------------------- |
| **Trial**         | New members trying out the gym      | None initially       | Trial, Contractual | Auto → Full on first subscription |
| **Full**          | Regular paying members              | Paid subscriptions   | Member, Makeup     | Manual conversion only            |
| **Collaboration** | Partnership/influencer arrangements | $0 promotional plans | Collaboration only | Manual → Full                     |

### Key Business Rules

**Collaboration Members:**

- ✅ Can ONLY book collaboration sessions
- ✅ Can ONLY have collaboration subscription plans (can be $0)
- ✅ Stay as "collaboration" type when getting subscriptions (NO auto-conversion)
- ✅ Can be manually converted to "full" members
- ❌ Cannot book member/makeup/trial/contractual sessions
- ❌ Cannot receive regular subscription plans

**Partnership Requirements:**

- **Required**: Company name, Contract end date (must be future)
- **Optional**: Partnership type, Contract start date, Partnership notes

### Database Schema

**Members Table:**

```sql
partnership_company VARCHAR(255)     -- Required for collaboration
partnership_type VARCHAR(50)         -- influencer | corporate | brand | media | other
partnership_contract_start DATE      -- Optional
partnership_contract_end DATE        -- Required, must be future
partnership_notes TEXT
```

**Subscription Plans Table:**

```sql
is_collaboration_plan BOOLEAN DEFAULT FALSE  -- Allows $0 price
```

### Converting Collaboration Members

Use `convertCollaborationMember()` from `@/features/members/lib/collaboration-utils`:

```typescript
import { convertCollaborationMember } from "@/features/members/lib/collaboration-utils";

await convertCollaborationMember({
  member_id: member.id,
  end_partnership: true,
  conversion_notes: "Partnership ended, continuing as full member",
});
```

**Important**: This is a one-way conversion. Partnership data is preserved for historical reference.

**For complete collaboration guide, see [`docs/COLLABORATION-MEMBERS.md`](./docs/COLLABORATION-MEMBERS.md).**

---

## Hook Organization

- **`src/hooks/`** - Shared/global hooks (useLocalStorage, useAuth, useTheme, etc.)
- **`src/features/[feature]/hooks/`** - Feature-specific hooks (useMemberForm, usePaymentProcessor, etc.)

**Rule**: Multiple features = `src/hooks/`, Single feature = `src/features/[feature]/hooks/`

## Date Handling Standards

### Key Principle

Use **local timezone** for all user-facing dates. All date utilities are in `src/lib/date-utils.ts`.

### Core Functions

| Function                           | Use For                                            |
| ---------------------------------- | -------------------------------------------------- |
| `getLocalDateString(date)`         | Extract YYYY-MM-DD in local timezone               |
| `formatForDatabase(date)`          | PostgreSQL `date` columns (join_date, etc)         |
| `formatTimestampForDatabase(date)` | PostgreSQL `timestamptz` columns (created_at, etc) |
| `getStartOfDay(date)`              | Get midnight for validation/comparisons            |
| `compareDates(a, b)`               | Compare dates for sorting/filtering                |
| `isFutureDate(date)`               | Check if date is after today                       |
| `isToday(date)`                    | Check if date is today                             |

### Common Patterns

```typescript
import { formatForDatabase, getStartOfDay } from "@/lib/date-utils";

// Database storage
const member = { join_date: formatForDatabase(new Date()) };

// Date picker validation
<Calendar disabled={(date) => date < getStartOfDay()} />
```

### Anti-Patterns

❌ NEVER: `new Date().toISOString().split("T")[0]` - Uses UTC, may be wrong day
❌ NEVER: Manual date formatting like `${year}-${month}-${day}`
✅ ALWAYS: Use `date-utils` functions

**For migration guide, see [`docs/DATE-HANDLING-MIGRATION.md`](./docs/DATE-HANDLING-MIGRATION.md).**

## Database and Type Standards

### Field Naming

- **Database**: `snake_case` (member_id, created_at)
- **TypeScript interfaces**: `snake_case` to match database
- **JavaScript variables**: `camelCase`

### Critical Rules

**Enum Types MUST Match Database:**

```typescript
// ✅ Check database constraint first, then define type
export type MemberStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "expired"
  | "pending";
```

**Reference**: See `docs/ENUM_VALIDATION_REPORT.md`

**Auto-Managed Fields (DON'T manually set):**

- `updated_at` - Auto-updated by trigger
- `receipt_number` - Auto-generated by trigger
- `equipment_number` - Auto-generated by trigger

**RPC Function Field Mapping:**
When RPC returns different field names, use mapper utilities. Document in `docs/RPC_SIGNATURES.md`.

### Type Maintenance Checklist

- [ ] Create/update TypeScript interface in `src/features/database/lib/types.ts`
- [ ] Verify enum types match database CHECK constraints
- [ ] Document RPC functions in `docs/RPC_SIGNATURES.md`
- [ ] Create mapper utilities if needed
- [ ] Run `npm run build` to verify type safety

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

- All code changes
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

### Branch Strategy

| Branch Type | Purpose                   | Merges To | Deploy Target       |
| ----------- | ------------------------- | --------- | ------------------- |
| `main`      | Production-ready code     | N/A       | Production          |
| `dev`       | Integration & staging     | `main`    | Staging/Testing     |
| `feature/*` | New features              | `dev`     | N/A                 |
| `bugfix/*`  | Bug fixes                 | `dev`     | N/A                 |
| `hotfix/*`  | Critical production fixes | `main`    | Production (urgent) |

### Standard Workflow (Features & Bugfixes)

```bash
# 1. Create branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name

# 2. Develop and commit
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

```bash
# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-name

# 2. Fix, test, and PR to main
git push -u origin hotfix/critical-bug-name

# 3. After merge to main, sync back to dev
git checkout dev
git merge main
git push origin dev
```

## Development Workflow

### Daily Process

```bash
# Start of day - always work from dev branch
git checkout dev && git pull origin dev

# Create feature branch from dev
git checkout -b feature/your-feature-name

# Development
npm run dev
npm run lint && npm test  # Before each commit

# Commit and push
git add .
git commit -m "type(scope): description"
git push -u origin feature/your-feature-name

# Create pull request to dev (not main!)
```

### Code Quality Checklist

**Before PR:**

- [ ] Complete performance checklist (see optimization guidelines)
- [ ] `npm run lint` - 0 errors, 0 warnings
- [ ] `npm test` - 100% test pass rate
- [ ] No `any` types or console statements remain
- [ ] Test edge cases and error scenarios

## 🚀 Performance Optimization Guidelines

These patterns MUST be followed to maintain optimal performance.

### 📋 Quick Reference Checklist

**Before Writing Code:**

- [ ] Complex component? → Use `React.memo`
- [ ] Event handlers? → Use `useCallback`
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

**React.memo - MANDATORY for Complex Components:**

```tsx
const MyComponent = memo(function MyComponent({ data, onSelect }: Props) {
  /* ... */
});
```

**useCallback - MANDATORY for Event Handlers:**

```tsx
const handleSort = useCallback((field: string) => {
  /* ... */
}, []);
// ❌ NEVER: <Button onClick={() => handleClick(item.id)} />
```

**useMemo - MANDATORY for Expensive Computations:**

```tsx
const processedData = useMemo(() => data.filter(...), [data]);
```

### Database Optimization

**Server-Side Operations - MANDATORY:**

```tsx
// ✅ Database sorting/filtering
const { data } = useQuery({
  queryFn: () => fetchMembers({ sortBy: `${field}:${direction}`, ...filters })
});

// ❌ NEVER: Client-side sorting/filtering on large datasets
const sorted = data.sort((a, b) => ...); // Bad!
```

### Hook Architecture

**Hook Consolidation - Maximum 4 Hooks Per Feature:**

```tsx
// ✅ GOOD: Consolidate related functionality
export function useMembers() {
  const query = useInfiniteQuery(["members"], fetchMembers);
  const createMutation = useMutation(createMember);
  // ... combine CRUD + search + export
  return { ...query, createMember: createMutation.mutateAsync };
}

// ❌ BAD: Over-specialized hooks (useMemberCount, useMemberExport, etc.)
```

### Bundle Optimization

**Dynamic Imports - MANDATORY for Heavy Libraries:**

```tsx
// ✅ Lazy load heavy components
const PDFGenerator = lazy(() => import("../lib/pdf-generator"));

// ✅ Dynamic import for large libraries
const generatePDF = async (data) => {
  const { generatePaymentReceiptPDF } = await import("../lib/pdf-generator");
  return generatePaymentReceiptPDF(data);
};

// ❌ NEVER: import jsPDF from "jspdf"; // Adds to initial bundle
```

### Anti-Patterns - NEVER DO THESE

```tsx
// ❌ Inline object creation: <Component config={{ option: 'value' }} />
// ❌ Conditional hooks: if (condition) { const data = useQuery(...); }
// ❌ Client-side operations on large datasets
// ❌ Import entire libraries: import * as _ from 'lodash';
```

## Testing

### Test Framework

- **Vitest** with jsdom environment and Testing Library
- **Storybook** integration for component testing
- Unit tests: `src/**/*.{test,spec}.{ts,tsx}`
- Use `vi.mocked()`, `vi.stubEnv()`, dynamic imports for testing
- Clean up with `vi.resetModules()` and `vi.unstubAllEnvs()` in beforeEach/afterEach

### Running Tests

**⚠️ CRITICAL**: Always ensure test processes are cleaned up to prevent memory leaks

**RECOMMENDED: Use the safe test runner script**

```bash
./scripts/run-tests-safe.sh           # Shows summary only
./scripts/run-tests-safe.sh --full    # Show full output
./scripts/run-tests-safe.sh --coverage # Run with coverage
```

**DO NOT pipe test output directly:**

```bash
# ❌ BAD - Can leave zombie processes
npm test | head -100
npm test | grep "passing"
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

**Console Statement Policy:**

- ❌ **NEVER use `console.log/warn/error/info` in production code**
- ✅ **ALWAYS use logger utility** from `@/lib/logger`
- ✅ Logger automatically filters logs in production builds
- ✅ ESLint enforces zero console statements with `'no-console': 'error'`
- ℹ️ Test files (.test., .spec., **tests**/) are exempt from this rule

**Common Anti-Patterns to Avoid:**

- ❌ Commenting out failing tests instead of fixing them
- ❌ Using `// @ts-ignore` to bypass TypeScript errors
- ❌ Using console statements (use logger utility instead)
- ❌ Creating overly complex integration tests without proper cleanup

---

**Remember**: These optimizations were achieved through systematic refactoring. Maintain them by following these patterns in all new development!

## Production Readiness Standards

All features MUST meet these production readiness standards before deployment. These standards ensure security, performance, and reliability at scale.

### 🔒 Security Requirements

**MANDATORY Security Checks:**

1. **Row Level Security (RLS) Policies**
   - Document all RLS policies in `docs/RLS-POLICIES.md`
   - Verify RLS enabled for all sensitive tables
   - Test policies with different user roles

2. **Input Validation & Sanitization**
   - Use Zod schemas for all user inputs
   - Sanitize HTML content (comments, notes) using DOMPurify
   - Validate file uploads (type, size, content)
   - Validate URLs before external links

3. **Environment Variables Validation**

   ```typescript
   // ALWAYS validate env vars with Zod schema
   import { z } from "zod";
   const envSchema = z.object({
     NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
     NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
   });
   export const env = envSchema.parse(process.env);
   ```

4. **Authentication & Authorization**
   - Verify server-side auth middleware protection
   - Use httpOnly cookies (never localStorage)
   - Implement proper session validation
   - Add rate limiting for sensitive operations

### 📊 Database Requirements

**MANDATORY Database Standards:**

1. **Indexes for Performance**
   - Add indexes on frequently queried columns
   - Index foreign keys for joins
   - Index status/date columns for filtering
   - Document indexes in migration files

   ```sql
   -- Required index patterns:
   CREATE INDEX idx_table_status ON table_name(status);
   CREATE INDEX idx_table_foreign_key ON table_name(foreign_key_id);
   CREATE INDEX idx_table_date ON table_name(date_column);
   ```

2. **Transaction Handling**
   - Wrap multi-step operations in transactions
   - Use Supabase RPC functions for atomic operations
   - Handle rollback scenarios explicitly

   ```typescript
   // ✅ Use RPC for atomic operations
   await supabase.rpc("atomic_operation", { params });

   // ❌ NEVER: Multiple separate calls without transaction
   await createRecord1(); // Could fail after this
   await createRecord2(); // Orphaned data
   ```

3. **Query Optimization**
   - Prevent N+1 queries with joins
   - Use pagination for large datasets (>100 rows)
   - Implement query result caching
   - Server-side filtering/sorting only

### 🎯 Performance Requirements

**MANDATORY Performance Standards:**

1. **Bundle Size Targets**
   - Maximum route size: 300 KB First Load JS
   - Use dynamic imports for heavy libraries (jsPDF, charts)
   - Code splitting for large components
   - Tree-shaking enabled for all dependencies

2. **React Optimization**
   - Use React.memo for components >100 lines
   - Wrap event handlers in useCallback
   - Memoize expensive computations with useMemo
   - Implement virtual scrolling for lists >100 items

3. **Image Optimization**
   - Use Next.js Image component (never <img>)
   - Enable WebP format conversion
   - Lazy load images below fold
   - Provide blur placeholders

4. **Database Query Performance**
   - Maximum 5 queries per page load
   - Implement stale-while-revalidate caching
   - Use database indexes (see above)
   - Monitor query execution time (<100ms target)

### ✅ Error Handling Requirements

**MANDATORY Error Handling:**

1. **User-Facing Errors**
   - All mutations MUST have onError handlers
   - Show user-friendly error messages (toast/alert)
   - Log errors with context for debugging

   ```typescript
   // ✅ ALWAYS include error handler
   useMutation({
     mutationFn: createMember,
     onSuccess: () => toast.success("Created!"),
     onError: (error) => {
       logger.error("Failed to create member", { error });
       toast.error(`Failed: ${error.message}`);
     },
   });
   ```

2. **Error Boundaries**
   - Add error.tsx for all dynamic routes
   - Implement feature-level error boundaries
   - Provide recovery actions (reset, retry)

3. **Promise Handling**
   - No unhandled promise rejections
   - Wrap async operations in try-catch
   - Handle loading and error states in UI

### 🧪 Testing Requirements

**MANDATORY Testing Standards:**

1. **Test Coverage**
   - All new features MUST have tests
   - Critical paths: 100% coverage
   - Edge cases and error scenarios covered
   - Integration tests for multi-step workflows

2. **Test Types Required**
   - Unit tests: All utility functions
   - Component tests: All UI components
   - Integration tests: Database operations
   - E2E tests: Critical user flows

3. **Before Deployment**
   - `npm run lint` - 0 errors, 0 warnings
   - `npm test` - 100% pass rate
   - `npm run build` - successful compilation
   - Manual testing of changed functionality

### 📈 Monitoring & Operations

**MANDATORY for Production:**

1. **Error Tracking**
   - Setup Sentry or similar error tracking
   - Configure source maps for debugging
   - Set up error alerting rules

2. **Performance Monitoring**
   - Track Core Web Vitals (FCP, LCP, CLS)
   - Monitor database query performance
   - Set up alerts for slow queries (>200ms)

3. **Database Monitoring**
   - Monitor connection pool usage
   - Track query execution times
   - Alert on failed migrations

### 🎯 Production Readiness Checklist

**Before merging to production, verify:**

- [ ] All RLS policies documented and tested
- [ ] Environment variables validated with Zod
- [ ] Database indexes added for new queries
- [ ] Transactions implemented for multi-step operations
- [ ] N+1 queries eliminated with joins
- [ ] Pagination added for large datasets
- [ ] Bundle size under 300 KB per route
- [ ] React.memo/useCallback/useMemo applied
- [ ] Images optimized with Next.js Image
- [ ] All mutations have error handlers
- [ ] Error boundaries for dynamic routes
- [ ] Tests passing with coverage
- [ ] Monitoring configured (Sentry/Analytics)
- [ ] Security audit completed
- [ ] Performance benchmarks met

### 📋 Feature Implementation Template

Every feature SHOULD include a final user story for production readiness:

**US-XXX: Production Readiness & Optimization**

- Security audit and RLS verification
- Database indexes and query optimization
- Bundle size and performance optimization
- Error handling and monitoring setup
- Testing and documentation

This ensures features are production-ready before deployment.

## Additional Resources

- [Authentication Guide](./docs/AUTH.md) - Complete auth documentation
- [Collaboration Members Guide](./docs/COLLABORATION-MEMBERS.md) - Complete user guide for administrators
- [Date Handling Migration](./docs/DATE-HANDLING-MIGRATION.md) - Migration examples
- [RPC Signatures](./docs/RPC_SIGNATURES.md) - All database function signatures
- [Enum Validation](./docs/ENUM_VALIDATION_REPORT.md) - Enum audit results
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Team Collaboration](./docs/COLLABORATION.md) - PR templates, code review guidelines
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment and monitoring
- **You should never skip a test**
