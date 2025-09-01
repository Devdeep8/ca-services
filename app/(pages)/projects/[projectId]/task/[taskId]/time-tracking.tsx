'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Timer } from 'lucide-react';
import { type TimeEntry } from '@prisma/client';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

// The parent component will now pass a client-safe entry type
type ClientTimeEntry = Omit<TimeEntry, 'date' | 'createdAt' | 'updatedAt'> & {
  date: string;
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; avatar: string | null };
}

interface TimeTrackingProps {
  taskId: string;
  initialTotalHours: number;
  timeEntries: ClientTimeEntry[];
  onTimeLog: (newEntry: ClientTimeEntry, newTotalHours: number) => void;
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return [hours, minutes, seconds]
    .map(v => v < 10 ? "0" + v : v)
    .join(":");
};

export function TimeTracking({ taskId, initialTotalHours, timeEntries, onTimeLog }: TimeTrackingProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTracking && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (intervalRef.current) {
        clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, startTime]);

  const logTime = async (secondsToLog: number) => {
    if (secondsToLog <= 1) {
      toast.info("Timer stopped.", { description: "Not enough time was tracked to create a log." });
      return;
    };
    const hoursToLog = secondsToLog / 3600;

    try {
      const response = await fetch(`/api/tasks/${taskId}/time-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: hoursToLog, date: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('Failed to log time entry.');
      
      const { newTimeEntry, actualHours } = await response.json();
      onTimeLog(newTimeEntry, actualHours);
      // FIX: Correct toast notification syntax
      toast.success('Time logged successfully!');

    } catch (error) {
      // FIX: Correct toast notification syntax
      toast.error('Failed to log time', { description: (error as Error).message });
    }
  };

  const handleToggleTracking = () => {
    if (isTracking) {
      setIsTracking(false);
      logTime(elapsedTime);
      setStartTime(null);
      setElapsedTime(0);
    } else {
      setIsTracking(true);
      setStartTime(Date.now());
    }
  };

  const runningTotalSeconds = initialTotalHours * 3600 + elapsedTime;

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Time Tracking</h3>
          <Button onClick={handleToggleTracking} size="sm" variant={isTracking ? 'destructive' : 'default'}>
            {isTracking ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {isTracking ? 'Stop' : 'Start'}
          </Button>
      </div>
      <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3 text-muted-foreground"><Timer className="h-5 w-5" /><span>Total time spent</span></div>
          <span className="font-mono text-lg font-semibold text-foreground">{formatTime(runningTotalSeconds)}</span>
      </div>
      {isTracking && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          Currently tracking time... Current session: {formatTime(elapsedTime)}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {timeEntries.map(entry => (
            <div key={entry.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage className='object-cover' src={entry.user.avatar || ''} />
                        <AvatarFallback>{entry.user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground">{entry.user.name} logged time</span>
                </div>
                <div className="text-right">
                    <p className="font-semibold">{Number(entry.hours).toFixed(2)} hrs</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(entry.date), { addSuffix: true })}</p>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}