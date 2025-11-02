import { useMutation, useQueryClient } from "@tanstack/react-query";
import { convertCollaborationMember } from "../lib/collaboration-utils";
import type { ConvertCollaborationMemberInput } from "../lib/collaboration-utils";

/**
 * React Query hook for converting collaboration members to full members
 *
 * Automatically invalidates member queries on success to refetch updated data
 */
export function useConvertCollaborationMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ConvertCollaborationMemberInput) =>
      convertCollaborationMember(input),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate member queries to refetch
        queryClient.invalidateQueries({ queryKey: ["members"] });
        queryClient.invalidateQueries({
          queryKey: ["member", result.member?.id],
        });
      }
    },
  });
}
