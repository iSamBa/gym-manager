"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Calendar, Clock, Plus } from "lucide-react";

const SessionBreadcrumbs: React.FC = () => {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    const crumbs = [
      {
        label: "Training Sessions",
        href: "/training-sessions",
        icon: Calendar,
      },
    ];

    if (pathname === "/training-sessions/new") {
      crumbs.push({
        label: "New Session",
        href: "/training-sessions/new",
        icon: Plus,
      });
    } else if (pathname === "/training-sessions/history") {
      crumbs.push({
        label: "History",
        href: "/training-sessions/history",
        icon: Clock,
      });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="text-muted-foreground flex items-center space-x-1 text-sm">
      {breadcrumbs.map((crumb, index) => {
        const Icon = crumb.icon;
        const isLast = index === breadcrumbs.length - 1;

        return (
          <React.Fragment key={crumb.href}>
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            <div className="flex items-center gap-1">
              <Icon className="h-4 w-4" />
              {isLast ? (
                <span className="text-foreground font-medium">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default SessionBreadcrumbs;
