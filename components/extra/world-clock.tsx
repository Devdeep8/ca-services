"use client";   
// @/components/layout/world-clock-config.ts

 interface TimeZone {
  label: string;      // e.g., "New York"
  timeZone: string;   // The official IANA time zone name
}

 const timeZones: TimeZone[] = [

     {
      label: "Harrow (UK)",
      timeZone: "Europe/London",
    },
    {
        label : "Indore" ,
        timeZone : "Asia/Kolkata",
    },

  {
    label: "New York",
    timeZone: "America/New_York", // EST/EDT
  },
  {
    label: "Tokyo",
    timeZone: "Asia/Tokyo", // JST
  },
   {
    label: "Saudi Arabia",
    timeZone: "Asia/Riyadh",
  },

];

// @/components/layout/WorldClockTooltip.tsx


import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "../ui/button";
import { Globe } from "lucide-react";
import { Separator } from "../ui/separator";
// Make sure you import your config file

// 🎯 THE FIX IS IN THIS HELPER COMPONENT
function ClockDisplay({ timeZone, label, currentTime }: { timeZone: string, label: string, currentTime: Date }) {
    // For reliable date-only comparison, we format both dates to a 'YYYY-MM-DD' string
    const todayStr = new Date().toLocaleDateString('en-CA'); // 'en-CA' gives 'YYYY-MM-DD' format
    const targetDateStr = currentTime.toLocaleDateString('en-CA', { timeZone });

    let dayRelation = "Today";
    if (targetDateStr < todayStr) {
        dayRelation = "Yesterday";
    } else if (targetDateStr > todayStr) {
        dayRelation = "Tomorrow";
    }

    const localDay = currentTime.toLocaleDateString('en-US', { weekday: 'short', timeZone });

    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{dayRelation}, {localDay}</p>
            </div>
            <p className="text-lg font-mono tracking-tighter">
                {/* We format the original currentTime directly, which is safe and reliable */}
                {currentTime.toLocaleTimeString("en-US", {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: timeZone // Pass the timezone here
                })}
            </p>
        </div>
    );
}


// No changes needed in the main component below
export function WorldClockTooltip() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <Globe className="size-[18px]" />
            <span className="sr-only">Open world clock</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="w-80 p-0 border bg-background text-foreground">
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">World Clock</h4>
              <span className="text-xs font-mono text-muted-foreground">
                {currentTime.toLocaleTimeString([], { second: '2-digit' })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Separator />
          <div className="p-4 space-y-4">
            {timeZones.map((tz) => (
              <ClockDisplay
                key={tz.label}
                timeZone={tz.timeZone}
                label={tz.label}
                currentTime={currentTime}
              />
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}