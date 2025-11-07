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
import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher";
import { useTheme } from "@/components/providers/theme-provider";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  // Determine user role
  const isAdmin = user?.role === "admin";
  const isStaff = isAdmin || user?.role === "trainer";

  /**
   * Memoized navigation sections based on user role
   * - Staff (trainers + admins): See Members and Training Sessions
   * - Admin only: See all sections (Overview, Business, Insights, Studio)
   */
  const navigationSections = useMemo(() => {
    const sections: Array<{
      title: string;
      items: Array<{ name: string; href: string; icon: React.ElementType }>;
    }> = [];

    // Staff-accessible section (both trainers and admins)
    if (isStaff) {
      sections.push({
        title: "People Management",
        items: [
          { name: "Members", href: "/members", icon: Users },
          {
            name: "Training Sessions",
            href: "/training-sessions",
            icon: Calendar,
          },
        ],
      });
    }

    // Admin-only sections
    if (isAdmin) {
      sections.unshift({
        title: "Overview",
        items: [{ name: "Dashboard", href: "/", icon: Home }],
      });

      sections.push(
        {
          title: "Trainers",
          items: [{ name: "Trainers", href: "/trainers", icon: UserCheck }],
        },
        {
          title: "Business Operations",
          items: [
            { name: "Plans", href: "/plans", icon: Package },
            { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
            { name: "Payments", href: "/payments", icon: DollarSign },
          ],
        },
        {
          title: "Insights",
          items: [{ name: "Analytics", href: "/analytics", icon: BarChart3 }],
        },
        {
          title: "Studio",
          items: [
            { name: "Settings", href: "/settings/studio", icon: Settings },
          ],
        }
      );
    }

    return sections;
  }, [isAdmin, isStaff]);

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

          {/* Dynamic navigation sections based on role */}
          {navigationSections.map((section, index) => (
            <div key={section.title}>
              {index > 0 && <Separator className="my-4" />}
              <div className="space-y-1">
                <h4 className="text-muted-foreground px-4 py-2 text-sm font-semibold">
                  {section.title}
                </h4>
                {renderNavItems(section.items)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom utilities - sticky */}
      <div className="bg-background flex flex-col items-center gap-2 border-t p-2">
        <ThemeSwitcher value={theme} onChange={setTheme} />
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
