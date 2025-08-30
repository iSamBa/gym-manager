"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { SearchInput } from "@/components/forms/search-input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AdvancedTrainerTable,
  AddTrainerDialog,
  EditTrainerDialog,
  SimpleTrainerFilters,
} from "@/features/trainers/components";
import type { TrainerWithProfile } from "@/features/database/lib/types";
import {
  useTrainers,
  useTrainerCount,
  useTrainerCountByStatus,
  useSimpleTrainerFilters,
  useExportTrainers,
  useTrainersWithExpiringCerts,
} from "@/features/trainers/hooks";
import { useRequireAdmin } from "@/hooks/use-require-auth";
import { mapUserForLayout } from "@/lib/auth-utils";
import { UserCheck, Users, Award, Calendar, Download } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TrainersPage() {
  const [editingTrainer, setEditingTrainer] =
    useState<TrainerWithProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Require admin role for entire page
  const {
    user,
    isLoading: isAuthLoading,
    hasRequiredRole,
  } = useRequireAdmin("/login");

  // Simplified filter state management
  const { filters, updateFilters, databaseFilters } = useSimpleTrainerFilters();

  // Export functionality
  const { isExporting, exportTrainers } = useExportTrainers();

  // Main trainer data with auto-refresh
  const {
    data: trainers,
    isLoading: isTrainersLoading,
    error,
  } = useTrainers({
    search: searchQuery,
    ...databaseFilters,
  });

  // Trainer counts for stats
  const { data: totalTrainerCount } = useTrainerCount();
  const { data: trainerCountByStatus } = useTrainerCountByStatus();
  const { data: expiringCertsCount } = useTrainersWithExpiringCerts(30); // 30 days

  if (isAuthLoading) {
    return (
      <MainLayout user={mapUserForLayout(user)}>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      </MainLayout>
    );
  }

  if (!hasRequiredRole) {
    return null; // Will redirect to login
  }

  // Calculate stats from count data
  const totalTrainers = totalTrainerCount || 0;
  const activeTrainers = trainerCountByStatus?.active || 0;
  const expiringCertifications = expiringCertsCount?.length || 0;

  // Calculate available trainers from the actual trainers data
  const availableTrainers =
    trainers?.filter((trainer) => trainer.is_accepting_new_clients).length || 0;

  // Handler functions for trainer actions
  const handleViewTrainer = (trainer: TrainerWithProfile) => {
    router.push(`/trainers/${trainer.id}`);
  };

  const handleEditTrainer = (trainer: TrainerWithProfile) => {
    setEditingTrainer(trainer);
    setIsEditDialogOpen(true);
  };

  const handleTrainerClick = (trainer: TrainerWithProfile) => {
    // Validate trainer ID before navigation
    if (
      !trainer?.id ||
      typeof trainer.id !== "string" ||
      trainer.id.trim() === ""
    ) {
      console.error("Invalid trainer ID for navigation:", trainer);
      return;
    }

    try {
      router.push(`/trainers/${trainer.id.trim()}`);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleTrainerHover = () => {
    // Future: Add prefetch functionality
  };

  const handleEditSuccess = () => {
    // Cache invalidation is handled automatically by EditTrainerDialog
  };

  const handleExport = async () => {
    await exportTrainers(trainers || []);
  };

  // Convert user object to expected format for MainLayout
  const layoutUser = mapUserForLayout(user);

  return (
    <MainLayout user={layoutUser}>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trainers</h1>
            <p className="text-muted-foreground">
              Manage your gym trainers and their specializations
            </p>
          </div>
          <AddTrainerDialog />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-2xl font-bold">{totalTrainers}</p>
                <p className="text-muted-foreground text-xs">Total Trainers</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{activeTrainers}</p>
                <p className="text-muted-foreground text-xs">Active</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{availableTrainers}</p>
                <p className="text-muted-foreground text-xs">
                  Accepting New Clients
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{expiringCertifications}</p>
                <p className="text-muted-foreground text-xs">
                  Expiring Certifications
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row">
            {/* Search Input */}
            <div className="max-w-md flex-1">
              <SearchInput
                placeholder="Search trainers by name..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>

            {/* Filter Controls */}
            <div className="shrink-0">
              <SimpleTrainerFilters
                filters={filters}
                onFiltersChange={updateFilters}
              />
            </div>
          </div>

          {/* Export Button */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting || isTrainersLoading}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>

        {/* Trainers Table */}
        <Card>
          <AdvancedTrainerTable
            trainers={trainers}
            isLoading={isTrainersLoading}
            error={error}
            onEdit={handleEditTrainer}
            onView={handleViewTrainer}
            onTrainerClick={handleTrainerClick}
            onTrainerHover={handleTrainerHover}
            showActions={true}
            enableInfiniteScroll={false}
          />
        </Card>

        {/* Edit Trainer Dialog */}
        <EditTrainerDialog
          trainer={editingTrainer}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      </div>
    </MainLayout>
  );
}
