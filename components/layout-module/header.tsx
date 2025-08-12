"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sun,
  Moon,
  LayoutGrid,
  User,
  HelpCircle,
  Wind,
  LogOut,
  Settings,
} from "lucide-react";

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
import { signOut } from "next-auth/react";
import { Separator } from "../ui/separator";
import { useTheme } from "next-themes";
import { useState } from "react";
// const navLinks = [
//   { href: "/home", label: "Home", icon: Home },
//   { href: "/inventory", label: "Inventory", icon: Warehouse },
//   { href: "/tasks", label: "Tasks", icon: ListTodo },
//   { href: "/orders", label: "Orders", icon: ClipboardList },
//   { href: "/shops", label: "My Shops", icon: Store },
//   { href: "/account", label: "Account", icon: User },
// ];

export function Header({ session }: { session: any }) {
  const pathname = usePathname();
  const user = session.user;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  }
  return (
  <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 backdrop-blur-md dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      
      {/* Left Section: Logo and App Name */}
      <div className="flex items-center gap-4">
        {/* <Button variant="ghost" size="icon">
          <LayoutGrid className="h-5 w-5" />
        </Button> */}
        <Link href="/" className="flex items-center gap-2">
          <Wind className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-semibold text-gray-800 dark:text-white">
            {process.env.NEXT_PUBLIC_APP_NAME}
          </span>
        </Link>
      </div>

      {/* Center Section: Navigation Links (Currently Hidden) */}
      {/* Uncomment and customize as needed */}
      {/*
      <nav className="hidden md:flex items-center gap-2">
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
      </nav>
      */}

      {/* Right Section: Theme Toggle, Help, and User Dropdown */}
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

        {/* Help Button */}
        <Button variant="ghost" className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Help</span>
        </Button>

        {/* User Avatar with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-9 w-9 cursor-pointer capitalize">
              <AvatarImage
                src={user?.image}
                alt={user?.name || "@user"}
              />
              <AvatarFallback>{user?.name?.[0] ?? "U"}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <span className="font-medium truncate">
                  {user?.name || "Unknown User"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            
            <Separator />
            
            <DropdownMenuItem asChild>
              <Link href={`/account/${session?.user?.id}`} className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href={`/account/${session?.user?.id}/settings`} className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
