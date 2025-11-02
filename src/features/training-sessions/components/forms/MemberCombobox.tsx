"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Member } from "@/features/database/lib/types";

interface MemberComboboxProps {
  members: Member[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Show "Create New Member" option at the top */
  showAddNew?: boolean;
  /** Callback when "Create New Member" is clicked */
  onAddNew?: () => void;
}

export function MemberCombobox({
  members,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select a member",
  className,
  showAddNew = false,
  onAddNew,
}: MemberComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerWidth, setTriggerWidth] = useState<number>(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Update trigger width when component mounts or window resizes
  useEffect(() => {
    const updateWidth = () => {
      if (triggerRef.current) {
        setTriggerWidth(triggerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Filter members based on search query (name OR phone)
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) {
      return members;
    }

    const query = searchQuery.toLowerCase().trim();
    return members.filter((member) => {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
      const phone = member.phone?.toLowerCase() || "";
      return fullName.includes(query) || phone.includes(query);
    });
  }, [members, searchQuery]);

  // Find selected member
  const selectedMember = useMemo(
    () => members.find((member) => member.id === value),
    [members, value]
  );

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setSearchQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedMember
            ? `${selectedMember.first_name} ${selectedMember.last_name}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: triggerWidth > 0 ? `${triggerWidth}px` : "auto" }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or phone..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {showAddNew && onAddNew && (
              <>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      onAddNew();
                    }}
                    className="text-primary cursor-pointer"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create New Member
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            <CommandEmpty>No member found.</CommandEmpty>
            <CommandGroup>
              {filteredMembers.map((member) => (
                <CommandItem
                  key={member.id}
                  value={member.id}
                  onSelect={() => {
                    onValueChange(member.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === member.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {member.first_name} {member.last_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
