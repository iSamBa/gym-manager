"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, X, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useDebouncedMemberSearch } from "../hooks/use-member-search";
import type { Member } from "@/features/database/lib/types";

interface AdvancedMemberSearchProps {
  placeholder?: string;
  onMemberSelect?: (member: Member) => void;
  onSearchResults?: (members: Member[]) => void;
  maxResults?: number;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function AdvancedMemberSearch({
  placeholder = "Search members...",
  onMemberSelect,
  onSearchResults,
  maxResults = 10,
  className,
  disabled = false,
  autoFocus = false,
}: AdvancedMemberSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const { query, updateQuery, clearQuery, results, isSearching } =
    useDebouncedMemberSearch("", 300);

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
      // Clear the search input after selection
      clearQuery();
      setIsOpen(false);
      setSelectedIndex(-1);
    },
    [onMemberSelect, clearQuery]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      const memberResults = results.slice(0, maxResults);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < memberResults.length - 1 ? prev + 1 : 0
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : memberResults.length - 1
          );
          break;

        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && memberResults[selectedIndex]) {
            handleMemberSelect(memberResults[selectedIndex]);
          }
          break;

        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [isOpen, results, maxResults, selectedIndex, handleMemberSelect]
  );

  const memberResults = results.slice(0, maxResults);
  const showResults =
    isOpen && query.length > 0 && (memberResults.length > 0 || isSearching);

  return (
    <div className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            updateQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay closing to allow for click events
            setTimeout(() => setIsOpen(false), 200);
          }}
          onKeyDown={handleKeyDown}
          className="pr-10 pl-10"
          disabled={disabled}
          autoFocus={autoFocus}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              clearQuery();
              setIsOpen(false);
              setSelectedIndex(-1);
            }}
            className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 transform p-0"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="bg-popover absolute top-full z-50 mt-1 w-full rounded-md border shadow-lg">
          <Command className="border-0">
            <CommandList className="max-h-[300px] overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center p-4">
                  <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                    <span>Searching...</span>
                  </div>
                </div>
              ) : memberResults.length === 0 ? (
                <CommandEmpty>No members found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {memberResults.map((member, index) => (
                    <CommandItem
                      key={member.id}
                      value={member.id}
                      onSelect={() => handleMemberSelect(member)}
                      className={cn(
                        "cursor-pointer",
                        selectedIndex === index && "bg-accent"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
