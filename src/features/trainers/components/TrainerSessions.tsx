"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { TrainerSessionsTable } from "./TrainerSessionsTable";

interface TrainerSessionsProps {
  trainerId: string;
  trainerName?: string;
  className?: string;
}

export function TrainerSessions({
  trainerId,
  trainerName,
  className,
}: TrainerSessionsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Training Sessions</h2>
          {trainerName && (
            <p className="text-muted-foreground text-sm">
              Session schedule and management for {trainerName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Sessions Table */}
      <TrainerSessionsTable
        trainerId={trainerId}
        showFilters={true}
        pageSize={15}
      />
    </div>
  );
}
