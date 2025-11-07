import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { startOfDay, endOfDay, format } from "date-fns";
import { useMachines } from "../hooks/use-machines";
import { useTrainingSessions } from "../hooks/use-training-sessions";
import { generateTimeSlots } from "../lib/slot-generator";
import { MachineColumn } from "./MachineColumn";
import type { TimeSlot, TrainingSession } from "../lib/types";

import { logger } from "@/lib/logger";
interface MachineSlotGridProps {
  selectedDate: Date;
  onSlotClick: (machine_id: string, timeSlot: TimeSlot) => void;
  onSessionClick: (session: TrainingSession) => void;
}

/**
 * MachineSlotGrid - Main grid component displaying machine columns with time slots
 * Features:
 * - Responsive layout: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
 * - Time axis labels on left
 * - Dynamic slot generation based on opening hours
 * - Handles closed days
 * - Performance optimized
 */
export const MachineSlotGrid: React.FC<MachineSlotGridProps> = ({
  selectedDate,
  onSlotClick,
  onSessionClick,
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  // Fetch machines and sessions for the selected date
  const { data: machines, isLoading: machinesLoading } = useMachines();
  const { data: sessions, isLoading: sessionsLoading } = useTrainingSessions({
    date_range: {
      start: startOfDay(selectedDate),
      end: endOfDay(selectedDate),
    },
  });

  // Generate time slots asynchronously
  useEffect(() => {
    let mounted = true;

    async function loadSlots() {
      setIsLoadingSlots(true);
      try {
        const slots = await generateTimeSlots(selectedDate);
        if (mounted) {
          setTimeSlots(slots);
        }
      } catch (error) {
        logger.error("Failed to generate time slots:", { error });
        if (mounted) {
          setTimeSlots([]);
        }
      } finally {
        if (mounted) {
          setIsLoadingSlots(false);
        }
      }
    }

    loadSlots();

    return () => {
      mounted = false;
    };
  }, [selectedDate]);

  const isLoading = machinesLoading || sessionsLoading || isLoadingSlots;

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

  // Studio closed on this day
  if (timeSlots.length === 0) {
    return (
      <Card className="p-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Studio is closed on {format(selectedDate, "EEEE, MMMM d, yyyy")}. No
            training sessions available.
          </AlertDescription>
        </Alert>
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
    <div className="flex gap-2 sm:gap-4">
      {/* Machine columns - Responsive grid: 1 column mobile, 2 tablet, 3 desktop */}
      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
