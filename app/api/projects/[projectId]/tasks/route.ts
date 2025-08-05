import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']), // Accepts status
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().optional(),
  reporterId: z.string().min(1, 'Reporter is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    const validation = createTaskSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse(JSON.stringify(validation.error), { status: 400 });
    }

    const { title, status, description, priority, dueDate, assigneeId, reporterId } = validation.data;

    // Transaction to get the next position and create the task
    const newTask = await db.$transaction(async (tx) => {
      // 1. Find the number of tasks in the target status column to determine position
      const taskCount = await tx.task.count({
        where: { projectId, status },
      });

      // 2. Create the new task
      return tx.task.create({
        data: {
          projectId,
          title,
          status,
          description,
          priority,
          position: taskCount, // Position is the new length of the column
          dueDate: dueDate ? new Date(dueDate) : undefined,
          assigneeId: assigneeId || null,
          reporterId,
        },
      });
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('[TASKS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}