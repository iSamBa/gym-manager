"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TrainingSessionsView from "@/features/training-sessions/components/TrainingSessionsView";
import { useRequireStaff } from "@/hooks/use-require-auth";
import { useRouter } from "next/navigation";

export default function TrainingSessionsPage() {
  const router = useRouter();

  // Require staff role (admin + trainer) for entire page
  const { isLoading: isAuthLoading } = useRequireStaff("/login");

  if (isAuthLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Training Sessions
            </h1>
            <p className="text-muted-foreground">
              Schedule and manage training sessions for your gym members
            </p>
          </div>
          <Button
            onClick={() => router.push("/training-sessions/new")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        </div>

        {/* Main Content */}
        <TrainingSessionsView />
      </div>
    </MainLayout>
  );
}
