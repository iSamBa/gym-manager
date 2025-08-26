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
│   ├── auth/                    # Authentication features
│   ├── classes/                 # Class management and scheduling
│   ├── database/                # Database schema and utilities
│   │   ├── lib/
│   │   │   ├── types.ts        # TypeScript database type definitions
│   │   │   └── utils.ts        # Database utility functions
│   │   └── README.md           # Comprehensive database schema documentation
│   ├── dashboard/               # Dashboard & analytics (StatsCard, etc.)
│   ├── equipment/               # Equipment management and tracking
│   ├── members/
│   │   ├── components/          # Member-specific components (MemberTable, etc.)
│   │   ├── hooks/               # Member-specific hooks
│   │   └── lib/                 # Member business logic
│   ├── memberships/             # Membership management
│   ├── payments/                # Payment processing
│   └── trainers/                # Trainer management and sessions
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

### Database Schema

This application includes a comprehensive database schema with:

- **User Management**: Authentication, profiles, and role-based access control
- **Member Management**: Member profiles, emergency contacts, status tracking
- **Equipment Management**: Equipment inventory, categorization, maintenance tracking
- **Subscription System**: Plans, member subscriptions, payment processing
- **Training System**: Trainers, classes, bookings, attendance tracking

All tables implement **Row Level Security (RLS)** for proper data access control. The complete schema documentation is available in `src/features/database/README.md`.

### Styling & UI

- Uses Tailwind CSS v4 with custom CSS variables
- shadcn/ui components with Lucide icons
- Geist font family (sans and mono variants)
- Supports dark/light mode classes

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

## Testing

- **Vitest** with jsdom environment and Testing Library
- **Storybook** integration for component testing
- Unit tests: `src/**/*.{test,spec}.{ts,tsx}`
- Use `vi.mocked()`, `vi.stubEnv()`, dynamic imports for testing
- Clean up with `vi.resetModules()` and `vi.unstubAllEnvs()` in beforeEach/afterEach

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

## Workflow

- Create feature branch for any new feature or major change
- Run `npm run lint` and `npm test` after code changes
- Use single tests `npm test -- <test-file>` during development
- Follow hook placement guidelines above
- Write tests for utilities and business logic
- Create pull requests for merging to main
