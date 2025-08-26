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

## Phase 3: Core Components (src/features/trainers/components/)

### Data Display Components

- [ ] Create `TrainerAvatar.tsx`
  - [ ] Profile picture with fallback initials
  - [ ] Size variants (sm, md, lg)
  - [ ] Status indicator overlay

- [ ] Create `TrainerStatusBadge.tsx`
  - [ ] Active/Inactive status badges
  - [ ] Color coding (green for active, gray for inactive)
  - [ ] Available/Unavailable for new clients

- [ ] Create `TrainerCard.tsx`
  - [ ] Card view component
  - [ ] Show avatar, name, specializations
  - [ ] Quick actions (view, edit, contact)

- [ ] Create `AdvancedTrainerTable.tsx`
  - [ ] Advanced table with sorting, pagination
  - [ ] Columns: Name, Specializations, Status, Rate, Experience
  - [ ] Actions menu (view, edit, sessions)
  - [ ] Bulk selection support
  - [ ] Loading and error states

### Forms & Dialogs

- [ ] Create `TrainerForm.tsx`
  - [ ] Comprehensive form for trainer creation/editing
  - [ ] Fields: Personal info, professional details, rates
  - [ ] Specializations multi-select
  - [ ] Certification date fields
  - [ ] Validation with proper error handling

- [ ] Create `AddTrainerDialog.tsx`
  - [ ] Modal for adding new trainers
  - [ ] Uses TrainerForm component
  - [ ] Success navigation to trainer profile

- [ ] Create `EditTrainerDialog.tsx`
  - [ ] Modal for editing existing trainers
  - [ ] Pre-populated form with trainer data
  - [ ] Update mutation and cache invalidation

### Search & Filters

- [ ] Create `SimpleTrainerFilters.tsx`
  - [ ] Inline filter controls
  - [ ] Status dropdown
  - [ ] Specialization multi-select
  - [ ] Available for new clients toggle

### Utilities

- [ ] Create `TrainerErrorBoundary.tsx`
  - [ ] Error boundary for trainer components
  - [ ] Graceful error handling and recovery

- [ ] Create `index.ts` - Export all components

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
