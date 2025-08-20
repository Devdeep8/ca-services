import { db } from '@/lib/db';

/**
 * Deletes a project directly from the database.
 * This service performs NO authorization checks.
 * @param projectId The ID of the project to delete.
 * @returns The deleted project data.
 */
export async function deleteProjectFromDb(projectId: string) {
  const deletedProject = await db.project.delete({
    where: {
      id: projectId,
    },
  });

  if (!deletedProject) {
    throw new Error('Project not found or was already deleted.');
  }

  return deletedProject;
}