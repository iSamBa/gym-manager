"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, X, Clock, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useDebouncedMemberSearch } from "../hooks/use-member-search";
import { useMemberSearchHistory } from "../hooks/use-advanced-search";
import type { Member } from "@/features/database/lib/types";

interface AdvancedMemberSearchProps {
  onSearchResults?: (members: Member[]) => void;
  onMemberSelect?: (member: Member) => void;
  placeholder?: string;
  className?: string;
  showHistory?: boolean;
  showSuggestions?: boolean;
}

export function AdvancedMemberSearch({
  onSearchResults,
  onMemberSelect,
  placeholder = "Search members by name...",
  className,
  showHistory = true,
  showSuggestions = true, // eslint-disable-line @typescript-eslint/no-unused-vars
}: AdvancedMemberSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const { query, updateQuery, clearQuery, isSearching, results, error } =
    useDebouncedMemberSearch("", 300);

  const { searchHistory, addToHistory, removeFromHistory, clearHistory } =
    useMemberSearchHistory();

  // Effect to notify parent of search results
  useEffect(() => {
    if (onSearchResults && results) {
      onSearchResults(results);
    }
  }, [results, onSearchResults]);

  // Handle member selection
  const handleMemberSelect = useCallback(
    (member: Member) => {
      if (onMemberSelect) {
        onMemberSelect(member);
      }
      addToHistory(query);
      setIsOpen(false);
      setSelectedIndex(-1);
    },
    [onMemberSelect, addToHistory, query]
  );

  // Handle search from history
  const handleHistorySelect = useCallback(
    (historyQuery: string) => {
      updateQuery(historyQuery);
      setIsOpen(false);
    },
    [updateQuery]
  );

  // Handle clear search
  const handleClear = useCallback(() => {
    clearQuery();
    setSelectedIndex(-1);
    if (onSearchResults) {
      onSearchResults([]);
    }
  }, [clearQuery, onSearchResults]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      const totalItems =
        results.length + (showHistory ? searchHistory.length : 0);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0) {
            if (selectedIndex < results.length) {
              handleMemberSelect(results[selectedIndex]);
            } else if (showHistory) {
              const historyIndex = selectedIndex - results.length;
              handleHistorySelect(searchHistory[historyIndex]);
            }
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [
      isOpen,
      results,
      searchHistory,
      selectedIndex,
      showHistory,
      handleMemberSelect,
      handleHistorySelect,
    ]
  );

  // Show dropdown when there are results or history
  const shouldShowDropdown =
    isOpen &&
    (results.length > 0 ||
      (query.length === 0 && showHistory && searchHistory.length > 0));

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => updateQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pr-10 pl-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="hover:bg-muted absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      {/* Loading indicator */}
      {isSearching && (
        <div className="absolute top-1/2 right-10 -translate-y-1/2">
          <div className="border-muted-foreground border-t-primary h-4 w-4 animate-spin rounded-full border-2" />
        </div>
      )}

      {/* Search results dropdown */}
      {shouldShowDropdown && (
        <div className="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute top-full z-50 mt-1 w-full rounded-md border p-0 shadow-md">
          <Command className="max-h-80">
            <CommandList>
              {/* Search results */}
              {results.length > 0 && (
                <CommandGroup heading="Members">
                  {results.map((member, index) => (
                    <CommandItem
                      key={member.id}
                      value={member.id}
                      onSelect={() => handleMemberSelect(member)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 p-3",
                        selectedIndex === index && "bg-accent"
                      )}
                    >
                      <Users className="text-muted-foreground h-4 w-4" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {member.first_name} {member.last_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            #{member.member_number}
                          </Badge>
                          <Badge
                            variant={
                              member.status === "active"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {member.status}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {member.email}
                          {member.phone && ` • ${member.phone}`}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* No results */}
              {query.length >= 2 && results.length === 0 && !isSearching && (
                <CommandEmpty className="py-6">
                  No members found matching &quot;{query}&quot;
                </CommandEmpty>
              )}

              {/* Search history */}
              {showHistory &&
                query.length === 0 &&
                searchHistory.length > 0 && (
                  <CommandGroup heading="Recent Searches">
                    {searchHistory.map((historyQuery, index) => {
                      const historyIndex = results.length + index;
                      return (
                        <CommandItem
                          key={`history-${index}`}
                          value={historyQuery}
                          onSelect={() => handleHistorySelect(historyQuery)}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 p-3",
                            selectedIndex === historyIndex && "bg-accent"
                          )}
                        >
                          <Clock className="text-muted-foreground h-4 w-4" />
                          <span className="flex-1">{historyQuery}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromHistory(historyQuery);
                            }}
                            className="hover:bg-destructive hover:text-destructive-foreground h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </CommandItem>
                      );
                    })}

                    {/* Clear history option */}
                    <CommandItem
                      onSelect={clearHistory}
                      className="text-muted-foreground hover:text-foreground justify-center p-2 text-sm"
                    >
                      Clear search history
                    </CommandItem>
                  </CommandGroup>
                )}
            </CommandList>
          </Command>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="border-destructive bg-destructive/10 text-destructive absolute top-full z-50 mt-1 w-full rounded-md border p-3 text-sm">
          Search failed. Please try again.
        </div>
      )}
    </div>
  );
}

// Export for stories and tests
export type { AdvancedMemberSearchProps };
