// @/app/projects/[projectId]/notes/page.tsx

import { db } from "@/lib/db"; // Adjust path
import { NotesEditor } from "../_components/Notes-Comp";
import { notFound } from "next/navigation";
import { NotebookTabs } from "lucide-react";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
    const {projectId} = await params
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { notes: true },
  });

  if (!project) {
    return notFound();
  }

  // The notes field is Json?, so it can be null or Prisma.JsonValue.
  // We provide a default empty state if no notes exist yet.
  const initialContent = project.notes ? (project.notes as any) : undefined;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <NotebookTabs className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Meeting Notes</h2>
      </div>

      <NotesEditor
        projectId={projectId}
        initialContent={initialContent}
      />
    </div>
  );
}