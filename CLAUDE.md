# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack (preferred for development)
- `npm run build` - Build production application with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Project Architecture

This is a **gym management system** built with Next.js 15.5 and React 19. The application is configured for modern development with:

### Core Stack

- **Next.js 15.5** with App Router (`src/app/` directory)
- **React 19** with TypeScript
- **Tailwind CSS v4** for styling
- **shadcn/ui** components (configured in `components.json`)
- **Supabase** for backend services (database, auth, real-time features)

### Directory Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/lib/` - Shared utilities and configurations
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/utils.ts` - Tailwind utility functions (`cn` helper)

### Key Configuration Files

- `components.json` - shadcn/ui configuration with "new-york" style, aliases set for `@/components`, `@/lib`, etc.
- `tsconfig.json` - Path aliases configured (`@/*` → `./src/*`)
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

When working on this codebase:

- Use the established import aliases (`@/lib`, `@/components`, etc.)
- Follow the shadcn/ui component patterns for new UI elements
- Import the Supabase client from `@/lib/supabase`
- Use the `cn()` utility from `@/lib/utils` for conditional Tailwind classes

# Workflow

- Be sure to typecheck when you’re done making a series of code changes
- Prefer running single tests, and not the whole test suite, for performance
