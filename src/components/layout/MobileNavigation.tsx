"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  X,
  Home,
  Users,
  UserCheck,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Bell,
  ChevronRight,
  Dumbbell,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
}

interface MobileNavigationProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  notifications?: number;
}

const navigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    description: "Overview and key metrics",
  },
  {
    name: "Members",
    href: "/members",
    icon: Users,
    badge: 42,
    description: "Manage gym members",
  },
  {
    name: "Trainers",
    href: "/trainers",
    icon: UserCheck,
    badge: 12,
    description: "Trainer management",
  },
  {
    name: "Memberships",
    href: "/memberships",
    icon: CreditCard,
    description: "Membership plans",
  },
  {
    name: "Payments",
    href: "/payments",
    icon: Receipt,
    description: "Payment history",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Reports and insights",
  },
];

export function MobileNavigation({
  user,
  notifications = 0,
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();
  const { signOut } = useAuth();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstNavItemRef = useRef<HTMLAnchorElement>(null);

  // Check for dark mode preference
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    setIsDarkMode(darkModeMediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener("change", handleChange);

    return () => darkModeMediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen) {
      // Focus first navigation item when opening
      setTimeout(() => {
        firstNavItemRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleNavItemClick = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Here you would typically update your theme context
    document.documentElement.classList.toggle("dark");
  };

  const MobileHeader = () => (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Mobile Menu Trigger */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              aria-label={`Open navigation menu${notifications > 0 ? ` (${notifications} notifications)` : ""}`}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          {/* Brand */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">Gym Manager</span>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              aria-label={`Notifications${notifications > 0 ? ` (${notifications})` : ""}`}
            >
              <Bell className="h-4 w-4" />
              {notifications > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                  aria-hidden="true"
                >
                  {notifications > 9 ? "9+" : notifications}
                </Badge>
              )}
            </Button>

            {/* User Avatar */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-xs">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            )}
          </div>

          {/* Mobile Navigation Sheet */}
          <SheetContent
            side="left"
            className="w-80 p-0"
            onKeyDown={handleKeyDown}
          >
            <SheetHeader className="border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <SheetTitle className="text-left">Gym Manager</SheetTitle>
                </div>
                <Button
                  ref={closeButtonRef}
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SheetDescription className="text-left">
                Navigate through your gym management dashboard
              </SheetDescription>
            </SheetHeader>

            {/* Navigation Items */}
            <nav
              className="flex-1 overflow-y-auto p-4"
              role="navigation"
              aria-label="Main navigation"
            >
              <div className="space-y-1">
                {navigationItems.map((item, index) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      ref={index === 0 ? firstNavItemRef : null}
                      href={item.href}
                      onClick={handleNavItemClick}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground focus:ring-ring focus:ring-2 focus:outline-none",
                        isActive &&
                          "bg-accent text-accent-foreground font-medium"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={cn(
                            "h-4 w-4",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}
                          aria-hidden="true"
                        />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-muted-foreground text-xs">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="h-5 px-2 text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight
                          className="text-muted-foreground h-3 w-3"
                          aria-hidden="true"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>

              <Separator className="my-4" />

              {/* Settings */}
              <Link
                href="/settings"
                onClick={handleNavItemClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground focus:ring-ring focus:ring-2 focus:outline-none",
                  pathname === "/settings" &&
                    "bg-accent text-accent-foreground font-medium"
                )}
                aria-current={pathname === "/settings" ? "page" : undefined}
              >
                <Settings
                  className="text-muted-foreground h-4 w-4"
                  aria-hidden="true"
                />
                <span>Settings</span>
              </Link>
            </nav>

            {/* User Section */}
            {user && (
              <div className="border-t p-4">
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="text-muted-foreground truncate text-sm">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isDarkMode ? (
                        <Moon
                          className="text-muted-foreground h-4 w-4"
                          aria-hidden="true"
                        />
                      ) : (
                        <Sun
                          className="text-muted-foreground h-4 w-4"
                          aria-hidden="true"
                        />
                      )}
                      <span className="text-sm font-medium">Dark Mode</span>
                    </div>
                    <Switch
                      checked={isDarkMode}
                      onCheckedChange={toggleDarkMode}
                      aria-label="Toggle dark mode"
                    />
                  </div>

                  {/* Sign Out */}
                  <Button
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full justify-start gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );

  return <MobileHeader />;
}

// Desktop Navigation remains the same but enhanced
export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <aside className="bg-background hidden h-screen w-64 flex-col border-r md:flex">
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
            <Dumbbell className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold">Gym Manager</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground focus:ring-ring focus:ring-2 focus:outline-none",
                  isActive && "bg-accent text-accent-foreground font-medium"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <Badge variant="secondary" className="h-5 px-2 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
