"use client";

import { memo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, CreditCard, Bell, LogOut } from "lucide-react";

export const UserProfileDropdown = memo(function UserProfileDropdown() {
  const { user, signOut, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await signOut();
    router.push("/login");
  }, [signOut, router]);

  if (!user) return null;

  // Generate initials from user name or email
  const getInitials = () => {
    const firstName = user.first_name as string | undefined;
    const lastName = user.last_name as string | undefined;
    const email = user.email as string | undefined;

    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || "U";
  };

  const firstName = user.first_name as string | undefined;
  const lastName = user.last_name as string | undefined;
  const email = user.email as string | undefined;
  const avatarUrl = user.avatar_url as string | undefined;

  const displayName =
    firstName && lastName ? `${firstName} ${lastName}` : email || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start gap-2 px-2 py-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start overflow-hidden text-left">
            <p className="w-full truncate text-sm font-medium">{displayName}</p>
            <p className="text-muted-foreground w-full truncate text-xs">
              {email}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCard className="mr-2 h-4 w-4" />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
          <LogOut className="mr-2 h-4 w-4" />
          {isLoading ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
