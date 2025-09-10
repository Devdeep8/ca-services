import { z } from "zod";
import { db } from "@/lib/db";
import { colorOptions } from "@/components/calendar/calendar-tailwind-classes";

// Slim input schema (only user-facing fields)
export const CreateCalendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  color: z.enum(colorOptions.map((c: any) => c.value) as [string, ...string[]]), 
  projectId: z.string(),
});

export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventSchema>;

export type CalendarEvent = {
  id: string;
  title: string;
  color: string;
  start: Date;
  end: Date;
};

/**
 * Creates a calendar event with defaults applied
 */
export async function createCalendarEvent(
  data: CreateCalendarEventInput,
  userId: string,
  workspaceCalendarId: string
): Promise<CalendarEvent> {
  const event = await db.calendarItem.create({
    data: {
      ...data,
      createdById: userId,
      isAllDay: false,
      itemType: "EVENT",
      priority: "MEDIUM",
      status: "SCHEDULED",
      workspaceCalendarId,
    },
    select: {
      id: true,
      title: true,
      color: true,
      startTime: true,
      endTime: true,
    },
  });

  return {
    id: event.id,
    title: event.title,
    color: event.color,
    start: event.startTime,
    end: event.endTime,
  };
}
