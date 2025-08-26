"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { SearchInput } from "@/components/forms/search-input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UserCheck,
  Users,
  Award,
  Calendar,
  Download,
  Clock,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function TrainersPage() {
  const router = useRouter();

  // Placeholder state - will be replaced with real hooks in Phase 2
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading] = useState(false);
  const [isExporting] = useState(false);

  // Placeholder data - will be replaced with real data from hooks
  const totalTrainers = 12;
  const activeTrainers = 10;
  const availableTrainers = 8;
  const expiringCertifications = 2;

  const handleAddTrainer = () => {
    // TODO: Implement add trainer functionality in Phase 3
    console.log("Add trainer clicked");
  };

  const handleExport = () => {
    // TODO: Implement export functionality in Phase 2
    console.log("Export clicked");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trainers</h1>
            <p className="text-muted-foreground">
              Manage your gym trainers and their specializations
            </p>
          </div>
          <Button onClick={handleAddTrainer} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Trainer
          </Button>
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
                  Available for New Clients
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

            {/* Placeholder for filters - will be implemented in Phase 3 */}
            <div className="shrink-0">
              <Badge variant="outline" className="text-sm">
                Filters: Coming in Phase 3
              </Badge>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting || isLoading}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>

        {/* Trainers Table Placeholder */}
        <Card>
          <div className="p-8 text-center">
            <UserCheck className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">Trainers Table</h3>
            <p className="text-muted-foreground mb-4">
              The trainers table will be implemented in Phase 3 with full
              functionality including:
            </p>
            <div className="text-muted-foreground space-y-1 text-sm">
              <p>• Advanced table with sorting and pagination</p>
              <p>• Trainer details (name, specializations, status, rates)</p>
              <p>• Actions (view, edit, manage sessions)</p>
              <p>• Real-time data from database</p>
            </div>
          </div>
        </Card>

        {/* Placeholder for Edit Trainer Dialog */}
        {/* TODO: Implement EditTrainerDialog in Phase 3 */}
      </div>
    </MainLayout>
  );
}
