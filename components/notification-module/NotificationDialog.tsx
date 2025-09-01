// @/components/layout/NotificationPopover.tsx

"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

// --- Example Data ---
// In a real app, you would fetch this data from an API.
const notifications = [
    {
        title: "New feature released!",
        description: "You can now customize your dashboard.",
        avatar: "/avatars/01.png",
        fallback: "🚀",
    },
    {
        title: "Your subscription is renewing",
        description: "Your pro plan will renew on Aug 28, 2025.",
        avatar: "/avatars/02.png",
        fallback: "💰",
    },
];
// const notifications: any[] = []; // Uncomment to see the empty state

export function NotificationPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <Bell className="size-[18px]" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4">
          <h4 className="text-sm font-medium leading-none">Notifications</h4>
        </div>
        <Separator />
        <div className="p-2">
            {notifications.length > 0 ? (
                // Map through notifications if they exist
                notifications.map((notification, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 rounded-md hover:bg-accent">
                         <Avatar className="h-8 w-8">
                            <AvatarImage className='object-cover' src={notification.avatar} />
                            <AvatarFallback>{notification.fallback}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5 text-sm">
                            <p className="font-semibold">{notification.title}</p>
                            <p className="text-muted-foreground">{notification.description}</p>
                        </div>
                    </div>
                ))
            ) : (
                // Display an empty state message
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <CheckCheck className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">You're all caught up!</p>
                </div>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
}