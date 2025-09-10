'use server'

import { db } from '@/lib/db'
import { CalendarEvent } from '@/components/calendar/calendar-types'

/**
 * Fetches calendar data for a specific project from three sources:
 * 1. CalendarItems: Directly created events, meetings, etc.
 * 2. Tasks: Task due dates are converted into all-day calendar events.
 * 3. Project: The project's own due date is converted into an all-day milestone event.
 *
 * @param projectId The ID of the project to fetch data for.
 * @returns A promise that resolves to an array of CalendarEvent objects.
 */
export async function getProjectCalendarData(
  workspaceId: string,
  projectId?: string,
): Promise<CalendarEvent[]> {
  try {
    // Define the query conditions
    const calendarItemWhere = projectId
      ? { workspaceCalendar: { workspaceId }, projectId: projectId }
      : { workspaceCalendar: { workspaceId } }

    const taskWhere = projectId
      ? { project: { workspaceId }, projectId: projectId, dueDate: { not: null } }
      : { project: { workspaceId }, dueDate: { not: null } }
    
    const projectWhere = projectId
      ? { workspaceId: workspaceId, id: projectId, dueDate: { not: null } }
      : { workspaceId: workspaceId, dueDate: { not: null } }


    // Fetch all data sources in parallel for efficiency
    const [calendarItems, tasks, projects] = await Promise.all([
      // 1. Fetch dedicated calendar items
      db.calendarItem.findMany({
        where: calendarItemWhere,
      }),
      // 2. Fetch tasks with due dates to show as calendar events
      db.task.findMany({
        where: taskWhere,
        select: { id: true, title: true, dueDate: true },
      }),
      // 3. Fetch the project's own due date to show as a milestone
      db.project.findMany({
        where: projectWhere,
        select: { id: true, name: true, dueDate: true },
      }),
    ])

    // Map CalendarItems to CalendarEvent format
    const eventsFromItems: CalendarEvent[] = calendarItems.map((item) => ({
      id: item.id,
      title: item.title,
      start: item.startTime,
      end: item.endTime,
      color: item.color,
      allDay: item.isAllDay,
    }))

    // Map Tasks to CalendarEvent format
    const eventsFromTasks: CalendarEvent[] = tasks.map((task) => ({
      id: `task-${task.id}`,
      title: `[Task] ${task.title}`,
      start: task.dueDate!,
      end: task.dueDate!,
      color: '#F59E0B', // A default color for tasks (e.g., amber-500)
      allDay: true,
    }))

    // Map Project due date to CalendarEvent format
    const eventsFromProjects: CalendarEvent[] = projects.map((project) => ({
      id: `project-${project.id}`,
      title: `[Milestone] Project Due: ${project.name}`,
      start: project.dueDate!,
      end: project.dueDate!,
      color: '#EF4444', // A default color for project milestones (e.g., red-500)
      allDay: true,
    }))

    // Combine all events into a single array
    const allEvents = [
      ...eventsFromItems,
      ...eventsFromTasks,
      ...eventsFromProjects,
    ]

    return allEvents
  } catch (error) {
    console.error('Failed to fetch calendar data:', error)
    return [] // Return an empty array on error
  }
}