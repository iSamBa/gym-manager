import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, MoreVertical, Trash2, User, Loader2 } from "lucide-react";
import { useDeleteMember } from "@/features/members/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "./MemberAvatar";
import { MemberStatusBadge } from "./MemberStatusBadge";
import type { Member } from "@/features/database/lib/types";

interface MemberCardProps {
  member: Member;
  variant?: "compact" | "full" | "minimal";
  showActions?: boolean;
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onHover?: () => void;
}

export function MemberCard({
  member,
  variant = "compact",
  showActions = true,
  className,
  onEdit,
  onDelete,
  onHover,
}: MemberCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteMemberMutation = useDeleteMember();

  const handleDelete = async () => {
    try {
      await deleteMemberMutation.mutateAsync(member.id);

      onDelete?.();

      toast.success("Member Deleted", {
        description: `${member.first_name} ${member.last_name} has been removed from the system.`,
      });
    } catch {
      toast.error("Delete Failed", {
        description: "Failed to delete member. Please try again.",
      });
    }
    setDeleteDialogOpen(false);
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (variant === "minimal") {
    return (
      <div
        className={cn("flex items-center gap-2", className)}
        onMouseEnter={onHover}
      >
        <MemberAvatar member={member} size="sm" />
        <span className="text-sm font-medium">
          {member.first_name} {member.last_name}
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <Card className={cn("p-3", className)} onMouseEnter={onHover}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MemberAvatar member={member} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-medium">
                  {member.first_name} {member.last_name}
                </h3>
                <MemberStatusBadge
                  status={member.status}
                  memberId={member.id}
                  readonly={!showActions}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Joined {formatJoinDate(member.join_date)}
              </p>
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Member
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Card>
    );
  }

  // Full variant
  return (
    <>
      <Card className={cn("p-4", className)} onMouseEnter={onHover}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <MemberAvatar member={member} size="lg" />
              <div>
                <h3 className="text-lg font-semibold">
                  {member.first_name} {member.last_name}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <MemberStatusBadge
                    status={member.status}
                    memberId={member.id}
                    readonly={!showActions}
                  />
                </div>
              </div>
            </div>

            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Member
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{member.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{member.phone || "Not provided"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Join Date</p>
              <p className="font-medium">{formatJoinDate(member.join_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Contact Method</p>
              <p className="font-medium capitalize">
                {member.preferred_contact_method}
              </p>
            </div>
          </div>

          {member.fitness_goals && (
            <div className="mt-4">
              <p className="text-muted-foreground text-sm">Fitness Goals</p>
              <p className="text-sm">{member.fitness_goals}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {member.first_name} {member.last_name}
              </strong>
              ? This action cannot be undone and will remove all member data
              including subscription history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMemberMutation.isPending}
            >
              {deleteMemberMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
