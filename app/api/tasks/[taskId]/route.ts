import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TaskStatus, Priority } from '@prisma/client';

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const currentUserId = session.user.id;
    const { taskId } = await params;

    const body = await request.json();
    const validation = updateTaskSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse(JSON.stringify(validation.error.flatten()), { status: 400 });
    }
    const { status, ...updateData } = validation.data;

    // Authorization Check
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, status: true },
    });
    if (!task) {
      return new NextResponse(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }

    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: currentUserId } },
    });
    if (!membership) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Transaction for Status Change
    if (status && status !== task.status) {
      const updatedTask = await db.$transaction(async (tx) => {
        const newPosition = await tx.task.count({
          where: { projectId: task.projectId, status: status },
        });

        return tx.task.update({
          where: { id: taskId },
          data: {
            ...updateData,
            status: status,
            position: newPosition,
          },
        });
      });
       return NextResponse.json(updatedTask);
    } else {
       const updatedTask = await db.task.update({
           where: { id: taskId },
           data: updateData,
       });
       return NextResponse.json(updatedTask);
    }
  } catch (error) {
    console.error('[TASK_PATCH]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }
      const { taskId } = await params;
  
      const task = await db.task.findUnique({
        where: { id: taskId },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          reporter: { select: { id: true, name: true, avatar: true } },
          comments: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          timeEntries: {
            orderBy: { createdAt: 'desc' },
          },
          // We will fetch activity logs separately if needed, to keep this initial load fast
        },
      });
  
      if (!task) {
        return new NextResponse(JSON.stringify({ error: 'Task not found' }), { status: 404 });
      }
  
      // Authorization: Check if the user is a member of the project
      const membership = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: session.user.id } },
      });
      if (!membership) {
        return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
  
      return NextResponse.json(task);
    } catch (error) {
      console.error('[TASK_GET]', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }