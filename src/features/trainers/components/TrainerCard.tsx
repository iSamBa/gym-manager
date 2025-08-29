import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Edit,
  MoreVertical,
  Trash2,
  User,
  Loader2,
  GraduationCap,
  DollarSign,
  Clock,
  Award,
} from "lucide-react";
import { useDeleteTrainer } from "@/features/trainers/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TrainerAvatar } from "./TrainerAvatar";
import { TrainerStatusBadge } from "./TrainerStatusBadge";
import type { TrainerWithProfile } from "@/features/database/lib/types";

interface TrainerCardProps {
  trainer: TrainerWithProfile;
  variant?: "compact" | "full" | "minimal";
  showActions?: boolean;
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onHover?: () => void;
}

export function TrainerCard({
  trainer,
  variant = "compact",
  showActions = true,
  className,
  onEdit,
  onDelete,
  onHover,
}: TrainerCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteTrainerMutation = useDeleteTrainer();

  const handleDelete = async () => {
    try {
      await deleteTrainerMutation.mutateAsync(trainer.id);

      onDelete?.();

      toast.success("Trainer Deleted", {
        description: `${trainer.user_profile?.first_name || "Trainer"} ${trainer.user_profile?.last_name || ""} has been removed from the system.`,
      });
    } catch {
      toast.error("Delete Failed", {
        description: "Failed to delete trainer. Please try again.",
      });
    }
    setDeleteDialogOpen(false);
  };

  const formatHourlyRate = (rate?: number) => {
    if (!rate) return "Rate not set";
    return `$${rate}/hour`;
  };

  const formatExperience = (years?: number) => {
    if (!years) return "Experience not specified";
    return `${years} year${years === 1 ? "" : "s"} experience`;
  };

  if (variant === "minimal") {
    return (
      <div
        className={cn("flex items-center gap-2", className)}
        onMouseEnter={onHover}
      >
        <TrainerAvatar trainer={trainer} size="sm" />
        <span className="text-sm font-medium">
          {trainer.user_profile?.first_name || "Unknown"}{" "}
          {trainer.user_profile?.last_name || "Trainer"}
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <Card className={cn("p-3", className)} onMouseEnter={onHover}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrainerAvatar trainer={trainer} size="md" showStatus />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-medium">
                  {trainer.user_profile?.first_name || "Unknown"}{" "}
                  {trainer.user_profile?.last_name || "Trainer"}
                </h3>
                <TrainerStatusBadge
                  isAcceptingNewClients={trainer.is_accepting_new_clients}
                  trainerId={trainer.id}
                  readonly={!showActions}
                />
              </div>
              <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                {trainer.hourly_rate && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {trainer.hourly_rate}/hr
                  </span>
                )}
                {trainer.years_experience && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {trainer.years_experience}y exp
                  </span>
                )}
              </div>
              {trainer.specializations &&
                trainer.specializations.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {trainer.specializations.slice(0, 2).map((spec, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="px-1.5 py-0.5 text-xs"
                      >
                        {spec}
                      </Badge>
                    ))}
                    {trainer.specializations.length > 2 && (
                      <Badge
                        variant="outline"
                        className="px-1.5 py-0.5 text-xs"
                      >
                        +{trainer.specializations.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
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
                  Edit Trainer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Trainer
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
              <TrainerAvatar trainer={trainer} size="lg" showStatus />
              <div>
                <h3 className="text-lg font-semibold">
                  {trainer.user_profile?.first_name || "Unknown"}{" "}
                  {trainer.user_profile?.last_name || "Trainer"}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <TrainerStatusBadge
                    isAcceptingNewClients={trainer.is_accepting_new_clients}
                    trainerId={trainer.id}
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
                    Edit Trainer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Trainer
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
              <p className="font-medium">
                {trainer.user_profile?.email || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">
                {trainer.user_profile?.phone || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Hourly Rate</p>
              <p className="font-medium">
                {formatHourlyRate(trainer.hourly_rate)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Experience</p>
              <p className="font-medium">
                {formatExperience(trainer.years_experience)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Max Clients/Session</p>
              <p className="font-medium">{trainer.max_clients_per_session}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Commission Rate</p>
              <p className="font-medium">{trainer.commission_rate}%</p>
            </div>
          </div>

          {trainer.specializations && trainer.specializations.length > 0 && (
            <div className="mt-4">
              <p className="text-muted-foreground mb-2 flex items-center gap-1 text-sm">
                <GraduationCap className="h-4 w-4" />
                Specializations
              </p>
              <div className="flex flex-wrap gap-1">
                {trainer.specializations.map((spec, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {trainer.certifications && trainer.certifications.length > 0 && (
            <div className="mt-4">
              <p className="text-muted-foreground mb-2 flex items-center gap-1 text-sm">
                <Award className="h-4 w-4" />
                Certifications
              </p>
              <div className="flex flex-wrap gap-1">
                {trainer.certifications.map((cert, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {trainer.languages && trainer.languages.length > 0 && (
            <div className="mt-4">
              <p className="text-muted-foreground mb-2 text-sm">Languages</p>
              <p className="text-sm">{trainer.languages.join(", ")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trainer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {trainer.user_profile?.first_name || "this trainer"}{" "}
                {trainer.user_profile?.last_name || ""}
              </strong>
              ? This action cannot be undone and will remove all trainer data
              including session history and assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTrainerMutation.isPending}
            >
              {deleteTrainerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Trainer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
