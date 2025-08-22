// app/api/tasks/form-context/route.ts

import { NextResponse } from 'next/server';
import { getTaskFormContextData } from '@/services/task-service/task.for-my-task-page.service';
import { getCurrentUser } from '@/utils/getcurrentUser'; // Placeholder for your auth logic

export async function GET() {
  try {
    // Responsibility 1: Authentication
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Responsibility 2: Calling the business logic
    const formContextData = await getTaskFormContextData(user.id );

    // Responsibility 3: Returning the HTTP response
    return NextResponse.json(formContextData);
    
  } catch (error) {
    console.error('[TASKS_FORM_CONTEXT_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}