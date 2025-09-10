'use client'

import { useState, useEffect } from 'react'
import Calendar from './calendar'
import { CalendarEvent, Mode } from './calendar-types'
import { getProjectCalendarData } from '@/actions/calendar-actions' // 👈 Import the new action

// Define the props for the component
interface CalendarDemoProps {
  workspaceId: string;
  projectId?: string; // projectId is now a prop
}

export default function CalendarDemo({ workspaceId, projectId }: CalendarDemoProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true) // 👈 Add loading state
  const [mode, setMode] = useState<Mode>('month')
  const [date, setDate] = useState<Date>(new Date())

  // useEffect to fetch data when the component mounts or projectId changes
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true) // Start loading
      // Fetch data from the server action, passing the projectId
      const data = await getProjectCalendarData(workspaceId, projectId)
      setEvents(data)
      setIsLoading(false) // Stop loading
    }

    fetchEvents()
  }, [workspaceId, projectId]) // 👈 Re-run effect if projectId changes

  if (isLoading) {
    return <div>Loading Calendar...</div> // 👈 Show a loading message
  }

  return (
    <Calendar
      events={events}
      setEvents={setEvents}
      mode={mode}
      setMode={setMode}
      date={date}
      setDate={setDate}
      projectId={projectId} // Pass projectId to the child component
    />
  )
}