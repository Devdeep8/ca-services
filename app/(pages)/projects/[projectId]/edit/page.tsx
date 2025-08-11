// app/projects/[projectId]/edit/page.tsx
import { getProjectForEdit, getAllUsers } from '@/lib/data';
import { ProjectEditForm } from '@/components/project-module/project-edit-form';

export default async function ProjectEditPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
  // Fetch data in parallel on the server
  const [project, users] = await Promise.all([
    getProjectForEdit(projectId),
    getAllUsers(),
  ]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Edit Project</h1>
        <p className="text-muted-foreground mb-8">
          Update the details for "{project.name}".
        </p>
        {/* Pass server-fetched data to the client component */}
        <ProjectEditForm initialProject={project} allUsers={users} />
      </div>
    </div>
  );
}