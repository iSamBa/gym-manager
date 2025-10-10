import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { startOfDay, endOfDay } from "date-fns";
import { useMachines } from "../hooks/use-machines";
import { useTrainingSessions } from "../hooks/use-training-sessions";
import { generateTimeSlots } from "../lib/slot-generator";
import { MachineColumn } from "./MachineColumn";
import type { TimeSlot, TrainingSession } from "../lib/types";

interface MachineSlotGridProps {
  selectedDate: Date;
  onSlotClick: (machine_id: string, timeSlot: TimeSlot) => void;
  onSessionClick: (session: TrainingSession) => void;
}

/**
 * MachineSlotGrid - Main grid component displaying 3 machine columns with time slots
 * Features:
 * - 3-column responsive layout
 * - Time axis labels on left
 * - Performance optimized with useMemo
 * - Displays all machines (available and unavailable)
 */
export const MachineSlotGrid: React.FC<MachineSlotGridProps> = ({
  selectedDate,
  onSlotClick,
  onSessionClick,
}) => {
  // Fetch machines and sessions for the selected date
  const { data: machines, isLoading: machinesLoading } = useMachines();
  const { data: sessions, isLoading: sessionsLoading } = useTrainingSessions({
    date_range: {
      start: startOfDay(selectedDate),
      end: endOfDay(selectedDate),
    },
  });

  // Memoize time slots generation (30 slots from 6 AM to 9 PM)
  const timeSlots = useMemo(
    () => generateTimeSlots(selectedDate),
    [selectedDate]
  );

  const isLoading = machinesLoading || sessionsLoading;

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground mt-2 text-sm">
              Loading machine grid...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // No machines found
  if (!machines || machines.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              No machines configured. Please contact your administrator.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Time axis labels */}
      <div className="flex flex-col gap-1 pt-12">
        {timeSlots.map((slot, index) => (
          <div
            key={index}
            className="text-muted-foreground flex h-16 items-center text-xs"
            style={{ minWidth: "70px" }}
          >
            {slot.label.split(" - ")[0]}
          </div>
        ))}
      </div>

      {/* Machine columns - 3-column grid */}
      <div className="grid flex-1 grid-cols-3 gap-4">
        {machines.map((machine) => (
          <MachineColumn
            key={machine.id}
            machine={machine}
            timeSlots={timeSlots}
            sessions={
              sessions?.filter((s) => s.machine_id === machine.id) || []
            }
            onSlotClick={onSlotClick}
            onSessionClick={onSessionClick}
          />
        ))}
      </div>
    </div>
  );
};
