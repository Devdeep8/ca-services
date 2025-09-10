import { z } from "zod";
import { db } from "@/lib/db";
// Slim input schema (only user-facing fields)
export const CreateCalendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.string().nullable().optional(),
});

export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventSchema>;

/**
 * Creates a calendar event with defaults applied
 * @param data User-provided event data
 * @param userId Authenticated user id
 * @param workspaceId Current workspace id
 */
export async function createCalendarEvent(
  data: CreateCalendarEventInput,
  userId: string,
  workspaceCalendarId: string
) {
  return db.calendarItem.create({
    data: {
      ...data,
      createdById: userId,
      isAllDay: false,
      itemType: "EVENT",
      color: "#3B82F6",
      priority: "MEDIUM",
      status: "SCHEDULED",
      workspaceCalendarId: workspaceCalendarId as string
    },
  });
}
