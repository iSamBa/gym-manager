# Trainers Management System Implementation Plan

## Overview

Implement a comprehensive trainers management system following the existing members management patterns and architecture.

## Database Foundation

✅ **Already Complete**: Database schema includes `trainers` table with comprehensive fields:

- Basic info (trainer_code, hourly_rate, commission_rate, years_experience)
- Professional details (certifications, specializations, languages)
- Capacity management (max_clients_per_session, is_accepting_new_clients)
- Compliance tracking (insurance, background checks, CPR certification)
- Related tables: trainer_specializations, trainer_sessions, classes

---

## Phase 1: Navigation & Routing

### Navigation Updates

- [ ] Update `src/components/layout/sidebar.tsx`
  - [ ] Add "Trainers" navigation item after "Members"
  - [ ] Use `UserCheck` icon from Lucide
  - [ ] Set href to `/trainers`

### Route Structure

- [ ] Create `src/app/trainers/page.tsx` - Main trainers listing page
- [ ] Create `src/app/trainers/[id]/page.tsx` - Individual trainer profile page

---

## Phase 2: Core Hooks (src/features/trainers/hooks/) ✅ **COMPLETED**

### Database Foundation ✅

- [x] **Added `trainerUtils` to `/src/features/database/lib/utils.ts`**
  - [x] `getTrainers(filters)` - Fetch trainers with search/filters
  - [x] `getTrainerById(id)` - Single trainer retrieval
  - [x] `getTrainerWithProfile(id)` - Trainer with user profile and specializations
  - [x] `getTrainerCount()` - Total trainer count
  - [x] `getTrainerCountByStatus()` - Active/inactive counts
  - [x] `searchTrainers(query)` - Name search (first_name + last_name)
  - [x] `createTrainer(data)` - Create new trainer
  - [x] `updateTrainer(id, data)` - Update trainer
  - [x] `deleteTrainer(id)` - Delete trainer
  - [x] `getTrainersBySpecialization(specialization)` - Filter by specialization
  - [x] `getAvailableTrainers()` - Trainers accepting new clients
  - [x] `checkTrainerCodeExists()` - Validation utility
  - [x] **Added `TrainerFilters`, `CreateTrainerData`, `UpdateTrainerData` types**

### Essential Hooks ✅

- [x] **Create `use-trainers.ts`**
  - [x] `useTrainers()` - Fetch trainers with search and filters
  - [x] `useTrainer(id)` - Fetch single trainer
  - [x] `useTrainerWithProfile(id)` - Trainer with profile and specializations
  - [x] `useSearchTrainers()` - Search trainers by name
  - [x] `useTrainersBySpecialization()` - Trainers by specialization
  - [x] `useAvailableTrainers()` - Trainers accepting new clients
  - [x] `useTrainerCount()` - Total trainer count
  - [x] `useTrainerCountByStatus()` - Count by active/inactive
  - [x] `useTrainersWithExpiringCerts()` - Expiring certifications
  - [x] `useCreateTrainer()` - Create mutation with optimistic updates
  - [x] `useUpdateTrainer()` - Update mutation with optimistic updates
  - [x] `useUpdateTrainerAvailability()` - Update accepting clients status
  - [x] `useBulkUpdateTrainerAvailability()` - Bulk update availability
  - [x] `useDeleteTrainer()` - Delete mutation with cache cleanup
  - [x] `useTrainersInfinite()` - Infinite scroll for large lists
  - [x] `useTrainersPrefetch()` - Prefetch utilities
  - [x] `trainerKeys` - Query key factory

- [x] **Create `use-trainer-search.ts`**
  - [x] `useDebouncedTrainerSearch()` - Debounced name search only
  - [x] `useTrainerValidation()` - Form validation (trainer code, email checks)
  - [x] `useTrainerPrefetch()` - Prefetch utilities for performance
  - [x] `useTrainerCacheUtils()` - Cache management utilities

- [x] **Create `use-trainer-filters.ts`**
  - [x] Status filters (active/inactive)
  - [x] Specialization filters with multi-select
  - [x] Availability filters (accepting new clients)
  - [x] Experience level filters (entry/intermediate/experienced/expert)
  - [x] Certification status filters (current/expiring/expired)
  - [x] Language filters
  - [x] Hourly rate range filters
  - [x] Insurance and background check filters
  - [x] Filter presets (Available Trainers, Personal Training, etc.)
  - [x] Filter summary and active count utilities

- [x] **Create `use-simple-trainer-filters.ts`**
  - [x] Simplified inline filters UI logic
  - [x] Database filter conversion
  - [x] Quick filter setters and presets
  - [x] Filter options for dropdown components

- [x] **Create `use-export-trainers.ts`**
  - [x] CSV export functionality
  - [x] Include trainer details and specializations
  - [x] Loading states and error handling

- [x] **Create `csv-utils.ts` in `src/features/trainers/lib/`**
  - [x] `exportTrainersToCSV()` - Main export function
  - [x] Comprehensive trainer data export including specializations, certifications
  - [x] User profile data integration (names, email, phone)
  - [x] Proper CSV formatting and Excel compatibility

- [x] **Create `index.ts`** - Export all hooks

---

## Phase 3: Core Components (src/features/trainers/components/) ✅ **COMPLETED**

### Data Display Components ✅

- [x] **Create `TrainerAvatar.tsx`**
  - [x] Profile picture with fallback initials (handles missing user profile)
  - [x] Size variants (xs, sm, md, lg, xl)
  - [x] Status indicator overlay for accepting new clients
  - [x] Clickable with hover effects

- [x] **Create `TrainerStatusBadge.tsx`**
  - [x] Interactive availability status badges (Available/Unavailable for new clients)
  - [x] Color coding (green for available, gray for unavailable)
  - [x] Dropdown for status changes with confirmation dialog
  - [x] Loading states during mutations
  - [x] Readonly mode for display-only contexts

- [x] **Create `TrainerCard.tsx`**
  - [x] Three variants: minimal, compact, full
  - [x] Shows avatar, name, specializations, hourly rate, experience
  - [x] Quick actions menu (view, edit, delete)
  - [x] Specializations displayed as badges with overflow handling
  - [x] Professional details (certifications, languages) in full variant

- [x] **Create `AdvancedTrainerTable.tsx`**
  - [x] Advanced table with sorting on all columns (name, rate, experience, availability)
  - [x] Columns: Avatar, Name, Specializations, Rate, Experience, Status, Actions
  - [x] Bulk selection with checkbox column
  - [x] Bulk actions: Mark Available/Unavailable, Delete
  - [x] Infinite scroll pagination with loading states
  - [x] Actions menu per row (view, edit, delete)
  - [x] Responsive design with proper error handling

### Forms & Dialogs ✅

- [x] **Create `TrainerForm.tsx`**
  - [x] Comprehensive form with 8 sections (Personal, Professional, Capacity, Specializations, Certifications, Languages, Compliance, Notes)
  - [x] User profile fields (first_name, last_name, email, phone)
  - [x] Professional details (trainer_code, hourly_rate, commission_rate, experience)
  - [x] Multi-select specializations and certifications with pre-defined options
  - [x] Languages multi-select (minimum 1 required)
  - [x] Compliance fields (insurance, background check, CPR certification dates)
  - [x] Full validation with React Hook Form and Zod schema
  - [x] Interactive badge management for arrays

- [x] **Create `AddTrainerDialog.tsx`**
  - [x] Modal for adding new trainers with proper form integration
  - [x] Uses TrainerForm component with create mutation
  - [x] Success state with confirmation message
  - [x] Navigation to trainers page after creation
  - [x] Error handling with user-friendly messages

- [x] **Create `EditTrainerDialog.tsx`**
  - [x] Modal for editing existing trainers
  - [x] Pre-populated form with trainer data including user profile
  - [x] Update mutation with optimistic updates
  - [x] Cache invalidation for data consistency
  - [x] Success feedback with toast notifications

### Search & Filters ✅

- [x] **Create `SimpleTrainerFilters.tsx`**
  - [x] Three inline filter controls: Availability, Specialization, Experience Level
  - [x] Availability dropdown (All/Accepting/Not Accepting) with icons
  - [x] Specialization dropdown with common options
  - [x] Experience level filter (Entry/Intermediate/Experienced/Expert)
  - [x] Active filter count badge with reset functionality
  - [x] Responsive design for mobile screens

### Utilities ✅

- [x] **Create `TrainerErrorBoundary.tsx`**
  - [x] Error boundary for trainer components with graceful fallbacks
  - [x] Retry functionality and page refresh options
  - [x] Error details disclosure for debugging
  - [x] Higher-order component wrapper (`withTrainerErrorBoundary`)
  - [x] Toast notifications for error reporting

- [x] **Create `index.ts`** - Export all trainer components for clean imports

### Implementation Quality ✅

- [x] **Type Safety**: All components use proper TypeScript types
- [x] **UI Framework**: Uses only existing shadcn/ui components (no custom CSS)
- [x] **Architecture**: Mirrors existing members system patterns exactly
- [x] **Error Handling**: Comprehensive error boundaries and loading states
- [x] **Responsive Design**: Mobile-first responsive layouts
- [x] **Performance**: Optimistic updates and proper caching strategies
- [x] **Build Quality**: Clean build with no TypeScript errors
- [x] **Code Quality**: Lint-clean code following project conventions

---

## Phase 4: Main Trainers Page

### Statistics Cards

- [ ] Total Trainers count card
- [ ] Active Trainers count card
- [ ] Available for New Clients count card
- [ ] Trainers with Expiring Certifications count card

### Page Features

- [ ] Search functionality (name only - first_name + last_name)
- [ ] Filter controls (status, specializations, availability)
- [ ] Export to CSV button with loading state
- [ ] Add Trainer dialog trigger
- [ ] Advanced table with all trainer data
- [ ] Real-time sync indicator
- [ ] Responsive layout matching members page

### Page Structure

- [ ] Header section with title and Add Trainer button
- [ ] Statistics cards grid
- [ ] Search and filters row
- [ ] Export button with download icon
- [ ] Main table in Card wrapper
- [ ] Edit Trainer dialog

---

## Phase 5: Database Utils & Business Logic

### Utils Extension

- [ ] Add `trainerUtils` to `src/features/database/lib/utils.ts`
  - [ ] `getActiveTrainersCount()` - Count active trainers
  - [ ] `getTrainersBySpecialization(specialization)` - Filter by specialization
  - [ ] `getTrainersWithExpiringCerts(days)` - Upcoming cert expirations
  - [ ] `getAvailableTrainers()` - Trainers accepting new clients
  - [ ] `getTrainerStats()` - Comprehensive trainer statistics

---

## Phase 6: Styling & Polish

### Visual Design

- [ ] Use `UserCheck` icon for main navigation
- [ ] Use `Award` icon for certifications
- [ ] Use `Calendar` icon for availability
- [ ] Use `GraduationCap` icon for specializations
- [ ] Follow existing color schemes for status indicators
  - [ ] Green for active trainers
  - [ ] Gray for inactive trainers
  - [ ] Blue for available for new clients

### Responsive Design

- [ ] Ensure table is responsive on mobile
- [ ] Stats cards stack properly on small screens
- [ ] Filters adapt to mobile layout
- [ ] Dialog forms work on all screen sizes

---

## Phase 7: Testing & Quality

### Unit Tests

- [ ] Create `__tests__` folder in hooks directory
- [ ] Test `use-trainers.ts` hook functionality
- [ ] Create `__tests__` folder in components directory
- [ ] Test core components (TrainerForm, TrainerTable, etc.)
- [ ] Follow existing test patterns from members

### Integration Testing

- [ ] Test full trainer creation flow
- [ ] Test search and filter functionality
- [ ] Test CSV export functionality
- [ ] Test responsive behavior

---

## Phase 8: Documentation & Cleanup

### Code Organization

- [ ] Ensure all files follow existing code conventions
- [ ] Add proper TypeScript types for all components
- [ ] Clean up any unused imports or code
- [ ] Verify all components use shadcn/ui only

### Performance Optimization

- [ ] Implement same caching strategies as members
- [ ] Add proper loading states
- [ ] Optimize database queries
- [ ] Add proper error boundaries

---

## Success Criteria Checklist

### Core Functionality

- [ ] Trainers navigation appears in sidebar
- [ ] `/trainers` route loads with trainer statistics
- [ ] Name search functionality works (first_name + last_name)
- [ ] Status and specialization filters work
- [ ] Add trainer dialog creates new trainers successfully
- [ ] Edit trainer dialog updates existing trainers
- [ ] CSV export downloads trainer data
- [ ] Table sorting and pagination work

### Code Quality

- [ ] Follows existing members management patterns
- [ ] Uses only shadcn/ui components
- [ ] Type-safe throughout with proper TypeScript
- [ ] Responsive design matches members page
- [ ] Proper error handling and loading states
- [ ] Tests pass for all new functionality

### User Experience

- [ ] Page loads quickly with proper loading indicators
- [ ] Search is debounced and responsive
- [ ] Filters apply immediately
- [ ] Forms validate properly with helpful error messages
- [ ] Export provides feedback during processing
- [ ] Navigation is intuitive and consistent

---

## Implementation Notes

### Key Technical Decisions

1. **Search Scope**: Name-only search (first_name + last_name from user_profiles)
2. **Architecture Pattern**: Mirror members system exactly
3. **UI Framework**: shadcn/ui components only
4. **State Management**: React Query for server state
5. **Type Safety**: Leverage existing database types

### Integration Points

- Uses existing `TrainerWithProfile` type from database types
- Integrates with existing user_profiles table via foreign key
- Follows same authentication and authorization patterns
- Uses same error handling and notification systems

### Performance Considerations

- Implement infinite scroll for large trainer lists
- Cache trainer data with React Query
- Debounce search input to avoid excessive API calls
- Prefetch trainer details on hover/focus
- Optimize CSV export for large datasets
