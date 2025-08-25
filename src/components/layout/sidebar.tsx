"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  Menu,
  Home,
  Dumbbell,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const t = useTranslations("navigation");

  const navigation = [
    { name: t("dashboard"), href: "/", icon: Home },
    { name: t("members"), href: "/members", icon: Users },
    { name: t("memberships"), href: "/memberships", icon: CreditCard },
    { name: t("payments"), href: "/payments", icon: Receipt },
    { name: t("analytics"), href: "/analytics", icon: BarChart3 },
  ];

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 flex items-center px-4 text-lg font-semibold tracking-tight">
            <div className="bg-primary text-primary-foreground mr-2 flex size-5 items-center justify-center rounded-md">
              <Dumbbell className="size-3" />
            </div>
            Gym Manager
          </h2>
          <div className="space-y-1">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href} onClick={onNavigate}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
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
      <SheetContent side="left" className="w-64 p-0">
        <Sidebar onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
