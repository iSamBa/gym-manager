import { useState, useCallback, useMemo } from "react";
import type { Member } from "@/features/database/lib/types";

export interface BulkSelectionOptions {
  maxSelections?: number;
  crossPageSelection?: boolean;
  onSelectionChange?: (
    selectedIds: string[],
    selectedMembers: Member[]
  ) => void;
}

export function useBulkSelection(
  members: Member[] = [],
  options: BulkSelectionOptions = {}
) {
  const {
    maxSelections = 1000,
    crossPageSelection = true,
    onSelectionChange,
  } = options;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get currently selected members from the current page
  const selectedMembers = useMemo(() => {
    return members.filter((member) => selectedIds.has(member.id));
  }, [members, selectedIds]);

  // Selection metrics
  const selectionCount = selectedIds.size;
  const isAllSelected =
    members.length > 0 && members.every((member) => selectedIds.has(member.id));
  const isPartiallySelected = selectionCount > 0 && !isAllSelected;
  const canSelectMore = selectionCount < maxSelections;

  // Toggle individual member selection
  const toggleSelection = useCallback(
    (memberId: string) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);

        if (newSet.has(memberId)) {
          newSet.delete(memberId);
        } else if (newSet.size < maxSelections) {
          newSet.add(memberId);
        }

        // Notify parent of changes
        if (onSelectionChange) {
          const selectedMembersList = members.filter((member) =>
            newSet.has(member.id)
          );
          onSelectionChange(Array.from(newSet), selectedMembersList);
        }

        return newSet;
      });
    },
    [members, maxSelections, onSelectionChange]
  );

  // Select multiple members at once
  const selectMembers = useCallback(
    (memberIds: string[]) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);

        memberIds.forEach((id) => {
          if (newSet.size < maxSelections) {
            newSet.add(id);
          }
        });

        // Notify parent of changes
        if (onSelectionChange) {
          const selectedMembersList = members.filter((member) =>
            newSet.has(member.id)
          );
          onSelectionChange(Array.from(newSet), selectedMembersList);
        }

        return newSet;
      });
    },
    [members, maxSelections, onSelectionChange]
  );

  // Deselect multiple members at once
  const deselectMembers = useCallback(
    (memberIds: string[]) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);

        memberIds.forEach((id) => {
          newSet.delete(id);
        });

        // Notify parent of changes
        if (onSelectionChange) {
          const selectedMembersList = members.filter((member) =>
            newSet.has(member.id)
          );
          onSelectionChange(Array.from(newSet), selectedMembersList);
        }

        return newSet;
      });
    },
    [members, onSelectionChange]
  );

  // Select all visible members
  const selectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);

      members.forEach((member) => {
        if (newSet.size < maxSelections) {
          newSet.add(member.id);
        }
      });

      // Notify parent of changes
      if (onSelectionChange) {
        const selectedMembersList = members.filter((member) =>
          newSet.has(member.id)
        );
        onSelectionChange(Array.from(newSet), selectedMembersList);
      }

      return newSet;
    });
  }, [members, maxSelections, onSelectionChange]);

  // Deselect all visible members
  const deselectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);

      // Remove only the visible members from selection
      members.forEach((member) => {
        newSet.delete(member.id);
      });

      // Notify parent of changes
      if (onSelectionChange) {
        const selectedMembersList = members.filter((member) =>
          newSet.has(member.id)
        );
        onSelectionChange(Array.from(newSet), selectedMembersList);
      }

      return newSet;
    });
  }, [members, onSelectionChange]);

  // Toggle all visible members
  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [isAllSelected, selectAll, deselectAll]);

  // Clear all selections (including cross-page if enabled)
  const clearAll = useCallback(() => {
    setSelectedIds(new Set());

    if (onSelectionChange) {
      onSelectionChange([], []);
    }
  }, [onSelectionChange]);

  // Check if a member is selected
  const isSelected = useCallback(
    (memberId: string) => {
      return selectedIds.has(memberId);
    },
    [selectedIds]
  );

  // Get selected member IDs as array
  const getSelectedIds = useCallback(() => {
    return Array.from(selectedIds);
  }, [selectedIds]);

  // Select members by filter criteria
  const selectByFilter = useCallback(
    (filterFn: (member: Member) => boolean) => {
      const matchingIds = members.filter(filterFn).map((member) => member.id);
      selectMembers(matchingIds);
    },
    [members, selectMembers]
  );

  // Deselect members by filter criteria
  const deselectByFilter = useCallback(
    (filterFn: (member: Member) => boolean) => {
      const matchingIds = members.filter(filterFn).map((member) => member.id);
      deselectMembers(matchingIds);
    },
    [members, deselectMembers]
  );

  // Invert current selection (select unselected, deselect selected)
  const invertSelection = useCallback(() => {
    setSelectedIds((prev) => {
      const newSet = new Set<string>();
      let addedCount = 0;

      // Add unselected members (up to the limit)
      members.forEach((member) => {
        if (!prev.has(member.id) && addedCount < maxSelections) {
          newSet.add(member.id);
          addedCount++;
        }
      });

      // If cross-page selection is enabled, preserve selections not in current page
      if (crossPageSelection) {
        prev.forEach((id) => {
          const isInCurrentPage = members.some((member) => member.id === id);
          if (!isInCurrentPage && newSet.size < maxSelections) {
            newSet.add(id);
          }
        });
      }

      // Notify parent of changes
      if (onSelectionChange) {
        const selectedMembersList = members.filter((member) =>
          newSet.has(member.id)
        );
        onSelectionChange(Array.from(newSet), selectedMembersList);
      }

      return newSet;
    });
  }, [members, maxSelections, crossPageSelection, onSelectionChange]);

  // Validation helpers
  const canSelectMember = useCallback(
    (memberId: string) => {
      return !selectedIds.has(memberId) && selectedIds.size < maxSelections;
    },
    [selectedIds, maxSelections]
  );

  const getRemainingSelections = useCallback(() => {
    return maxSelections - selectedIds.size;
  }, [selectedIds, maxSelections]);

  // Batch operations helpers
  const getSelectionChunks = useCallback(
    (chunkSize: number = 50) => {
      const selectedArray = Array.from(selectedIds);
      const chunks: string[][] = [];

      for (let i = 0; i < selectedArray.length; i += chunkSize) {
        chunks.push(selectedArray.slice(i, i + chunkSize));
      }

      return chunks;
    },
    [selectedIds]
  );

  return {
    // Selection state
    selectedIds,
    selectedMembers,
    selectionCount,
    isAllSelected,
    isPartiallySelected,
    canSelectMore,

    // Selection actions
    toggleSelection,
    selectMembers,
    deselectMembers,
    selectAll,
    deselectAll,
    toggleAll,
    clearAll,

    // Selection queries
    isSelected,
    getSelectedIds,

    // Advanced selection
    selectByFilter,
    deselectByFilter,
    invertSelection,

    // Validation
    canSelectMember,
    getRemainingSelections,

    // Batch processing
    getSelectionChunks,
  };
}

// Hook for cross-page selection management
export function useCrossPageSelection() {
  const [globalSelections, setGlobalSelections] = useState<Map<string, Member>>(
    new Map()
  );

  const addToGlobalSelection = useCallback((members: Member[]) => {
    setGlobalSelections((prev) => {
      const newMap = new Map(prev);
      members.forEach((member) => {
        newMap.set(member.id, member);
      });
      return newMap;
    });
  }, []);

  const removeFromGlobalSelection = useCallback((memberIds: string[]) => {
    setGlobalSelections((prev) => {
      const newMap = new Map(prev);
      memberIds.forEach((id) => {
        newMap.delete(id);
      });
      return newMap;
    });
  }, []);

  const clearGlobalSelection = useCallback(() => {
    setGlobalSelections(new Map());
  }, []);

  const getGlobalSelectedMembers = useCallback(() => {
    return Array.from(globalSelections.values());
  }, [globalSelections]);

  const getGlobalSelectedIds = useCallback(() => {
    return Array.from(globalSelections.keys());
  }, [globalSelections]);

  const isInGlobalSelection = useCallback(
    (memberId: string) => {
      return globalSelections.has(memberId);
    },
    [globalSelections]
  );

  return {
    globalSelections: globalSelections,
    globalSelectionCount: globalSelections.size,
    addToGlobalSelection,
    removeFromGlobalSelection,
    clearGlobalSelection,
    getGlobalSelectedMembers,
    getGlobalSelectedIds,
    isInGlobalSelection,
  };
}

// Selection analytics hook
export function useSelectionAnalytics() {
  const [selectionHistory, setSelectionHistory] = useState<
    Array<{
      timestamp: Date;
      action: "select" | "deselect" | "selectAll" | "clearAll";
      count: number;
      memberIds?: string[];
    }>
  >([]);

  const trackSelection = useCallback(
    (
      action: "select" | "deselect" | "selectAll" | "clearAll",
      count: number,
      memberIds?: string[]
    ) => {
      setSelectionHistory((prev) => [
        {
          timestamp: new Date(),
          action,
          count,
          memberIds,
        },
        ...prev.slice(0, 99), // Keep last 100 actions
      ]);
    },
    []
  );

  const getSelectionStats = useCallback(() => {
    const stats = {
      totalSelections: 0,
      totalDeselections: 0,
      selectAllCount: 0,
      clearAllCount: 0,
      averageSelectionSize: 0,
    };

    selectionHistory.forEach((entry) => {
      switch (entry.action) {
        case "select":
          stats.totalSelections += entry.count;
          break;
        case "deselect":
          stats.totalDeselections += entry.count;
          break;
        case "selectAll":
          stats.selectAllCount++;
          break;
        case "clearAll":
          stats.clearAllCount++;
          break;
      }
    });

    if (selectionHistory.length > 0) {
      stats.averageSelectionSize =
        selectionHistory.reduce((sum, entry) => sum + entry.count, 0) /
        selectionHistory.length;
    }

    return stats;
  }, [selectionHistory]);

  return {
    selectionHistory,
    trackSelection,
    getSelectionStats,
  };
}
