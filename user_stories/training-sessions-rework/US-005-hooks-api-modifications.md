# US-005: Hooks API Modifications

## 📋 User Story

**As a** developer
**I want** React Query hooks updated for machine-based sessions
**So that** components can filter by machine and handle optional trainer assignment

---

## ✅ Acceptance Criteria

### AC-1: Update useTrainingSessions Hook

- [x] Add `machine_id` filter support
- [x] Query includes machine data from view
- [x] Handle nullable trainer_id in results

### AC-2: Update useCreateTrainingSession Hook

- [x] Accept `machine_id` parameter (required)
- [x] Accept `trainer_id` as optional
- [x] Change `member_ids` to `member_id` (single)
- [x] Remove `max_participants` parameter

### AC-3: Create useMachines Hook

- [x] Fetch all machines
- [x] Filter by `is_available` if needed
- [x] Cache with React Query

### AC-4: Create useUpdateMachine Hook (Admin Only)

- [x] Toggle machine availability
- [x] Optimistic updates
- [x] Invalidate sessions query on change

---

## 🛠️ Implementation

### New Hook: `useMachines`

```typescript
// src/features/training-sessions/hooks/use-machines.ts

export const MACHINES_KEYS = {
  all: ["machines"] as const,
  lists: () => [...MACHINES_KEYS.all, "list"] as const,
  list: (filters?: { available_only?: boolean }) =>
    [...MACHINES_KEYS.lists(), filters] as const,
};

export function useMachines(filters?: { available_only?: boolean }) {
  return useQuery({
    queryKey: MACHINES_KEYS.list(filters),
    queryFn: async () => {
      let query = supabase.from("machines").select("*").order("machine_number");

      if (filters?.available_only) {
        query = query.eq("is_available", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Machine[];
    },
  });
}

export function useUpdateMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { is_available: boolean };
    }) => {
      const { data: result, error } = await supabase
        .from("machines")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MACHINES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRAINING_SESSIONS_KEYS.all });
    },
  });
}
```

### Updated Hook: `useCreateTrainingSession`

```typescript
// src/features/training-sessions/hooks/use-training-sessions.ts

export const useCreateTrainingSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSessionData) => {
      const { data: result, error } = await supabase.rpc(
        "create_training_session_with_members",
        {
          p_machine_id: data.machine_id, // NEW: Required
          p_trainer_id: data.trainer_id || null, // MODIFIED: Optional
          p_scheduled_start: data.scheduled_start,
          p_scheduled_end: data.scheduled_end,
          p_location: data.location,
          // REMOVED: p_max_participants
          p_member_ids: data.member_id ? [data.member_id] : [], // Single member as array
          p_notes: data.notes || null,
          p_session_type: data.session_type,
        }
      );

      if (error) throw new Error(`Failed to create session: ${error.message}`);
      if (!result?.success)
        throw new Error(result?.error || "Failed to create session");

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_SESSIONS_KEYS.all });
    },
  });
};
```

---

## 🧪 Testing

```typescript
describe("useMachines", () => {
  it("fetches all machines", async () => {
    const { result } = renderHook(() => useMachines());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data[0].machine_number).toBe(1);
  });

  it("filters available machines only", async () => {
    const { result } = renderHook(() => useMachines({ available_only: true }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.data.forEach((machine) => {
      expect(machine.is_available).toBe(true);
    });
  });
});

describe("useCreateTrainingSession", () => {
  it("creates session with machine and no trainer", async () => {
    const { result } = renderHook(() => useCreateTrainingSession());

    await act(async () => {
      await result.current.mutateAsync({
        machine_id: "machine-1-id",
        trainer_id: null, // No trainer
        member_id: "member-id",
        scheduled_start: "2025-01-15T10:00:00Z",
        scheduled_end: "2025-01-15T10:30:00Z",
        location: "Main Gym",
        session_type: "standard",
      });
    });

    expect(result.current.isSuccess).toBe(true);
  });
});
```

---

## 🎯 Definition of Done

- [x] All hooks updated
- [x] useMachines hook created
- [x] Type safety maintained
- [x] Tests passing
- [x] Code review approved

**Estimated Effort:** 2-3 hours
