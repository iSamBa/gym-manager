import React, { memo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TimeSlot } from "./TimeSlot";
import { MachineAvailabilityToggle } from "./MachineAvailabilityToggle";
import type {
  Machine,
  TimeSlot as TimeSlotType,
  TrainingSession,
} from "../lib/types";

interface MachineColumnProps {
  machine: Machine;
  timeSlots: TimeSlotType[];
  sessions: TrainingSession[];
  onSlotClick: (machine_id: string, timeSlot: TimeSlotType) => void;
  onSessionClick: (session: TrainingSession) => void;
}

/**
 * MachineColumn - renders a single machine column with all time slots
 * Memoized for performance optimization
 */
export const MachineColumn = memo<MachineColumnProps>(
  ({ machine, timeSlots, sessions, onSlotClick, onSessionClick }) => {
    /**
     * Find if a session exists for a given time slot
     * Matches based on scheduled_start time
     */
    const getSessionForSlot = (
      slot: TimeSlotType
    ): TrainingSession | undefined => {
      return sessions.find(
        (s) => new Date(s.scheduled_start).getTime() === slot.start.getTime()
      );
    };

    return (
      <Card
        className={cn(
          "flex min-w-[250px] flex-col sm:min-w-[200px]",
          !machine.is_available && "opacity-60"
        )}
      >
        <CardHeader className="py-2 sm:py-3">
          <CardTitle className="flex items-center justify-between text-sm font-semibold sm:text-base">
            <span className="uppercase">{machine.name}</span>
            <div className="flex items-center gap-2">
              {!machine.is_available && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  Unavailable
                </Badge>
              )}
              <MachineAvailabilityToggle machine={machine} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-1 pt-0 sm:gap-2">
          {timeSlots.map((slot, index) => {
            const session = getSessionForSlot(slot);
            return (
              <TimeSlot
                key={`${machine.id}-${index}`}
                machine={machine}
                timeSlot={slot}
                session={session}
                onClick={() => {
                  if (session) {
                    onSessionClick(session);
                  } else if (machine.is_available) {
                    onSlotClick(machine.id, slot);
                  }
                }}
              />
            );
          })}
        </CardContent>
      </Card>
    );
  }
);

MachineColumn.displayName = "MachineColumn";
