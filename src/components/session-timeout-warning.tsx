"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Clock } from "lucide-react";
import { SESSION_CONFIG } from "@/lib/session-config";

interface SessionTimeoutWarningProps {
  isOpen: boolean;
  timeLeft: number;
  onExtendSession: () => void;
  onLogoutNow: () => void;
}

export function SessionTimeoutWarning({
  isOpen,
  timeLeft: initialTimeLeft,
  onExtendSession,
  onLogoutNow,
}: SessionTimeoutWarningProps) {
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);

  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(initialTimeLeft);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(interval);
          onLogoutNow();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, initialTimeLeft, onLogoutNow]);

  const minutes = Math.floor(timeLeft / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  const totalWarningTime = SESSION_CONFIG.WARNING_BEFORE_LOGOUT;
  const progressValue =
    ((totalWarningTime - timeLeft) / totalWarningTime) * 100;

  const formatTime = (mins: number, secs: number) => {
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Session Timeout Warning</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Your session will expire due to inactivity. You will be
            automatically logged out to protect your account security.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center gap-2 font-mono text-2xl">
            <Clock className="text-muted-foreground h-6 w-6" />
            <span className="text-destructive font-bold">
              {formatTime(minutes, seconds)}
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-muted-foreground flex justify-between text-sm">
              <span>Time remaining</span>
              <span>{Math.round(timeLeft / 1000)}s</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          <div className="text-muted-foreground text-center text-sm">
            Move your mouse or press any key to stay logged in
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onLogoutNow}
            className="w-full sm:w-auto"
          >
            Logout Now
          </Button>
          <Button
            onClick={onExtendSession}
            className="w-full sm:w-auto"
            disabled={timeLeft <= 0}
          >
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
