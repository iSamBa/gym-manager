import React, { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Member } from "@/features/database/lib/types";
import { useMembers } from "@/features/members/hooks";

interface MemberMultiSelectProps {
  selectedMemberIds: string[];
  onMemberIdsChange: (memberIds: string[]) => void;
  maxMembers?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
}

export const MemberMultiSelect: React.FC<MemberMultiSelectProps> = ({
  selectedMemberIds,
  onMemberIdsChange,
  maxMembers = 50,
  placeholder = "Select members...",
  className,
  disabled = false,
  error,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all active members
  const { data: members = [], isLoading } = useMembers();

  // Filter members based on search term
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;

    const term = searchTerm.toLowerCase();
    return members.filter(
      (member) =>
        `${member.first_name} ${member.last_name}`
          .toLowerCase()
          .includes(term) || member.email?.toLowerCase().includes(term)
    );
  }, [members, searchTerm]);

  // Get selected members for display
  const selectedMembers = useMemo(() => {
    return members.filter((member) => selectedMemberIds.includes(member.id));
  }, [members, selectedMemberIds]);

  const handleMemberToggle = (member: Member) => {
    const isSelected = selectedMemberIds.includes(member.id);

    if (isSelected) {
      // Remove member
      onMemberIdsChange(selectedMemberIds.filter((id) => id !== member.id));
    } else {
      // Add member (check max limit)
      if (selectedMemberIds.length < maxMembers) {
        onMemberIdsChange([...selectedMemberIds, member.id]);
      }
    }
  };

  const handleRemoveMember = (
    memberId: string,
    event: React.MouseEvent | React.KeyboardEvent
  ) => {
    event.stopPropagation();
    onMemberIdsChange(selectedMemberIds.filter((id) => id !== memberId));
  };

  const handleClearAll = () => {
    onMemberIdsChange([]);
    setOpen(false);
  };

  const formatMemberName = (member: Member) => {
    return `${member.first_name} ${member.last_name}`;
  };

  const isMaxReached = selectedMemberIds.length >= maxMembers;

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-auto min-h-10 w-full justify-between",
              error && "border-destructive",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
          >
            <div className="flex min-w-0 flex-1 flex-wrap gap-1">
              {selectedMembers.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <>
                  {selectedMembers.slice(0, 3).map((member) => (
                    <Badge
                      key={member.id}
                      variant="secondary"
                      className="max-w-[120px] text-xs"
                    >
                      <span className="truncate">
                        {formatMemberName(member)}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleRemoveMember(member.id, e)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRemoveMember(member.id, e);
                          }
                        }}
                        className="hover:bg-secondary-foreground/10 ml-1 inline-flex cursor-pointer rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </Badge>
                  ))}
                  {selectedMembers.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{selectedMembers.length - 3} more
                    </Badge>
                  )}
                </>
              )}
            </div>
            <div className="ml-2 flex items-center gap-2">
              {selectedMembers.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {selectedMembers.length}/{maxMembers}
                </Badge>
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search members..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandList>
              <div className="h-[300px] overflow-y-auto">
                {/* Header with count and clear button */}
                {selectedMembers.length > 0 && (
                  <div className="bg-muted/50 flex items-center justify-between border-b px-3 py-2">
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      {selectedMembers.length} selected
                      {isMaxReached && (
                        <span className="text-orange-600">(max reached)</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="h-6 px-2 text-xs"
                    >
                      Clear all
                    </Button>
                  </div>
                )}

                <CommandEmpty>
                  {isLoading ? (
                    <div className="py-6 text-center text-sm">
                      <div className="border-primary mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-b-2"></div>
                      Loading members...
                    </div>
                  ) : (
                    "No members found."
                  )}
                </CommandEmpty>

                <CommandGroup>
                  {filteredMembers.map((member) => {
                    const isSelected = selectedMemberIds.includes(member.id);
                    const canSelect = !isSelected && !isMaxReached;

                    return (
                      <CommandItem
                        key={member.id}
                        onSelect={() => {
                          if (isSelected || canSelect) {
                            handleMemberToggle(member);
                          }
                        }}
                        className={cn(
                          "cursor-pointer",
                          !canSelect &&
                            !isSelected &&
                            "cursor-not-allowed opacity-50"
                        )}
                        disabled={!canSelect && !isSelected}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">
                            {formatMemberName(member)}
                          </div>
                          <div className="text-muted-foreground truncate text-sm">
                            {member.email}
                          </div>
                        </div>
                        {isSelected && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Selected
                          </Badge>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Error message */}
      {error && <p className="text-destructive mt-1 text-sm">{error}</p>}

      {/* Helper text */}
      <p className="text-muted-foreground mt-1 text-xs">
        {selectedMembers.length === 0
          ? `Select up to ${maxMembers} members for this training session`
          : `${selectedMembers.length} of ${maxMembers} members selected`}
      </p>
    </div>
  );
};

export default MemberMultiSelect;
