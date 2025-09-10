"use client";
import CalendarDemo from '@/components/calendar/calendar-demo'
import {  useSearchParams } from "next/navigation";

export default function CalanderComponent( { projectId  } : {projectId: string} ) {
        const searchParams = useSearchParams();
      const workspaceId = searchParams.get("workspaceId")?.toString() || '';

  return( <CalendarDemo projectId={projectId} workspaceId={workspaceId} />)
}
