import { db } from '@/lib/db';
import { ProjectRole, TaskStatus } from '@prisma/client';
import { authorizeProjectMember, AuthorizationError } from './auth.service';
import { TaskFormData } from '@/lib/zod';
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




// lib/services/task.service.ts

import { ProjectCreationError } from "@/utils/errors"; // Import your custom error

/**
 * Creates a new task after performing business logic checks.
 * @param data - Validated data from the request body.
 * @param userId - The ID of the authenticated user.
 * @throws {ProjectCreationError} if the user is not a member of the project.
 */
// lib/services/task.service.ts

/**
 * Creates a new task and its associated attachments in a single transaction.
 * @param data - Validated data, including an optional 'attachments' array.
 * @param userId - The ID of the authenticated user.
 */
export async function createTask(data: TaskFormData, userId: string) {
  // 1. Separate the attachments from the rest of the task data
  const { attachments, ...taskData } = data;

  // 2. Business Logic: Verify user membership (remains the same)
  const projectMember = await db.projectMember.findUnique({
    where: {
      projectId_userId: { projectId: taskData.projectId, userId: userId },
    },
  });

  if (!projectMember) {
    throw new ProjectCreationError(
      'You are not authorized to create tasks in this project.',
      'FORBIDDEN'
    );
  }

  // 3. Database Operation: Use a transaction for atomicity
  const newTask = await db.$transaction(async (tx) => {
    // First, create the main task record
    const createdTask = await tx.task.create({
      data: {
        ...taskData,
        position: 0, // Your existing logic
        actualHours: 0, // Your existing logic
      },
    });

    // Second, if attachments were provided, create them
    if (attachments && attachments.length > 0) {
      // Use createMany for efficiency
      await tx.taskAttachment.createMany({
        data: attachments.map((att) => ({
          ...att, // Spread the attachment metadata (url, filename, etc.)
          taskId: createdTask.id, // Link to the task we just created
          userId: userId,         // Link to the user who uploaded
        })),
      });
    }

    // The transaction returns the created task
    return createdTask;
  });

  // To return the task with its attachments, you might need a subsequent query
  // This is optional, depending on what your frontend needs immediately after creation
  const taskWithAttachments = await db.task.findUnique({
    where: { id: newTask.id },
    include: {
      attachments: true, // Include the newly created attachments in the response
    },
  });

  return taskWithAttachments;
}