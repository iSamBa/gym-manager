# Component Patterns and Best Practices

## Overview

This document provides comprehensive guidelines for building React components in the Gym Manager application. It covers component structure, optimization patterns, and best practices that ensure maintaiability, performance, and consistency.

**Framework**: React 19 with Next.js 15.5 App Router
**UI Library**: shadcn/ui (Radix UI primitives)
**Styling**: Tailwind CSS v4
**Last Updated**: 2025-01-22

---

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Performance Optimization](#performance-optimization)
3. [Component Structure](#component-structure)
4. [State Management](#state-management)
5. [Event Handlers](#event-handlers)
6. [Data Fetching](#data-fetching)
7. [Form Patterns](#form-patterns)
8. [Error Handling](#error-handling)
9. [Testing Patterns](#testing-patterns)
10. [Common Patterns](#common-patterns)

---

## Component Architecture

### Component Hierarchy

```
src/
├── app/                     # Next.js App Router pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Route pages (Server Components by default)
│   ├── loading.tsx         # Route loading states
│   └── error.tsx           # Route error boundaries
├── components/
│   ├── ui/                 # shadcn/ui primitives (auto-generated)
│   ├── forms/              # Composed form components
│   ├── layout/             # Layout & navigation
│   ├── data-display/       # Tables, cards, lists
│   └── feedback/           # Modals, alerts, notifications
└── features/
    └── [feature]/
        └── components/     # Feature-specific components
```

### Component Classification

| Type                    | Purpose                   | Location                                          | Examples                        |
| ----------------------- | ------------------------- | ------------------------------------------------- | ------------------------------- |
| **Page Components**     | Route entry points        | `src/app/**/page.tsx`                             | Dashboard, Members List         |
| **Layout Components**   | Shared layouts            | `src/app/**/layout.tsx`                           | Root Layout, Auth Layout        |
| **UI Primitives**       | shadcn/ui components      | `src/components/ui/`                              | Button, Input, Dialog           |
| **Composed Components** | Business logic components | `src/components/` or `src/features/*/components/` | MemberForm, PaymentCard         |
| **Server Components**   | Data-fetching components  | `.tsx` (no "use client")                          | MembersList, Dashboard          |
| **Client Components**   | Interactive components    | `"use client"` directive                          | SessionBookingDialog, FilterBar |

---

## Performance Optimization

### React.memo - Prevent Unnecessary Re-renders

**When to Use**: Components > 100 lines OR expensive render logic

**Pattern**:

```typescript
import { memo } from 'react';

interface MyComponentProps {
  data: DataType;
  onAction: (id: string) => void;
}

export const MyComponent = memo(function MyComponent({
  data,
  onAction
}: MyComponentProps) {
  // Component logic here
  return (
    <div>
      {/* JSX */}
    </div>
  );
});

// Add display name for debugging
MyComponent.displayName = 'MyComponent';
```

**✅ Good Candidates**:

- Large tables or lists
- Complex forms with many fields
- Components with expensive computations
- Components deep in component tree
- Components that receive stable props

**❌ Don't Use For**:

- Very simple components (< 50 lines)
- Components that always re-render anyway
- Components with constantly changing props
- Root-level components (pages)

### useCallback - Stabilize Event Handlers

**When to Use**: ALL event handlers passed as props

**Pattern**:

```typescript
import { useCallback } from 'react';

function ParentComponent() {
  const [filter, setFilter] = useState('');

  // ✅ Stabilized event handler
  const handleFilterChange = useCallback((value: string) => {
    setFilter(value);
  }, []); // Empty deps - function never changes

  const handleItemClick = useCallback((id: string) => {
    // Depends on external value
    console.log('Clicked', id, filter);
  }, [filter]); // Include dependencies

  return (
    <ChildComponent
      onFilterChange={handleFilterChange}
      onItemClick={handleItemClick}
    />
  );
}
```

**Common Patterns**:

```typescript
// ✅ Simple handler - no dependencies
const handleClick = useCallback(() => {
  doSomething();
}, []);

// ✅ Handler with props - include in deps
const handleSave = useCallback((data: FormData) => {
  onSave?.(data);
}, [onSave]);

// ✅ Handler with state - include in deps
const handleDelete = useCallback((id: string) => {
  setItems(items.filter(item => item.id !== id));
}, [items]);

// ❌ NEVER: Inline function in props
<Button onClick={() => handleClick()} />  // Creates new function on every render

// ✅ CORRECT: Stable callback reference
<Button onClick={handleClick} />
```

### useMemo - Cache Expensive Computations

**When to Use**: Expensive operations that don't need to run on every render

**Pattern**:

```typescript
import { useMemo } from 'react';

function DataTable({ data, filters }: Props) {
  // ✅ Expensive filtering - memoize
  const filteredData = useMemo(() => {
    return data
      .filter(item => item.status === filters.status)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, filters.status]);

  // ✅ Expensive computation - memoize
  const stats = useMemo(() => {
    return {
      total: filteredData.length,
      active: filteredData.filter(d => d.active).length,
      average: filteredData.reduce((sum, d) => sum + d.value, 0) / filteredData.length
    };
  }, [filteredData]);

  return (
    <div>
      <Stats data={stats} />
      <Table data={filteredData} />
    </div>
  );
}
```

**✅ Good Candidates**:

- Array operations (filter, map, reduce)
- Complex calculations
- Object/array creation for props
- Derived state computations

**❌ Don't Memoize**:

- Simple primitive operations
- Single array access
- Simple object destructuring
- Values that change frequently

### Avoid Inline Object/Array Creation

**Problem**: New reference on every render breaks React.memo

```typescript
// ❌ BAD: New object on every render
<MyComponent config={{ option: 'value' }} />

// ✅ GOOD: Stable reference
const config = { option: 'value' }; // Outside component
<MyComponent config={config} />

// ✅ GOOD: Memoized
const config = useMemo(() => ({ option: 'value' }), []);
<MyComponent config={config} />

// ❌ BAD: New array on every render
<MyComponent items={['a', 'b', 'c']} />

// ✅ GOOD: Constant
const ITEMS = ['a', 'b', 'c'];  // Outside component
<MyComponent items={ITEMS} />
```

---

## Component Structure

### Standard Component Template

````typescript
/**
 * ComponentName - Brief description
 *
 * Detailed description of what this component does,
 * when to use it, and any important notes.
 *
 * @example
 * ```tsx
 * <ComponentName
 *   data={data}
 *   onAction={handleAction}
 * />
 * ```
 */

import { memo, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 1. Type Definitions
interface ComponentNameProps {
  /** Description of prop */
  data: DataType;
  /** Optional callback */
  onAction?: (id: string) => void;
  /** Optional CSS classes */
  className?: string;
}

// 2. Component Definition
export const ComponentName = memo(function ComponentName({
  data,
  onAction,
  className
}: ComponentNameProps) {
  // 3. Hooks (in order)
  // - useState
  // - useEffect
  // - useCallback
  // - useMemo
  // - Custom hooks

  const [localState, setLocalState] = useState<string>('');

  const handleClick = useCallback((id: string) => {
    onAction?.(id);
  }, [onAction]);

  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formatted: formatItem(item)
    }));
  }, [data]);

  // 4. Early returns for edge cases
  if (!data.length) {
    return <EmptyState message="No data available" />;
  }

  // 5. Main render
  return (
    <div className={cn('container', className)}>
      {processedData.map(item => (
        <div key={item.id}>
          <Button onClick={() => handleClick(item.id)}>
            {item.formatted}
          </Button>
        </div>
      ))}
    </div>
  );
});

// 6. Display name for debugging
ComponentName.displayName = 'ComponentName';
````

### Component Organization

**Within a component file**:

1. Imports (grouped logically)
2. Type definitions
3. Constants (outside component)
4. Helper functions (outside component)
5. Component definition
6. Hooks (in specific order)
7. Event handlers
8. Render logic
9. Display name

**Import Order**:

```typescript
// 1. React & Next.js
import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party libraries
import { useForm } from "react-hook-form";
import { z } from "zod";

// 3. UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 4. Custom hooks
import { useMembers } from "@/features/members/hooks";

// 5. Utilities
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";

// 6. Types
import type { Member } from "@/features/database/lib/types";
```

---

## State Management

### Local State (useState)

**When to Use**: Component-specific state that doesn't need to be shared

```typescript
function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
```

### Derived State (useMemo)

**When to Use**: State computed from other state/props

```typescript
function MemberList({ members, filter }: Props) {
  // ❌ BAD: Redundant state
  const [filteredMembers, setFilteredMembers] = useState(members);
  useEffect(() => {
    setFilteredMembers(members.filter(m => m.status === filter));
  }, [members, filter]);

  // ✅ GOOD: Derived state with useMemo
  const filteredMembers = useMemo(() => {
    return members.filter(m => m.status === filter);
  }, [members, filter]);

  return <Table data={filteredMembers} />;
}
```

### URL State (useSearchParams)

**When to Use**: State that should persist in URL (filters, pagination, etc.)

```typescript
'use client';

import { useSearchParams, useRouter } from 'next/navigation';

function MemberFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get('status') || 'all';

  const handleStatusChange = useCallback((newStatus: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', newStatus);
    router.push(`/members?${params.toString()}`);
  }, [searchParams, router]);

  return (
    <Select value={status} onValueChange={handleStatusChange}>
      {/* Options */}
    </Select>
  );
}
```

### Global State (Zustand)

**When to Use**: State shared across multiple components/routes

**Example**: Auth store (`src/lib/store.ts`)

```typescript
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({
    user,
    isAuthenticated: !!user
  }),
}));

// Usage in components
function Header() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div>
      {isAuthenticated ? (
        <span>Welcome, {user?.first_name}!</span>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </div>
  );
}
```

---

## Event Handlers

### Naming Convention

```typescript
// ✅ Standard prefix: handle[Event]
const handleClick = useCallback(() => { ... }, []);
const handleSubmit = useCallback(() => { ... }, []);
const handleChange = useCallback(() => { ... }, []);

// ✅ For toggling: toggle[State]
const toggleOpen = useCallback(() => { ... }, []);
const toggleExpanded = useCallback(() => { ... }, []);

// ✅ For specific actions: [action][Noun]
const deleteMember = useCallback(() => { ... }, []);
const saveMember = useCallback(() => { ... }, []);
```

### Event Handler Patterns

**Simple handlers**:

```typescript
const handleClick = useCallback(() => {
  doSomething();
}, []);
```

**Handlers with parameters**:

```typescript
// Option 1: Curry the function
const handleItemClick = useCallback((id: string) => {
  return () => {
    deleteItem(id);
  };
}, [deleteItem]);

<Button onClick={handleItemClick(item.id)} />

// Option 2: Inline (if not causing re-renders)
const handleItemClick = useCallback((id: string) => {
  deleteItem(id);
}, [deleteItem]);

<Button onClick={() => handleItemClick(item.id)} />
```

**Async handlers**:

```typescript
const handleSubmit = useCallback(async () => {
  try {
    setLoading(true);
    await createMember(formData);
    toast.success("Member created!");
    router.push("/members");
  } catch (error) {
    logger.error("Failed to create member", { error });
    toast.error(`Failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
}, [formData, createMember, router]);
```

### Preventing Default and Propagation

```typescript
// Prevent form submission default behavior
const handleSubmit = useCallback(
  (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
  },
  [submitForm]
);

// Stop event propagation
const handleClick = useCallback(
  (e: React.MouseEvent) => {
    e.stopPropagation();
    performAction();
  },
  [performAction]
);
```

---

## Data Fetching

### Server Components (Preferred)

**Default in Next.js App Router** - No "use client" directive

```typescript
// app/members/page.tsx

import { createClient } from '@/lib/supabase-server';
import { MembersList } from './MembersList';

export default async function MembersPage() {
  const supabase = createClient();

  // Fetch data on server
  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .order('join_date', { ascending: false });

  if (error) {
    throw new Error('Failed to load members');
  }

  return <MembersList members={members} />;
}
```

**Benefits**:

- No client-side loading state
- Better SEO
- Faster initial page load
- Automatic request deduplication

### Client-Side Data Fetching (React Query)

**When to Use**: Interactive data that needs real-time updates

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { useMembers } from '@/features/members/hooks';

function MembersTable() {
  const { data: members, isLoading, error } = useQuery({
    queryKey: ['members'],
    queryFn: () => fetchMembers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return <Table data={members} />;
}
```

### Data Fetching Best Practices

✅ **Do**:

- Use Server Components when possible
- Implement loading states
- Handle errors gracefully
- Cache data appropriately
- Use React Query for client-side fetching

❌ **Don't**:

- Fetch in useEffect (use React Query instead)
- Fetch in render (causes re-renders)
- Forget error boundaries
- Fetch too frequently (use caching)

---

## Form Patterns

### React Hook Form with Zod Validation

**Standard pattern** for all forms:

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// 1. Define schema
const memberSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

// 2. Component
export function MemberForm({ onSubmit, defaultValues }: Props) {
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: defaultValues || {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
    },
  });

  const handleSubmit = useCallback(async (data: MemberFormData) => {
    try {
      await onSubmit(data);
      toast.success('Saved!');
      form.reset();
    } catch (error) {
      toast.error('Failed to save');
    }
  }, [onSubmit, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </Form>
  );
}
```

### Form Optimization

```typescript
// Split large forms into sections
export const MemberFormPersonalInfo = memo(function MemberFormPersonalInfo({ control }: Props) {
  return (
    <div>
      <FormField control={control} name="first_name" ... />
      <FormField control={control} name="last_name" ... />
    </div>
  );
});

// Use in parent form
<Form {...form}>
  <MemberFormPersonalInfo control={form.control} />
  <MemberFormContactInfo control={form.control} />
  <MemberFormSubscriptionInfo control={form.control} />
</Form>
```

---

## Error Handling

### Error Boundaries

**Route-level** (`app/[route]/error.tsx`):

```typescript
'use client';

import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppErrorBoundary
      error={error}
      reset={reset}
      feature="members"
    />
  );
}
```

### Try-Catch with User Feedback

```typescript
const handleAction = useCallback(async () => {
  try {
    setLoading(true);
    await performAction();
    toast.success("Action completed!");
  } catch (error) {
    // Log for debugging
    logger.error("Action failed", {
      error,
      context: { userId, actionType },
    });

    // User-friendly message
    toast.error(
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  } finally {
    setLoading(false);
  }
}, [performAction, userId]);
```

### Mutation Error Handling (React Query)

```typescript
const mutation = useMutation({
  mutationFn: createMember,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["members"] });
    toast.success("Member created!");
  },
  onError: (error) => {
    logger.error("Failed to create member", { error });
    toast.error(`Failed: ${error.message}`);
  },
});
```

---

## Testing Patterns

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberCard } from './MemberCard';

describe('MemberCard', () => {
  it('renders member information', () => {
    const member = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      status: 'active'
    };

    render(<MemberCard member={member} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', async () => {
    const handleEdit = vi.fn();
    const member = { id: '1', first_name: 'John', last_name: 'Doe' };

    render(<MemberCard member={member} onEdit={handleEdit} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    expect(handleEdit).toHaveBeenCalledWith('1');
  });
});
```

### Hook Tests

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useMembers } from "./use-members";

describe("useMembers", () => {
  it("fetches members successfully", async () => {
    const { result } = renderHook(() => useMembers());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(3);
  });
});
```

---

## Common Patterns

### Conditional Rendering

```typescript
// ✅ Early return for loading state
if (isLoading) {
  return <LoadingSkeleton />;
}

// ✅ Early return for error state
if (error) {
  return <ErrorState error={error} />;
}

// ✅ Conditional content
{hasData && <DataDisplay data={data} />}

// ✅ Fallback content
{hasData ? (
  <DataDisplay data={data} />
) : (
  <EmptyState message="No data available" />
)}
```

### List Rendering

```typescript
// ✅ Always use key prop
{items.map(item => (
  <ItemCard key={item.id} item={item} />
))}

// ✅ Handle empty lists
{items.length > 0 ? (
  items.map(item => <ItemCard key={item.id} item={item} />)
) : (
  <EmptyState message="No items" />
)}
```

### Composition over Inheritance

```typescript
// ✅ GOOD: Compose components
function MemberCard({ member }: Props) {
  return (
    <Card>
      <CardHeader>
        <MemberAvatar member={member} />
        <MemberName member={member} />
      </CardHeader>
      <CardContent>
        <MemberDetails member={member} />
      </CardContent>
    </Card>
  );
}

// ❌ BAD: Deep component hierarchies
class MemberCard extends BaseCard {
  // Inheritance makes components rigid
}
```

### Children Pattern

```typescript
interface CardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Card({ title, children, actions }: CardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>{title}</h2>
        {actions}
      </div>
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}

// Usage
<Card
  title="Member Details"
  actions={<Button>Edit</Button>}
>
  <MemberInfo member={member} />
</Card>
```

### Render Props Pattern

```typescript
interface DataProviderProps<T> {
  data: T[];
  render: (data: T[]) => React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
}

function DataProvider<T>({ data, render, loading, error }: DataProviderProps<T>) {
  if (isLoading) return <>{loading}</>;
  if (error) return <>{error}</>;
  return <>{render(data)}</>;
}

// Usage
<DataProvider
  data={members}
  loading={<LoadingSkeleton />}
  error={<ErrorState />}
  render={(data) => (
    <Table data={data} />
  )}
/>
```

---

## shadcn/ui Best Practices

### Using UI Primitives

```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';

function MyForm() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Enter name" />
      </div>

      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      <Button type="submit">Submit</Button>
    </div>
  );
}
```

### Dialog Width Override

**Problem**: Default Dialog has `sm:max-w-lg` which overrides custom widths.

**Solution**: Match responsive prefix:

```typescript
// ❌ BAD: Non-responsive width gets overridden
<DialogContent className="w-[800px]">

// ✅ GOOD: Match responsive prefix
<DialogContent className="w-[60vw] sm:max-w-[60vw]">
```

### Custom Variants

```typescript
// Extend button variants
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

<Button
  variant="outline"
  size="sm"
  className={cn(
    buttonVariants({ variant: "outline" }),
    "hover:bg-primary/90"
  )}
>
  Custom Styled Button
</Button>
```

---

## Performance Checklist

**Before implementing any component**:

- [ ] Is this a Server Component? (default, no "use client")
- [ ] Does it need React.memo? (> 100 lines or expensive render)
- [ ] Are event handlers wrapped in useCallback?
- [ ] Are expensive computations memoized with useMemo?
- [ ] Are inline objects/arrays avoided in props?
- [ ] Is data fetching optimized (Server Component vs React Query)?
- [ ] Are there appropriate loading states?
- [ ] Is error handling implemented?

---

## Code Review Checklist

**When reviewing components**:

- [ ] Follows component structure template
- [ ] Proper TypeScript types (no `any`)
- [ ] Performance optimizations applied (memo, useCallback, useMemo)
- [ ] Event handlers properly defined
- [ ] Error handling implemented
- [ ] Loading states present
- [ ] Tests written
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] Mobile-responsive
- [ ] Follows naming conventions

---

## Anti-Patterns to Avoid

### 1. Fetching in useEffect

```typescript
// ❌ BAD: Manual fetching in useEffect
function BadComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData().then(setData).finally(() => setLoading(false));
  }, []);

  return <div>{/* ... */}</div>;
}

// ✅ GOOD: Use Server Component
async function GoodComponent() {
  const data = await fetchData();
  return <div>{/* ... */}</div>;
}

// ✅ GOOD: Use React Query for client-side
function GoodClientComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData
  });

  return <div>{/* ... */}</div>;
}
```

### 2. Not Using Keys in Lists

```typescript
// ❌ BAD: No keys or index as key
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}

// ✅ GOOD: Stable unique keys
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}
```

### 3. Mutating State Directly

```typescript
// ❌ BAD: Direct mutation
const handleAdd = () => {
  items.push(newItem); // Mutates array
  setItems(items); // React won't detect change
};

// ✅ GOOD: Create new array
const handleAdd = () => {
  setItems([...items, newItem]);
};
```

### 4. Missing Dependencies in useEffect

```typescript
// ❌ BAD: Missing dependencies
useEffect(() => {
  fetchData(userId); // userId not in deps
}, []);

// ✅ GOOD: Include all dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

---

## Additional Resources

- **React Documentation**: https://react.dev/
- **Next.js Documentation**: https://nextjs.org/docs
- **shadcn/ui Documentation**: https://ui.shadcn.com/
- **React Query Documentation**: https://tanstack.com/query/latest
- **Performance Benchmarks**: See `docs/PERFORMANCE-BENCHMARKS.md`
- **Testing Guide**: See project test files for patterns

---

**Document Version**: 1.0
**Last Updated**: 2025-01-22
**Maintained By**: Development Team
**Review Schedule**: Quarterly, or when patterns change
