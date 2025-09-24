"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, History, BarChart3, Users, Clock } from "lucide-react";
import TrainingSessionCalendar from "./TrainingSessionCalendar";
import SessionHistoryTable from "./SessionHistoryTable";
import { EditSessionDialog } from "./forms/EditSessionDialog";
import { useTrainingSessions } from "../hooks/use-training-sessions";
import type { TrainingSession, SessionHistoryEntry } from "../lib/types";

const TrainingSessionsView: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("sessions");
  const [selectedSession, setSelectedSession] =
    useState<TrainingSession | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Transform TrainingSession to SessionHistoryEntry
  const transformToHistoryEntry = (
    session: TrainingSession
  ): SessionHistoryEntry => {
    const start = new Date(session.scheduled_start);
    const end = new Date(session.scheduled_end);
    const durationMinutes = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60)
    );

    return {
      session_id: session.id,
      scheduled_start: session.scheduled_start,
      scheduled_end: session.scheduled_end,
      status: session.status,
      location: session.location,
      trainer_name: session.trainer_name || "Unknown Trainer",
      participant_count: session.current_participants,
      max_participants: session.max_participants,
      attendance_rate:
        session.current_participants > 0
          ? Math.round(
              (session.current_participants / session.max_participants) * 100
            )
          : 0,
      duration_minutes: durationMinutes,
      session_category: session.session_type || "standard",
      notes: session.notes || undefined,
    };
  };

  // Get current date range based on active tab
  const dateRange = React.useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  }, []);

  // Fetch sessions data
  const {
    data: sessions = [],
    isLoading,
    error,
  } = useTrainingSessions({
    date_range: dateRange,
  });

  const handleSessionClick = (session: TrainingSession) => {
    setSelectedSession(session);
    setShowEditDialog(true);
  };

  const handleHistorySessionClick = (sessionEntry: SessionHistoryEntry) => {
    // For history entries, we need to create a minimal session object
    // since we only need the ID for the EditSessionDialog
    const session = { id: sessionEntry.session_id } as TrainingSession;
    setSelectedSession(session);
    setShowEditDialog(true);
  };

  const handleSlotSelect = (slotInfo: { start: Date; end: Date }) => {
    // Navigate to new session page with pre-filled times
    const searchParams = new URLSearchParams({
      start: slotInfo.start.toISOString(),
      end: slotInfo.end.toISOString(),
    });
    router.push(`/training-sessions/new?${searchParams.toString()}`);
  };

  const handleCloseDialogs = () => {
    setShowEditDialog(false);
    setSelectedSession(null);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-2 text-sm">
              Failed to load training sessions
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="flex flex-1 flex-col">
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-1 flex-col"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sessions" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Sessions
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="sessions"
              className="mt-6 flex min-h-0 flex-1 flex-col"
            >
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-center">
                    <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Loading sessions...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <TrainingSessionCalendar
                    onSelectSession={handleSessionClick}
                    onSelectSlot={handleSlotSelect}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <SessionHistoryTable
                sessions={sessions.map(transformToHistoryEntry)}
                showSelectionColumn={true}
                onSessionClick={handleHistorySessionClick}
                onExport={(sessions, format) => {
                  // Handle export
                  console.log(
                    "Export:",
                    sessions.length,
                    "sessions as",
                    format
                  );
                }}
                onBulkAction={(sessions, action) => {
                  // Handle bulk actions
                  console.log(
                    "Bulk action:",
                    action,
                    "on",
                    sessions.length,
                    "sessions"
                  );
                }}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    <h3 className="font-medium">Total Sessions</h3>
                  </div>
                  <p className="mt-2 text-2xl font-bold">{sessions.length}</p>
                  <p className="text-muted-foreground mt-1 text-xs">All time</p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Users className="text-muted-foreground h-4 w-4" />
                    <h3 className="font-medium">Active Sessions</h3>
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {
                      sessions.filter(
                        (s) =>
                          s.status === "scheduled" || s.status === "in_progress"
                      ).length
                    }
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Currently active
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="text-muted-foreground h-4 w-4" />
                    <h3 className="font-medium">Completed</h3>
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {sessions.filter((s) => s.status === "completed").length}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Sessions completed
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="text-muted-foreground h-4 w-4" />
                    <h3 className="font-medium">Average Utilization</h3>
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {sessions.length > 0
                      ? Math.round(
                          (sessions.reduce(
                            (acc, s) =>
                              acc +
                              (s.current_participants || 0) /
                                s.max_participants,
                            0
                          ) /
                            sessions.length) *
                            100
                        )
                      : 0}
                    %
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Capacity utilization
                  </p>
                </div>
              </div>

              {sessions.length === 0 && (
                <div className="mt-4 flex h-64 items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
                    <p className="text-muted-foreground mb-2 text-lg font-medium">
                      No Session Data
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Create some training sessions to see analytics here.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditSessionDialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) handleCloseDialogs();
        }}
        sessionId={selectedSession?.id}
      />
    </>
  );
};

export default TrainingSessionsView;
