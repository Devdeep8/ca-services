import { NextRequest, NextResponse } from 'next/server';
import { TaskStatus } from '@prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const updateTasksOrderSchema = z.array(
  z.object({
    id: z.string(),
    position: z.number(),
    status: z.nativeEnum(TaskStatus),
  })
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const currentUserId = session.user.id;

    const body = await request.json();

    const {tasks ,column } = body
    const validation = updateTasksOrderSchema.safeParse(tasks);

    if (!validation.success) {
      return new NextResponse(JSON.stringify({ error: 'Invalid input data' }), { status: 400 });
    }
    const tasksToUpdate = validation.data;
    
    if (tasksToUpdate.length === 0) {
        return NextResponse.json({ success: true, message: 'No tasks to update' });
    }

    // Authorization Check: Ensure the user is a member of the project.
    const firstTaskId = tasksToUpdate[0].id;
    const task = await db.task.findUnique({
        where: { id: firstTaskId },
        select: { projectId: true }
    });

    if (!task) {
        return new NextResponse(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }

    const membership = await db.projectMember.findUnique({
        where: {
            projectId_userId: {
                projectId: task.projectId,
                userId: currentUserId,
            }
        }
    });
    
    if (!membership) {
        return new NextResponse(JSON.stringify({ error: 'You do not have permission to modify tasks in this project.' }), { status: 403 });
    }

    // Database Transaction to update all tasks at once.
    await db.$transaction(async (tx) => {
      for (const taskUpdate of tasksToUpdate) {
        await tx.task.update({
          where: { id: taskUpdate.id },
          data: {
            position: taskUpdate.position,
            status: taskUpdate.status,
          },
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Tasks updated successfully' });
  } catch (error) {
    console.error('[TASKS_UPDATE_ORDER_POST]', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}