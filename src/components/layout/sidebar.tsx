"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  UserCheck,
  CreditCard,
  BarChart3,
  Menu,
  Home,
  Dumbbell,
  Calendar,
  Package,
  DollarSign,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { ThemeToggleSidebar } from "@/components/ui/theme-toggle";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const overviewNav = [{ name: "Dashboard", href: "/", icon: Home }] as const;

  const peopleNav = [
    { name: "Members", href: "/members", icon: Users },
    { name: "Trainers", href: "/trainers", icon: UserCheck },
    { name: "Training Sessions", href: "/training-sessions", icon: Calendar },
  ] as const;

  const businessNav = [
    { name: "Plans", href: "/plans", icon: Package },
    { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
    { name: "Payments", href: "/payments", icon: DollarSign },
  ] as const;

  const insightsNav = [
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ] as const;

  const isActiveRoute = (href: string) => {
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  const renderNavItems = (
    items: readonly { name: string; href: string; icon: React.ElementType }[]
  ) => (
    <>
      {items.map((item) => {
        const isActive = isActiveRoute(item.href);

        return (
          <Button
            key={item.name}
            variant={isActive ? "secondary" : "ghost"}
            className={cn("w-full justify-start", isActive && "bg-secondary")}
            asChild
          >
            <Link href={item.href} onClick={onNavigate}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </Link>
          </Button>
        );
      })}
    </>
  );

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Main navigation - scrollable */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 flex items-center px-4 text-lg font-semibold tracking-tight">
            <div className="bg-primary text-primary-foreground mr-2 flex size-5 items-center justify-center rounded-md">
              <Dumbbell className="size-3" />
            </div>
            Gym Manager
          </h2>

          {/* Overview Section */}
          <div className="space-y-1">
            <h4 className="text-muted-foreground px-4 py-2 text-sm font-semibold">
              Overview
            </h4>
            {renderNavItems(overviewNav)}
          </div>

          <Separator className="my-4" />

          {/* People Management Section */}
          <div className="space-y-1">
            <h4 className="text-muted-foreground px-4 py-2 text-sm font-semibold">
              People Management
            </h4>
            {renderNavItems(peopleNav)}
          </div>

          <Separator className="my-4" />

          {/* Business Operations Section */}
          <div className="space-y-1">
            <h4 className="text-muted-foreground px-4 py-2 text-sm font-semibold">
              Business Operations
            </h4>
            {renderNavItems(businessNav)}
          </div>

          <Separator className="my-4" />

          {/* Insights Section */}
          <div className="space-y-1">
            <h4 className="text-muted-foreground px-4 py-2 text-sm font-semibold">
              Insights
            </h4>
            {renderNavItems(insightsNav)}
          </div>
        </div>
      </div>

      {/* Bottom utilities - sticky */}
      <div className="bg-background space-y-2 border-t p-2">
        <ThemeToggleSidebar />
        <Button variant="ghost" className="w-full justify-start gap-2" asChild>
          <Link href="/settings/studio" onClick={onNavigate}>
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </Button>
        <UserProfileDropdown />
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-64 flex-col p-0">
        <Sidebar onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
