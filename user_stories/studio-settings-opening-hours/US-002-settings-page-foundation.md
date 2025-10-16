# US-002: Settings Page Foundation

## 📋 User Story

**As a** gym administrator
**I want** a dedicated settings page with organized tabs
**So that** I can easily navigate and manage different studio configurations

---

## 🎯 Business Value

**Value**: Provides UI foundation for all settings features
**Impact**: Medium - Enables admin to access settings interface
**Priority**: P0 (Must Have)
**Estimated Effort**: 3 hours

---

## 📐 Acceptance Criteria

### ✅ AC1: Settings Page Route

**Given** I am logged in as an admin
**When** I click "Settings" in the sidebar
**Then** I should be redirected to `/settings/studio`

**And When** I am logged in as a non-admin
**Then** I should see an "Access Denied" message or be redirected

### ✅ AC2: Tabbed Layout

**Given** I am on the settings page
**When** the page loads
**Then** I should see a tabbed interface with:

- "Opening Hours" tab (active by default)
- "General" tab (disabled with "Coming Soon" indicator)
- "Payment" tab (disabled with "Coming Soon" indicator)

### ✅ AC3: Opening Hours Tab Content

**Given** I am on the "Opening Hours" tab
**When** the tab content renders
**Then** I should see:

- Page title: "Studio Opening Hours"
- Description text explaining the feature
- Empty container for the opening hours editor (will be filled in US-003)

### ✅ AC4: Settings Hook Functionality

**Given** the settings hook is implemented
**When** I call `useStudioSettings('opening_hours')`
**Then** it should:

- Fetch current settings from the database
- Return loading state while fetching
- Return error state if fetch fails
- Cache the result using React Query

### ✅ AC5: Responsive Layout

**Given** I am on the settings page
**When** I view it on different screen sizes
**Then** the layout should be responsive:

- Desktop: Full tabbed layout with sidebar
- Mobile: Stacked layout with hamburger menu

---

## 🏗️ Technical Specification

### File Structure

```
src/features/settings/
├── components/
│   ├── StudioSettingsLayout.tsx         # Main layout with tabs
│   ├── OpeningHoursTab.tsx              # Opening hours tab content
│   ├── index.ts                         # Exports
│   └── __tests__/
│       ├── StudioSettingsLayout.test.tsx
│       └── OpeningHoursTab.test.tsx
├── hooks/
│   ├── use-studio-settings.ts           # Main settings hook
│   ├── index.ts
│   └── __tests__/
│       └── use-studio-settings.test.ts
├── lib/
│   ├── types.ts                         # TypeScript types
│   ├── settings-api.ts                  # API functions
│   └── __tests__/
│       └── settings-api.test.ts
└── index.ts

src/app/settings/studio/
└── page.tsx                             # Next.js page
```

### TypeScript Types

```typescript
// src/features/settings/lib/types.ts

export interface OpeningHoursDay {
  is_open: boolean;
  open_time: string | null; // "HH:MM" format or null if closed
  close_time: string | null; // "HH:MM" format or null if closed
}

export interface OpeningHoursWeek {
  monday: OpeningHoursDay;
  tuesday: OpeningHoursDay;
  wednesday: OpeningHoursDay;
  thursday: OpeningHoursDay;
  friday: OpeningHoursDay;
  saturday: OpeningHoursDay;
  sunday: OpeningHoursDay;
}

export interface StudioSettings {
  id: string;
  setting_key: string;
  setting_value: OpeningHoursWeek | unknown;
  effective_from: string; // ISO date string
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";
```

### Settings Page Component

```typescript
// src/app/settings/studio/page.tsx

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { StudioSettingsLayout } from '@/features/settings';

export default async function StudioSettingsPage() {
  const supabase = createClient();

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="container py-6">
      <StudioSettingsLayout />
    </div>
  );
}
```

### Layout Component

```typescript
// src/features/settings/components/StudioSettingsLayout.tsx

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { OpeningHoursTab } from './OpeningHoursTab';
import { Settings, Clock, CreditCard, Building } from 'lucide-react';

export function StudioSettingsLayout() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Studio Settings</h1>
        </div>
        <p className="text-muted-foreground mt-2">
          Configure your gym's operational settings and preferences
        </p>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="opening-hours" className="space-y-4">
        <TabsList>
          <TabsTrigger value="opening-hours" className="gap-2">
            <Clock className="h-4 w-4" />
            Opening Hours
          </TabsTrigger>
          <TabsTrigger value="general" disabled>
            <Building className="h-4 w-4" />
            General
            <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
          </TabsTrigger>
          <TabsTrigger value="payment" disabled>
            <CreditCard className="h-4 w-4" />
            Payment
            <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="opening-hours">
          <OpeningHoursTab />
        </TabsContent>

        <TabsContent value="general">
          <Card className="p-6">
            <p className="text-muted-foreground">General settings coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card className="p-6">
            <p className="text-muted-foreground">Payment settings coming soon...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Opening Hours Tab

```typescript
// src/features/settings/components/OpeningHoursTab.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudioSettings } from '../hooks/use-studio-settings';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function OpeningHoursTab() {
  const { data: settings, isLoading, error } = useStudioSettings('opening_hours');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load opening hours settings. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Studio Opening Hours</CardTitle>
        <CardDescription>
          Set the days and times when your studio is open for training sessions.
          Changes will affect available booking slots.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Placeholder for WeeklyOpeningHoursGrid (US-003) */}
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            Opening hours editor will appear here (US-003)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Settings Hook

```typescript
// src/features/settings/hooks/use-studio-settings.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStudioSettings, updateStudioSettings } from "../lib/settings-api";
import type { StudioSettings } from "../lib/types";

export function useStudioSettings(settingKey: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["studio-settings", settingKey],
    queryFn: () => fetchStudioSettings(settingKey),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: ({
      value,
      effectiveFrom,
    }: {
      value: unknown;
      effectiveFrom: Date;
    }) => updateStudioSettings(settingKey, value, effectiveFrom),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["studio-settings", settingKey],
      });
    },
  });

  return {
    ...query,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}
```

### API Functions

```typescript
// src/features/settings/lib/settings-api.ts

import { supabase } from "@/lib/supabase";
import type { StudioSettings } from "./types";

export async function fetchStudioSettings(
  settingKey: string
): Promise<StudioSettings | null> {
  const { data, error } = await supabase
    .from("studio_settings")
    .select("*")
    .eq("setting_key", settingKey)
    .eq("is_active", true)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw error;
  }

  return data;
}

export async function updateStudioSettings(
  settingKey: string,
  value: unknown,
  effectiveFrom: Date
): Promise<StudioSettings> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("studio_settings")
    .insert({
      setting_key: settingKey,
      setting_value: value,
      effective_from: effectiveFrom.toISOString().split("T")[0],
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}
```

---

## 🔧 Implementation Steps

1. **Create Feature Folder Structure**

   ```bash
   mkdir -p src/features/settings/{components,hooks,lib}
   mkdir -p src/features/settings/{components,hooks,lib}/__tests__
   ```

2. **Create TypeScript Types**
   - Create `src/features/settings/lib/types.ts`
   - Define all interfaces as specified above

3. **Create API Functions**
   - Create `src/features/settings/lib/settings-api.ts`
   - Implement `fetchStudioSettings()` and `updateStudioSettings()`

4. **Create Settings Hook**
   - Create `src/features/settings/hooks/use-studio-settings.ts`
   - Implement React Query hook with caching

5. **Create Components**
   - Create `StudioSettingsLayout.tsx` with tabs
   - Create `OpeningHoursTab.tsx` placeholder
   - Add proper loading and error states

6. **Create Page Route**
   - Create `src/app/settings/studio/page.tsx`
   - Add authentication and authorization checks
   - Render settings layout

7. **Update Sidebar** (if needed)
   - Verify Settings link exists in `src/components/layout/sidebar.tsx`
   - Link should point to `/settings/studio`

8. **Write Tests**
   - Test settings hook with mocked data
   - Test API functions
   - Test component rendering

---

## 🧪 Testing Checklist

- [ ] Settings page accessible at `/settings/studio`
- [ ] Non-admin users redirected or see access denied
- [ ] Admin users see tabbed interface
- [ ] "Opening Hours" tab is active by default
- [ ] Other tabs are disabled with "Coming Soon" labels
- [ ] Settings hook fetches data successfully
- [ ] Loading state displays skeleton
- [ ] Error state displays error message
- [ ] React Query caching works (check Network tab)
- [ ] Responsive layout works on mobile/desktop
- [ ] All TypeScript types compile without errors

---

## 🐛 Known Issues / Edge Cases

1. **First Load**: If no settings exist yet, handle null gracefully
2. **Stale Data**: React Query staleTime prevents excessive refetching
3. **Auth Race Condition**: Server-side auth check prevents unauthorized access

---

## 📊 Definition of Done

- [ ] Feature folder structure created
- [ ] TypeScript types defined
- [ ] API functions implemented
- [ ] Settings hook implemented with React Query
- [ ] Settings page route created
- [ ] Auth guards in place (admin-only)
- [ ] StudioSettingsLayout component created
- [ ] OpeningHoursTab placeholder created
- [ ] All components properly typed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Sidebar navigation verified
- [ ] Responsive layout tested
- [ ] STATUS.md updated

---

## 🔗 Related User Stories

- **Depends On**: US-001 (Database Schema)
- **Blocks**: US-003 (Weekly Opening Hours Editor)

---

## 📚 References

- [AGENT-GUIDE.md](./AGENT-GUIDE.md) - Phase 2
- [README.md](./README.md) - Frontend architecture
- [shadcn/ui Tabs](https://ui.shadcn.com/docs/components/tabs)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Story ID**: US-002
**Created**: 2025-10-16
**Status**: Not Started
**Depends On**: US-001
