import CalanderComponent from "../_components/ProjectCalendar";

export default async function CalendarPage({ params }: { params: Promise<{ projectId: string }> }) {
    
    const { projectId } = await params;

    return (
        <div>
           <CalanderComponent projectId={projectId}  />
        </div>
    );
}