"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { MemberSessionsTable } from "./MemberSessionsTable";

interface MemberSessionsProps {
  memberId: string;
  memberName?: string;
  className?: string;
}

export function MemberSessions({
  memberId,
  memberName,
  className,
}: MemberSessionsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Training Sessions</h2>
          {memberName && (
            <p className="text-muted-foreground text-sm">
              Training sessions for {memberName}
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
      <MemberSessionsTable
        memberId={memberId}
        showFilters={true}
        pageSize={15}
      />
    </div>
  );
}
