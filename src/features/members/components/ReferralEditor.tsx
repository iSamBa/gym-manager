"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Member, ReferralSource } from "@/features/database/lib/types";
import { useUpdateMember, useMembers } from "@/features/members/hooks";
import { toast } from "sonner";
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

interface ReferralEditorProps {
  member: Member;
  className?: string;
}

// Format referral source for display
const formatReferralSource = (source: ReferralSource): string => {
  const mapping: Record<ReferralSource, string> = {
    instagram: "Instagram",
    member_referral: "Member Referral",
    website_ib: "Website (Inbound)",
    prospection: "Prospection (Outbound)",
    studio: "Studio (Walk-in)",
    phone: "Phone",
    chatbot: "Chatbot",
  };
  return mapping[source];
};

export function ReferralEditor({ member, className }: ReferralEditorProps) {
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const updateMemberMutation = useUpdateMember();

  // Fetch all members for the referral search (set high limit to get all)
  const { data: allMembers = [] } = useMembers({ limit: 10000 });

  // Filter out current member from the list
  const selectableMembers = useMemo(
    () => allMembers.filter((m) => m.id !== member.id),
    [allMembers, member.id]
  );

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) {
      return selectableMembers;
    }

    const query = searchQuery.toLowerCase().trim();
    return selectableMembers.filter((m) => {
      const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
      const email = m.email.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [selectableMembers, searchQuery]);

  // Find referred by member name
  const referredByMember = useMemo(
    () => selectableMembers.find((m) => m.id === member.referred_by_member_id),
    [selectableMembers, member.referred_by_member_id]
  );

  const handleUpdate = useCallback(
    async (field: string, value: unknown) => {
      try {
        await updateMemberMutation.mutateAsync({
          id: member.id,
          data: {
            [field]: value,
          },
        });

        toast.success("Updated", {
          description: "Member referral information has been updated.",
        });
      } catch (error) {
        toast.error("Update Failed", {
          description:
            error instanceof Error
              ? error.message
              : "Failed to update referral information. Please try again.",
        });
      }
    },
    [member.id, updateMemberMutation]
  );

  // Handle referral source change
  const handleReferralSourceChange = useCallback(
    async (value: ReferralSource) => {
      // Clear referred_by if changing away from member_referral
      if (value !== "member_referral") {
        await handleUpdate("referral_source", value);
        await handleUpdate("referred_by_member_id", undefined);
      } else {
        await handleUpdate("referral_source", value);
      }
    },
    [handleUpdate]
  );

  const handleReferredByChange = useCallback(
    async (memberId: string) => {
      await handleUpdate("referred_by_member_id", memberId);
      setMemberSearchOpen(false);
    },
    [handleUpdate]
  );

  // Safety check - if member is not defined, don't render
  if (!member) {
    return null;
  }

  return (
    <div
      className={cn("grid grid-cols-1 gap-3 text-sm md:grid-cols-2", className)}
    >
      {/* Referral Source */}
      <div>
        <span className="text-muted-foreground">Referral Source:</span>
        <Select
          value={member.referral_source}
          onValueChange={handleReferralSourceChange}
        >
          <SelectTrigger className="mt-1 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="member_referral">Member Referral</SelectItem>
            <SelectItem value="website_ib">Website (Inbound)</SelectItem>
            <SelectItem value="prospection">Prospection (Outbound)</SelectItem>
            <SelectItem value="studio">Studio (Walk-in)</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="chatbot">Chatbot</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Referred By Member (conditional) */}
      {member.referral_source === "member_referral" && (
        <div>
          <span className="text-muted-foreground">Referred By:</span>
          <Popover
            open={memberSearchOpen}
            onOpenChange={(open) => {
              setMemberSearchOpen(open);
              if (!open) setSearchQuery("");
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={memberSearchOpen}
                className="mt-1 h-8 w-full justify-between"
              >
                {referredByMember
                  ? `${referredByMember.first_name} ${referredByMember.last_name}`
                  : "Select member..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search members..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>No member found.</CommandEmpty>
                  <CommandGroup>
                    {filteredMembers.map((m) => (
                      <CommandItem
                        key={m.id}
                        value={m.id}
                        onSelect={() => handleReferredByChange(m.id)}
                      >
                        {m.first_name} {m.last_name}
                        <span className="text-muted-foreground ml-2 text-xs">
                          ({m.email})
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
