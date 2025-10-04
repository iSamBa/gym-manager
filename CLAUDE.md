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

## Hook Organization

### `src/hooks/` - Shared/Global Hooks

Cross-feature, reusable hooks (useLocalStorage, useAuth, useTheme, etc.)

### `src/features/[feature]/hooks/` - Feature-Specific Hooks

Business logic hooks specific to a feature domain (useMemberForm, usePaymentProcessor, etc.)

**Decision**: Multiple features = `src/hooks/`, Single feature = `src/features/[feature]/hooks/`

## Git Branching

**🚨 CRITICAL: ALL new features MUST use feature branches!**

### Branch Naming

- `feature/[name]` - New features (feature/member-management)
- `bugfix/[name]` - Bug fixes (bugfix/login-validation-error)
- `hotfix/[name]` - Critical issues (hotfix/security-vulnerability)

### Workflow

1. Create branch: `git checkout -b feature/your-feature-name`
2. Push branch: `git push -u origin feature/your-feature-name`
3. Merge via pull request to `main`
4. Delete branch after merge

**⚠️ NEVER commit directly to `main` for new features!**

## Development Workflow

### Daily Process

```bash
# Start of day
git checkout main && git pull origin main

# Feature development
git checkout -b feature/your-feature-name
npm run dev
# Make changes, test frequently
npm run lint && npm test  # Before each commit

# End of day
git add . && git commit -m "type(scope): description"
git push -u origin feature/your-feature-name
```

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
