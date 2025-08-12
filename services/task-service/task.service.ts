import { db } from '@/lib/db';
import { TaskStatus } from '@prisma/client';

// Define a more specific type for the task update data
type TaskUpdateData = {
  id: string;
  position: number;
  status: TaskStatus;
};

/**
 * Updates the order and status of multiple tasks within a single database transaction.
 * @param tasks - The array of tasks with their new data.
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