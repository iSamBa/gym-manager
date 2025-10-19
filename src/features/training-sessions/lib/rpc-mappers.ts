/**
 * RPC Response Mappers for Training Sessions
 *
 * This module provides utilities to map database RPC function responses
 * to TypeScript interface structures expected by the frontend.
 *
 * Background:
 * - Database RPC functions may return different field names than base tables
 * - Example: `get_sessions_with_planning_indicators` returns `session_id`
 *   but the TrainingSession interface expects `id`
 *
 * Centralized mapping ensures:
 * - Type safety with proper TypeScript generics
 * - Consistent handling across all RPC calls
 * - Single source of truth for field mappings
 */

/**
 * Type helper for RPC responses with session_id field instead of id
 * Use this when typing RPC function responses before mapping
 *
 * @template T - The target type with `id` field (e.g., TrainingSession)
 *
 * @example
 * ```typescript
 * const { data } = await supabase.rpc('get_sessions_with_planning_indicators', {...});
 * const dbSessions = data as RpcSessionResponse<TrainingSession>[];
 * const sessions = mapSessionRpcResponse(dbSessions);
 * ```
 */
export type RpcSessionResponse<T> = Omit<T, "id"> & { session_id: string };

/**
 * Maps RPC function responses that use `session_id` to the standard `id` field
 * expected by the TrainingSession interface.
 *
 * Used for:
 * - `get_sessions_with_planning_indicators(start_date, end_date)`
 *
 * @template T - The target type with `id` field (e.g., TrainingSession)
 * @param data - Array of session objects from RPC with `session_id` field
 * @returns Array of session objects with `id` field (session_id mapped to id)
 *
 * @example
 * ```typescript
 * const { data } = await supabase.rpc('get_sessions_with_planning_indicators', {...});
 * const sessions = mapSessionRpcResponse<TrainingSession>(data || []);
 * // sessions[0].id now contains the value from session_id
 * ```
 */
export function mapSessionRpcResponse<T extends { id: string }>(
  data: Array<RpcSessionResponse<T>>
): Array<T> {
  return data.map((session) => {
    const { session_id, ...rest } = session;
    return {
      ...rest,
      id: session_id,
    } as unknown as T;
  });
}
