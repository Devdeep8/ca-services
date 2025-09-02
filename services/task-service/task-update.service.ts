// src/services/task.service.ts

import {db} from "@/lib/db"
import { Task } from "@prisma/client";
// Initialize Prisma client

// Define the possible status values to match your Prisma schema
// This ensures type safety when calling the function.
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

/**
 * Updates the status of a specific task.
 * @param {string} taskId - The ID of the task to update.
 * @param {TaskStatus} newStatus - The new status for the task.
 * @returns {Promise<{ task: Task | null; error: string | null }>} - An object containing the updated task on success, or an error message on failure.
 */
export const updateTaskStatus = async (
  taskId: string,
  newStatus: TaskStatus
): Promise<{ task: Task | null; error: string | null }> => {
  try {
    // 1. Find the task and update its status in a single database operation
    const updatedTask = await db.task.update({
      where: {
        id: taskId,
      },
      data: {
        status: newStatus,
      },
    });

    // 2. If successful, return the updated task and a null error
    return { task: updatedTask, error: null };
  } catch (error: any) {
    // 3. Handle potential errors
    console.error(`Failed to update status for task ${taskId}:`, error);

    // Prisma throws a specific error code 'P2025' if the record to update is not found
    if (error.code === 'P2025') {
      return { task: null, error: `Task with ID '${taskId}' not found.` };
    }

    // For all other errors, return a generic error message
    return { task: null, error: 'An unexpected error occurred while updating the task.' };
  }
};




/**
 * Checks if a user is authorized to access a task.
 * Authorization is granted if the user is the task's assignee or its reporter.
 * @param {string} taskId - The ID of the task to check.
 * @param {string} userId - The ID of the user requesting access.
 * @returns {Promise<{ authorized: boolean; error: string | null; reason?: 'NOT_FOUND' | 'FORBIDDEN' | 'INTERNAL_SERVER_ERROR' }>} 
 * An object indicating if the user is authorized and providing an error message if not.
 */
export const canUserAccessTask = async (
  taskId: string,
  userId: string
): Promise<{ authorized: boolean; error: string | null; reason?: 'NOT_FOUND' | 'FORBIDDEN' | 'INTERNAL_SERVER_ERROR' }> => {
  try {
    // 1. Fetch only the necessary IDs for the authorization check
    const task = await db.task.findUnique({
      where: {
        id: taskId,
      },
      select: {
        assigneeId: true,
        reporterId: true,
      },
    });

    // 2. Handle case where the task does not exist
    if (!task) {
      return { authorized: false, error: 'Task not found.', reason: 'NOT_FOUND' };
    }

    // 3. Perform the authorization check
    const isAssignee = task.assigneeId === userId;
    const isReporter = task.reporterId === userId;

    if (isAssignee || isReporter) {
      // 4. User is authorized, return success
      return { authorized: true, error: null };
    } else {
      // 5. User is not the assignee or reporter, return forbidden
      return { authorized: false, error: 'User is not authorized to access this task.', reason: 'FORBIDDEN' };
    }
  } catch (error) {
    console.error(`Authorization check failed for task ${taskId} and user ${userId}:`, error);
    return { authorized: false, error: 'An unexpected error occurred.', reason: 'INTERNAL_SERVER_ERROR' };
  }
};