import { db } from '@/lib/db';
import { ProjectRole, TaskStatus } from '@prisma/client';
import { authorizeProjectMember, AuthorizationError } from './auth.service';

type TaskUpdateData = {
  id: string;
  position: number;
  status: TaskStatus;
};

/**
 * This is our new main service function. It handles all business logic.
 * 1. Authorizes the user.
 * 2. Fetches current task states.
 * 3. Applies granular permissions for status changes.
 * 4. Calls the function to update the database.
 */
export async function processAndValidateTaskUpdates(
  userId: string,
  projectId: string,
  tasksToUpdate: TaskUpdateData[]
): Promise<void> {
  // 1. Gatekeeper Authorization: Is the user even a member?
  const userRole = await authorizeProjectMember(userId, projectId);
  const isProjectLead = userRole === ProjectRole.LEAD;

  // 2. Fetch Data: Get the current state of tasks for comparison.
  const taskIds = tasksToUpdate.map((t) => t.id);
  const existingTasks = await db.task.findMany({
    where: { id: { in: taskIds } },
  });
  const existingTasksMap = new Map(existingTasks.map((task) => [task.id, task]));

  const tasksThatChanged: TaskUpdateData[] = [];

  // 3. Granular Logic: Loop through tasks and apply specific rules.
  for (const task of tasksToUpdate) {
    const existingTask = existingTasksMap.get(task.id);
    if (!existingTask) continue;

    const statusHasChanged = existingTask.status !== task.status;
    const positionHasChanged = existingTask.position !== task.position;

    // If status is changing, apply the stricter check.
    if (statusHasChanged) {
      if (!isProjectLead && existingTask.assigneeId !== userId) {
        throw new AuthorizationError(
          `Cannot change status for task "${existingTask.title}". You are not the assignee or a project lead.`
        );
      }
    }

    // If anything changed (and passed auth), add it to our final update list.
    if (statusHasChanged || positionHasChanged) {
      tasksThatChanged.push(task);
    }
  }

  // 4. Execution: If there are changes, update the database.
  if (tasksThatChanged.length > 0) {
    await updateTaskOrder(tasksThatChanged);
  }
}

/**
 * Updates the order/status of multiple tasks in a single transaction.
 * This function does not change.
 */
export async function updateTaskOrder(tasks: TaskUpdateData[]): Promise<void> {
  await db.$transaction(async (tx) => {
    for (const taskUpdate of tasks) {
      await tx.task.update({
        where: { id: taskUpdate.id },
        data: {
          position: taskUpdate.position,
          status: taskUpdate.status,
        },
      });
    }
  });
}