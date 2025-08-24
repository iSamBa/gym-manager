"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, CheckCircle } from "lucide-react";
import { SESSION_CONFIG } from "@/lib/session-config";

interface SessionStatusProps {
  className?: string;
}

export function SessionStatus({ className }: SessionStatusProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRememberMe, setIsRememberMe] = useState(false);

  useEffect(() => {
    const rememberMe = localStorage.getItem("remember-me") === "true";
    setIsRememberMe(rememberMe);

    const updateTimeLeft = () => {
      const lastActivity = localStorage.getItem("last-activity");
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
        const timeout = rememberMe
          ? SESSION_CONFIG.REMEMBER_ME_DURATION
          : SESSION_CONFIG.INACTIVITY_TIMEOUT;
        const remaining = Math.max(0, timeout - timeSinceLastActivity);
        setTimeLeft(remaining);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getStatusVariant = () => {
    if (isRememberMe) return "secondary";

    const warningTime = SESSION_CONFIG.WARNING_BEFORE_LOGOUT;
    if (timeLeft <= warningTime) return "destructive";
    if (timeLeft <= warningTime * 2) return "outline";
    return "secondary";
  };

  const getStatusText = () => {
    if (isRememberMe) return "Extended Session";

    const minutes = Math.floor(timeLeft / (1000 * 60));
    if (minutes < 1) return "Expires Soon";
    if (minutes < 60) return `${minutes}m left`;

    const hours = Math.floor(minutes / 60);
    return `${hours}h left`;
  };

  const getStatusIcon = () => {
    if (isRememberMe) return <Shield className="h-3 w-3" />;

    const warningTime = SESSION_CONFIG.WARNING_BEFORE_LOGOUT;
    if (timeLeft <= warningTime) return <Clock className="h-3 w-3" />;
    return <CheckCircle className="h-3 w-3" />;
  };

  return (
    <Badge variant={getStatusVariant()} className={className}>
      {getStatusIcon()}
      <span className="ml-1 text-xs">{getStatusText()}</span>
    </Badge>
  );
}
