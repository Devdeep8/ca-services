import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TaskStatus } from '@prisma/client';

// Import our new services and custom error
import { authorizeTaskUpdate, AuthorizationError } from '@/services/task-service/auth.service';
import { updateTaskOrder } from '@/services/task-service/task.service';

const updateTasksOrderSchema = z.array(
  z.object({
    id: z.string(),
    position: z.number(),
    status: z.nativeEnum(TaskStatus),
  })
);

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION (Controller's job)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const currentUserId = session.user.id;

    // 2. INPUT VALIDATION (Controller's job)
    const body = await request.json();
    const tasksToUpdate = updateTasksOrderSchema.parse(body.tasks); // .parse throws on failure
    
    if (tasksToUpdate.length === 0) {
      return NextResponse.json({ success: true, message: 'No tasks to update' });
    }

    // 3. AUTHORIZATION (Delegated to a service)
    await authorizeTaskUpdate(currentUserId, tasksToUpdate);

    // 4. EXECUTION (Delegated to a service)
    await updateTaskOrder(tasksToUpdate);

    // 5. RESPONSE (Controller's job)
    return NextResponse.json({ success: true, message: 'Tasks updated successfully' });

  } catch (error) {
    // 6. ERROR HANDLING (Controller's job)
    console.error('[TASKS_UPDATE_ORDER_POST]', error);

    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: 'Invalid input data', details: error.issues }), { status: 400 });
    }
    if (error instanceof AuthorizationError) {
      return new NextResponse(JSON.stringify({ error: error.message }), { status: 403 });
    }
    
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}