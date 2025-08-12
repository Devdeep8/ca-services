import { db } from '@/lib/db';
import { ProjectRole } from '@prisma/client';

// Define a type for the task data to ensure consistency
type TaskData = {
  id: string;
};

// Custom error for clear, specific error handling
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Checks if a user is authorized to update a batch of tasks.
 * Throws an AuthorizationError if permission is denied.
 * @param userId - The ID of the user performing the action.
 * @param tasks - The array of tasks to be updated.
 */
export async function authorizeTaskUpdate(userId: string, tasks: TaskData[]): Promise<string> {
  const firstTaskId = tasks[0].id;
  const contextTask = await db.task.findUnique({
    where: { id: firstTaskId },
    select: {
      project: {
        select: {
          id: true,
          members: {
            where: { userId: userId },
            select: { role: true },
          },
        },
      },
    },
  });

  if (!contextTask?.project) {
    // Note: In a real app, you might want a different error type for "Not Found"
    throw new AuthorizationError('Associated project not found.');
  }

  const projectId = contextTask.project.id;
  const memberRole = contextTask.project.members[0]?.role;
  const isProjectLeadRole = memberRole === ProjectRole.LEAD;
  const taskIds = tasks.map(t => t.id);

  if (isProjectLeadRole) {
    const crossProjectTaskCount = await db.task.count({
      where: { id: { in: taskIds }, projectId: { not: projectId } },
    });
    if (crossProjectTaskCount > 0) {
      throw new AuthorizationError('Cannot modify tasks from different projects.');
    }
  } else {
    const unassignedTasksCount = await db.task.count({
      where: { id: { in: taskIds }, assigneeId: { not: userId } },
    });
    if (unassignedTasksCount > 0) {
      throw new AuthorizationError('You can only modify tasks assigned to you.');
    }
  }

  return projectId;

}