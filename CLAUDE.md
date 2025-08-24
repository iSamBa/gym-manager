# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
│   ├── members/
│   │   ├── components/          # Member-specific components (MemberTable, etc.)
│   │   ├── hooks/               # Member-specific hooks
│   │   └── lib/                 # Member business logic
│   ├── memberships/             # Membership management
│   ├── payments/                # Payment processing
│   └── dashboard/               # Dashboard & analytics (StatsCard, etc.)
├── lib/                         # Shared utilities and configurations
│   ├── supabase.ts             # Supabase client configuration
│   └── utils.ts                # Tailwind utility functions (`cn` helper)
└── hooks/                       # Shared hooks (useLocalStorage, etc.)
```

### Key Configuration Files

- `components.json` - shadcn/ui configuration with "new-york" style, aliases set for `@/components`, `@/lib`, etc.
- `tsconfig.json` - Path aliases configured (`@/*` → `./src/*`)
- `vitest.config.ts` - Vitest testing configuration with multiple projects (unit tests + Storybook tests)
- `vitest.setup.ts` - Global test setup and mocks
- `.env.local` - Supabase credentials (not committed to git)

### Supabase Integration

The Supabase client is configured in `src/lib/supabase.ts` with:

- Auto-refresh tokens
- Session persistence
- URL session detection
- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables

### Styling & UI

- Uses Tailwind CSS v4 with custom CSS variables
- shadcn/ui components with Lucide icons
- Geist font family (sans and mono variants)
- Supports dark/light mode classes

### Component Architecture

This project follows a **shadcn/ui component-first approach**:

- **Primitives First**: Always use shadcn/ui components as building blocks
- **Composition over Inheritance**: Build complex components by composing primitives
- **Feature Isolation**: Keep feature-specific components in their feature directory
- **Shared Components**: Reusable compositions in `src/components/`

### Component Guidelines

When working on this codebase:

- **ONLY use shadcn/ui components** - no custom CSS components
- Use the established import aliases (`@/lib`, `@/components`, `@/hooks`, etc.)
- Follow the shadcn/ui component patterns for all UI elements
- Import the Supabase client from `@/lib/supabase`
- Use the `cn()` utility from `@/lib/utils` for conditional Tailwind classes
- Place feature-specific components in `src/features/[feature]/components/`
- Place reusable components in appropriate `src/components/[category]/` directories

## Hook Organization Guidelines

This project uses **two separate hooks directories** with distinct purposes:

### `src/hooks/` - Shared/Global Hooks

**Purpose**: Cross-feature, reusable hooks used throughout the entire application

**Examples:**

- `useLocalStorage` - Generic browser storage hook
- `useDebounce` - Generic debouncing functionality
- `useAuth` - Global authentication state
- `useTheme` - App-wide theme management
- `useSupabase` - Global Supabase client wrapper

**When to use:**

- Hook logic is **not specific** to any single feature
- Multiple features will use the same hook
- Hook manages global application state
- Utility hooks that enhance React functionality

### `src/features/[feature]/hooks/` - Feature-Specific Hooks

**Purpose**: Business logic hooks tightly coupled to a specific feature domain

**Examples:**

- `src/features/members/hooks/useMemberForm` - Member creation/editing logic
- `src/features/members/hooks/useMemberList` - Member filtering, sorting, pagination
- `src/features/payments/hooks/usePaymentProcessor` - Payment processing logic
- `src/features/dashboard/hooks/useAnalytics` - Dashboard-specific data fetching

**When to use:**

- Hook contains **business logic specific** to that feature
- Hook manages feature-specific state
- Hook encapsulates API calls for that domain
- Hook would only be used by components in that feature

### Decision Tree for Hook Placement:

```
Is this hook used by multiple features?
├── YES → `src/hooks/`
└── NO → Is it feature-specific business logic?
    ├── YES → `src/features/[feature]/hooks/`
    └── NO → Consider if it should be a utility function instead
```

### Import Examples:

```typescript
// Shared hooks
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAuth } from "@/hooks/use-auth";

// Feature-specific hooks
import { useMemberForm } from "@/features/members/hooks/use-member-form";
import { usePaymentProcessor } from "@/features/payments/hooks/use-payment-processor";
```

## Testing Guidelines

This project uses **Vitest** for unit testing with the following setup:

### Testing Framework

- **Vitest** with jsdom environment for unit tests
- **Testing Library** for React component testing
- **Storybook** integration for component testing in browser environment

### Test Structure

- Unit tests: `src/**/*.{test,spec}.{ts,tsx}`
- Test utilities in `vitest.setup.ts`
- Environment variable mocking with `vi.stubEnv()`
- ES module mocking with `vi.mock()`

### Testing Best Practices

- Use `vi.mocked()` for TypeScript-friendly mocks
- Use `vi.stubEnv()` for environment variable testing
- Use dynamic imports `await import()` for module testing with mocks
- Clean up with `vi.resetModules()` and `vi.unstubAllEnvs()` in beforeEach/afterEach

### Example Test Structure

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

describe("Component Tests", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("should test functionality", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "test-url");
    const module = await import("../module");
    // assertions...
  });
});
```

## Git Branching Strategy

This project follows a **feature branch workflow** for organized development:

### 🚨 CRITICAL: New Features MUST Use Feature Branches

**ALL new features, major changes, or significant additions MUST be developed on separate feature branches.**

### Branch Naming Convention

- **Feature branches**: `feature/[feature-name]`
  - Example: `feature/admin-authentication`
  - Example: `feature/member-management`
  - Example: `feature/payment-processing`

- **Bug fixes**: `bugfix/[issue-description]`
  - Example: `bugfix/login-validation-error`

- **Hotfixes**: `hotfix/[critical-issue]`
  - Example: `hotfix/security-vulnerability`

### Workflow Process

1. **ALWAYS** create a new branch before starting work on a new feature
2. Use descriptive branch names that clearly identify the feature
3. Keep branches focused on a single feature or related set of changes
4. Merge back to `main` via pull request when feature is complete
5. Delete feature branch after successful merge

### Commands

```bash
# Create and switch to new feature branch
git checkout -b feature/your-feature-name

# Push branch to remote
git push -u origin feature/your-feature-name

# Switch back to main
git checkout main

# Delete local branch after merge
git branch -d feature/your-feature-name
```

### Why Feature Branches Are Required

- **Isolation**: Keep experimental or incomplete features separate from stable code
- **Collaboration**: Multiple developers can work on different features simultaneously
- **Code Review**: Feature branches enable proper code review via pull requests
- **Rollback**: Easy to revert specific features if issues arise
- **Clean History**: Maintains a clean, organized commit history

**⚠️ NEVER commit directly to `main` branch for new features!**

# Workflow

- **MANDATORY**: Create a new feature branch for any new feature or major change
- Be sure to run `npm run lint` and `npm test` when you're done making a series of code changes
- Prefer running single tests with `npm test -- <test-file>` for performance during development
- When creating hooks, use the decision tree above to determine correct placement
- Write tests for all utility functions and critical business logic
- Always create pull requests for merging feature branches back to main
