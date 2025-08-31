"use client";

import { use, useState } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrainerAvatar,
  TrainerStatusBadge,
  EditTrainerDialog,
  DeleteTrainerDialog,
} from "@/features/trainers/components";
import {
  useTrainerWithProfile,
  useDeleteTrainer,
  useUpdateTrainerAvailability,
} from "@/features/trainers/hooks";
import {
  Edit,
  ArrowLeft,
  Phone,
  Mail,
  User,
  Clock,
  AlertCircle,
  Trash2,
  Award,
  Users,
  DollarSign,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface TrainerDetailPageProps {
  params: Promise<{ id: string }>;
}

// Helper function to format dates
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function TrainerDetailPage({ params }: TrainerDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Real data hooks
  const {
    data: trainer,
    isLoading,
    error,
    isFetching,
  } = useTrainerWithProfile(id);

  const deleteTrainerMutation = useDeleteTrainer();
  const updateAvailabilityMutation = useUpdateTrainerAvailability();

  const handleEditTrainer = () => {
    setIsEditDialogOpen(true);
  };

  const handleStatusChange = async (status: "active" | "inactive") => {
    if (!trainer) return;

    const newAvailability = status === "active";

    try {
      await updateAvailabilityMutation.mutateAsync({
        id: trainer.id,
        isAccepting: newAvailability,
      });

      toast.success("Status Updated", {
        description: `Trainer marked as ${newAvailability ? "available" : "unavailable"} for new clients.`,
      });
    } catch {
      toast.error("Update Failed", {
        description: "Failed to update trainer status. Please try again.",
      });
    }
  };

  const handleDeleteTrainer = () => {
    if (!trainer) return;
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!trainer) return;

    const trainerName = `${trainer.user_profile?.first_name || "Unknown"} ${trainer.user_profile?.last_name || "Trainer"}`;

    try {
      await deleteTrainerMutation.mutateAsync(trainer.id);

      toast.success("Trainer Deleted", {
        description: `${trainerName} has been removed from the system.`,
      });

      setIsDeleteDialogOpen(false);
      router.push("/trainers");
    } catch {
      toast.error("Delete Failed", {
        description: "Failed to delete trainer. Please try again.",
      });
    }
  };

  const handleEditSuccess = () => {
    // Cache invalidation is handled by the dialog
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <LoadingSkeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <LoadingSkeleton className="h-64" />
              <LoadingSkeleton className="h-48" />
            </div>
            <LoadingSkeleton className="h-96" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    console.error("Trainer detail page error:", error);

    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load trainer details: {errorMessage}
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  if (!trainer) {
    return (
      <MainLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Trainer not found.</AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/trainers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Trainers
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEditTrainer}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDeleteTrainer}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Trainer Information */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Trainer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                  <TrainerAvatar trainer={trainer} size="xl" showStatus />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {trainer.user_profile?.first_name || "Unknown"}{" "}
                        {trainer.user_profile?.last_name || "Trainer"}
                      </h3>
                      <TrainerStatusBadge
                        isAcceptingNewClients={trainer.is_accepting_new_clients}
                        trainerId={trainer.id}
                        readonly={true}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Mail className="text-muted-foreground h-4 w-4" />
                        <span>
                          {trainer.user_profile?.email || "Not provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="text-muted-foreground h-4 w-4" />
                        <span>
                          {trainer.user_profile?.phone || "Not provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="text-muted-foreground h-4 w-4" />
                        <span>${trainer.hourly_rate}/hour</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="text-muted-foreground h-4 w-4" />
                        <span>
                          Max {trainer.max_clients_per_session} clients/session
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="flex gap-2 border-t pt-4">
                  <Button
                    variant={
                      trainer.is_accepting_new_clients ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleStatusChange("active")}
                    disabled={updateAvailabilityMutation.isPending}
                  >
                    Mark Available
                  </Button>
                  <Button
                    variant={
                      !trainer.is_accepting_new_clients ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleStatusChange("inactive")}
                    disabled={updateAvailabilityMutation.isPending}
                  >
                    Mark Unavailable
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Professional Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Professional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Specializations */}
                <div>
                  <h4 className="mb-2 text-sm font-medium">Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {trainer.specializations?.map((spec, index) => (
                      <Badge key={index} variant="secondary">
                        {spec}
                      </Badge>
                    )) || (
                      <span className="text-muted-foreground text-sm">
                        None specified
                      </span>
                    )}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <h4 className="mb-2 text-sm font-medium">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {trainer.certifications?.map((cert, index) => (
                      <Badge key={index} variant="outline">
                        <Award className="mr-1 h-3 w-3" />
                        {cert}
                      </Badge>
                    )) || (
                      <span className="text-muted-foreground text-sm">
                        None specified
                      </span>
                    )}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <h4 className="mb-2 text-sm font-medium">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {trainer.languages?.map((lang, index) => (
                      <Badge key={index} variant="outline">
                        {lang}
                      </Badge>
                    )) || (
                      <span className="text-muted-foreground text-sm">
                        None specified
                      </span>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div className="flex justify-between">
                    <span>Experience</span>
                    <span className="font-medium">
                      {trainer.years_experience} years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission Rate</span>
                    <span className="font-medium">
                      {trainer.commission_rate}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Status & Compliance */}
          <div className="space-y-6">
            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hourly Rate</span>
                  <span className="font-medium">${trainer.hourly_rate}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Max Clients</span>
                  <span className="font-medium">
                    {trainer.max_clients_per_session}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Card */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance & Certifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>CPR Expires</span>
                    <span
                      className={
                        trainer.cpr_certification_expires &&
                        new Date(trainer.cpr_certification_expires) <
                          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                          ? "font-medium text-yellow-600"
                          : ""
                      }
                    >
                      {trainer.cpr_certification_expires
                        ? formatDate(
                            new Date(trainer.cpr_certification_expires)
                          )
                        : "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Background Check</span>
                    <span>
                      {trainer.background_check_date
                        ? formatDate(new Date(trainer.background_check_date))
                        : "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insurance Policy</span>
                    <span className="font-mono text-xs">
                      {trainer.insurance_policy_number || "Not provided"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Joined</span>
                  <span className="text-muted-foreground">
                    {formatDate(new Date(trainer.created_at))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Last Updated</span>
                  <span className="text-muted-foreground">
                    {formatDate(new Date(trainer.updated_at))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteTrainerDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        trainerName={`${trainer.user_profile?.first_name || "Unknown"} ${trainer.user_profile?.last_name || "Trainer"}`}
        isDeleting={deleteTrainerMutation.isPending}
      />

      {/* Edit Trainer Dialog */}
      <EditTrainerDialog
        trainer={trainer}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={handleEditSuccess}
      />
    </MainLayout>
  );
}

export default TrainerDetailPage;
