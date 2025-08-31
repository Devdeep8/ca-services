// @/components/layout/Header.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  Sun,
  Moon,
  HelpCircle,
  Wind,
  User,
  Settings,
  LogOut,
  Rocket,
} from "lucide-react";
import { signOut } from "next-auth/react";
// Import UI components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { type LucideIcon } from "lucide-react";
// Import new components and configuration
import { FeedbackDialog } from "./FeedbackDialog";
import { NotificationPopover } from "@/components/notification-module/NotificationDialog";
import { WorldClockTooltip } from "../extra/world-clock";
type UserMenuItem =
  | {
      type: "link";
      label: string;
      icon: LucideIcon;
      // Use a function to dynamically generate the href with the user's ID
      href: (userId: string) => string;
    }
  | {
      type: "button";
      label: string;
      icon: LucideIcon;
      onClick: () => void;
      isDestructive?: boolean;
    }
  | {
      type: "separator";
    };
const userMenuItems: UserMenuItem[] = [
  {
    type: "link",
    label: "Profile",
    icon: User,
    href: (userId) => `/account/${userId}`,
  },
  {
    type: "link",
    label: "Settings",
    icon: Settings,
    href: (userId) => `/account/${userId}/settings`,
  },
  {
    type: "separator",
  },
  {
    type: "button",
    label: "Logout",
    icon: LogOut,
    onClick: () => signOut(),
    isDestructive: true,
  },
];
export function Header({ session }: { session: any }) {
  const pathname = usePathname();
  const user = session?.user;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // A common pattern to avoid hydration errors with useTheme
  useState(() => {
    setMounted(true);
  });

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  if (!user) return null; // Or render a login button

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-[4.54rem] px-4 md:px-6 backdrop-blur-md dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Left Section: Logo and App Name */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Rocket className="h-6 w-6 rotate-[-45deg] text-primary" />
          <span className="text-lg font-semibold text-gray-800 dark:text-white">
            {process.env.NEXT_PUBLIC_APP_NAME}
          </span>
        </Link>
      </div>

      {/* Center Section: Navigation Links (Now active) */}
      {/* <nav className="hidden md:flex items-center gap-2">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Tooltip key={link.href}>
              <TooltipTrigger asChild>
                <Link href={link.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="flex items-center gap-2"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                {link.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav> */}

      {/* Right Section: Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full"
        >
          {mounted && theme === "dark" ? (
            <Sun className="size-[18px]" />
          ) : (
            <Moon className="size-[18px]" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
        <WorldClockTooltip /> {/* <-- 2. Add the component here */}
        {/* Notification Dialog Button */}
        <NotificationPopover />
        {/* Help Button */}
        <FeedbackDialog>
          <Button variant="ghost" className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            <span className="hidden sm:inline">Help</span>
          </Button>
        </FeedbackDialog>
        {/* User Avatar with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-9 w-9 cursor-pointer capitalize">
              <AvatarImage
                src={user?.avatar || ""}
                alt={user?.name || "@user"}
              />
              <AvatarFallback>{user?.name?.[0] ?? "U"}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <span className="font-medium truncate">{user?.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <Separator />

            {/* Logic to render dropdown items from config */}
            {userMenuItems.map((item: any, index: any) => {
              if (item.type === "separator") {
                return <DropdownMenuSeparator key={`separator-${index}`} />;
              }
              if (item.type === "button") {
                return (
                  <DropdownMenuItem
                    key={item.label}
                    onClick={item.onClick}
                    className={
                      item.isDestructive
                        ? "text-destructive focus:text-destructive cursor-pointer"
                        : "cursor-pointer"
                    }
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                );
              }
              if (item.type === "link") {
                return (
                  <DropdownMenuItem key={item.label} asChild>
                    <Link
                      href={item.href(user.id)}
                      className="flex items-center cursor-pointer"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              }
              return null;
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
